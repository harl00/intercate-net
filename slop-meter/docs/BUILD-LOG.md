# slop-meter — build log & design notes

> A detailed write-up of how `slop-meter` was built: the idea, the decisions, the
> architecture, the deployment, and the things that went wrong along the way.
> Written as source material for a future article and as onboarding for anyone
> extracting this into its own repo.

---

## 1. The idea

There's a growing reflex among readers to sniff out **AI slop** — text that's
formulaic, padded, benign, and obviously machine-extruded. I wanted a way for a
reader to register that judgement about something I'd written, **anonymously** and
in a way that's a little bit fun rather than a dreary thumbs-up/down.

Three principles set the whole design:

1. **Anonymous** — no logins, no accounts, no cookies, no personal data stored.
2. **Engaging** — a slider you drag from "human craft" to "pure slop", with a
   playful live label and a little emoji burst when you vote, then a reveal of how
   the crowd scored it.
3. **Separable & reusable** — built as a standalone function that could be lifted
   out and deployed on any site later, not welded to one blog.

That third principle is the one that shaped the architecture most.

---

## 2. Constraints that drove the architecture

The host site (intercate.net) is a **static** Astro site on GitHub Pages, fronted
by Cloudflare. Static hosting means there's no server to record votes — so
persistence has to live somewhere else.

Because the site already sits behind **Cloudflare**, a **Cloudflare Worker** was
the natural backend: serverless, generous free tier, same network edge, and — the
clincher — it's *independently deployable*, which satisfies the "reusable
elsewhere" requirement. The Worker has nothing to do with this site specifically;
it's keyed by an opaque `id`, so one deployment can serve many sites.

That gives the core two-part split:

```
        ┌─────────────────────────┐         ┌──────────────────────────┐
        │   <slop-meter> widget    │  HTTPS  │   Cloudflare Worker API   │
        │  (embeddable web cmpt)   │ ──────▶ │   POST /vote  GET /stats  │
        │  shadow DOM, no deps     │ ◀────── │   GET /summary (owner)    │
        └─────────────────────────┘  JSON   └────────────┬─────────────┘
                                                          │
                                                   ┌──────▼──────┐
                                                   │  D1 (SQLite) │
                                                   │   votes      │
                                                   └─────────────┘
```

The **widget** (face) and the **Worker** (brain) are fully decoupled. A third
surface — an **owner-only dashboard** — was added later on top of the same data.

---

## 3. Key decisions

These were settled up front before building:

| Decision | Choice | Why |
|---|---|---|
| Interaction | **Slider + emoji burst** | A 0–100 continuous signal is richer than buttons and more playful; the burst rewards voting. |
| Results | **Reveal the crowd average** | Social proof; more engaging and shareable than a silent "thanks". |
| Storage | **Cloudflare Worker + D1** | Already on Cloudflare; D1 stores per-vote rows so slop perception can be analysed over time, not just counters (which KV would give). |
| Identity | **None — salted IP hash for dedup only** | Anonymous by construction; no PII at rest. |

---

## 4. Data model (D1 / SQLite)

```sql
CREATE TABLE votes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id     TEXT    NOT NULL,   -- opaque id of the thing being rated
  score       INTEGER NOT NULL,   -- 0 (human craft) .. 100 (pure slop)
  created_at  INTEGER NOT NULL,   -- unix epoch ms
  vote_day    TEXT    NOT NULL,   -- YYYY-MM-DD (UTC)
  ip_hash     TEXT    NOT NULL    -- salted, daily, per-post hash — never the raw IP
);
CREATE UNIQUE INDEX idx_votes_dedup ON votes(post_id, vote_day, ip_hash);
```

**The dedup trick.** The unique index on `(post_id, vote_day, ip_hash)` enforces
"one vote per anonymous bucket per post per day" *at the database level*. The
insert uses `ON CONFLICT … DO UPDATE`, so a re-vote on the same day **updates** the
score in place rather than stacking a second row — which is exactly the
"change your mind any time" behaviour the widget promises.

**The privacy trick.** `ip_hash = sha256(SALT + day + post_id + IP)`, truncated.
- The raw IP is never stored.
- Including `day` means the hash rotates daily — yesterday's hash can't be matched to today's.
- Including `post_id` means the same person voting on two posts produces unrelated hashes — votes can't be correlated across posts.

So the only identifier at rest is a one-way value that's useless for tracking.

---

## 5. The API (Worker)

| Method | Path | Auth | Returns |
|---|---|---|---|
| `POST` | `/vote` | none | `{ ok, you, count, average, histogram }` |
| `GET` | `/stats?id=<id>` | none | `{ id, count, average, histogram }` |
| `GET` | `/summary` | Bearer `ADMIN_TOKEN` | `{ posts: [{ post_id, count, average, min, max, last_at }] }` |
| `GET` | `/` | none | health check |

Notable bits:
- **Input validation**: `id` matched against `^[\w\-/:.]{1,128}$`; `score` clamped to 0–100.
- **CORS** is configurable via `ALLOWED_ORIGINS` (comma-separated, or `*`); the Worker
  echoes the matching origin and always answers the preflight `OPTIONS`.
- **`/summary`** is the owner-only feed that powers dashboards (and, later, an MCP).
  Gated by an `ADMIN_TOKEN` secret; returns one aggregated row per post.
- **Histogram** is computed in SQL as ten buckets (`score/10`, with 100 folded into
  the last), so the widget and dashboard can draw a distribution cheaply.

---

## 6. The widget (`<slop-meter>`)

A single-file **web component** — no framework, no dependencies — that renders into
**shadow DOM** so its styles can't leak or be clobbered by the host page.

- Attributes: `post-id` (defaults to `location.pathname`) and `endpoint` (Worker base URL).
- A range input drives a live label keyed to seven ranges ("Unmistakably human." …
  "Peak slop. Bleep bloop.") with a matching emoji.
- On submit it `POST`s to `/vote`, stores the score in `localStorage` (so the UI
  shows "you've voted" on return, and re-votes update), then reveals the crowd
  average plus a sparkline histogram with the user's bucket highlighted.
- The **emoji burst** uses the Web Animations API (`element.animate`) — lightweight,
  and it respects `prefers-reduced-motion`.
- **Theming**: the component reads `var(--accent)`, `var(--font-body)`, and a small
  set of `--slop-*` custom properties. Custom properties *inherit through* the shadow
  boundary, so the host page can theme the widget (the Astro site passes its
  light/dark palette straight in).

---

## 7. Site integration (Astro)

The widget is wired into the blog post layout (`Post.astro`) behind a feature flag:

```js
const SLOP_ENDPOINT = 'https://slop.intercate.net'; // empty string hides it
```

When the endpoint is empty the element and its loader script don't render at all —
so the feature could be committed and deployed **dormant**, then switched on by
flipping one constant once the Worker was live. The widget JS itself is served by
the site from `public/slop-meter.js` (a copy of the canonical
`widget/slop-meter.js`); the API calls go to the Worker.

---

## 8. The owner dashboard

A self-contained, **token-gated** HTML page (`public/slop-dashboard.html`,
`noindex`, unlinked) that calls `/summary`:

- Prompts once for the endpoint + `ADMIN_TOKEN`, stored in `localStorage`.
- Shows top-line stats (posts rated, total votes, weighted overall average, count
  flagged) and a sortable table: post → votes → avg slop (colour-coded green→red
  with emoji) → min–max range → last vote.
- **Actionable flag**: posts averaging ≥ 60 with ≥ 3 votes get a ⚠ — the
  "go and look at this one" signal.

The page being public is fine: it's useless without the token, which the API
enforces (401 without it).

---

## 9. Deployment

```bash
cd slop-meter
npm install
npx wrangler d1 create slop-meter        # paste database_id into wrangler.toml
npm run db:init                          # create the table (remote)
npx wrangler secret put SALT             # IP-hash salt
npx wrangler secret put ADMIN_TOKEN      # dashboard/summary token
npm run deploy
```

- **Custom domain**: a `custom_domain` route in `wrangler.toml` puts the API on
  `slop.intercate.net` — Wrangler provisions the DNS record + cert automatically
  because the zone is on the same Cloudflare account. This avoids exposing the
  account's `*.workers.dev` subdomain (which is account-wide and, by default,
  derived from the account name).
- **CORS** is then locked to `https://intercate.net,https://www.intercate.net`.

---

## 10. Things that went wrong (and the fixes)

A faithful log, because these are the most useful part for an article.

1. **Loader script emitted after `</html>`.** The conditional
   `<script src="/slop-meter.js">` was placed after the `<Base>` layout, so it
   landed just outside the closing tag. Browsers usually relocate and run it, but
   it's sloppy and a likely cause of "I can't see it" in some browsers. **Fix:**
   move the include inside the rendered section (next to the `<slop-meter>`
   element) so it sits within `<body>`.

2. **CORS preflight blocked the dashboard.** The `/summary` call sends an
   `Authorization` header, which triggers a preflight `OPTIONS`. The Worker's
   `Access-Control-Allow-Headers` only listed `content-type`, so the browser
   refused the real request with *"Request header field authorization is not
   allowed."* **Fix:** add `authorization` to the allowed headers. Lesson: any
   custom request header (including `Authorization`) must be advertised in the
   preflight response.

3. **A secret created with the token as its *name*.** Running
   `wrangler secret put <the-token-string>` set the secret's **name** to the token
   value (the argument is the binding name; the value is entered at the prompt).
   Because **secret names are visible** in `wrangler secret list` and the
   dashboard, the string was effectively burned. **Fix:** `wrangler secret delete
   "<that-name>"`, then `wrangler secret put ADMIN_TOKEN` with a *new* random value
   at the prompt. Lesson worth writing up: the thing after `secret put` is the
   name, not the secret.

4. **`workers.dev` URL carried the account name.** The default Worker URL is
   `<worker>.<account-subdomain>.workers.dev`, and the account subdomain defaulted
   to a personal name. Rather than change the account-wide subdomain (which would
   rename *every* Worker), the custom domain `slop.intercate.net` sidesteps it
   entirely.

5. **Wrangler version drift.** Built on Wrangler 3.x with a "please update to 4.x"
   warning; deployed fine. Updated to v4 afterwards. Non-blocking, but worth
   pinning in `package.json` for a clean repo.

---

## 11. Privacy & security posture (summary)

- No accounts, no cookies, no PII stored. Only a salted, daily, per-post one-way
  IP hash, used solely for dedup/rate-limiting.
- Public endpoints (`/vote`, `/stats`) are rate-limited by the dedup constraint;
  `/summary` is token-gated.
- CORS limits *browser* embedding to the configured origins. It is not a hard auth
  wall — the dedup constraint is the real guard against scripted vote-stuffing.
- The dashboard token lives only in the owner's browser `localStorage`.

---

## 11a. Content versioning & the feedback loop

The point of the project isn't really the votes — it's the loop: pair each rating
with the *exact content that earned it*, learn what reads as slop, and write better.
That needs every vote bound to the version of the content the reader actually saw,
because posts change.

The design:

- **Version = a hash of the post's markdown body**, computed at build time. It only
  changes when the words change (not on frontmatter tweaks), so it groups votes by
  content state cleanly. A bare commit SHA would have been too coarse — it bumps on
  every deploy.
- The post page injects `content-version` and `content-source` onto the
  `<slop-meter>` element. The source is a per-post **`/blog/<slug>.md`** endpoint
  that serves the raw markdown.
- Each vote carries the version (+ source). The worker stores `content_version` on
  the vote, and — the first time it sees a new version — captures **one snapshot per
  `(post, version)`**, never per vote. Storage scales with *revisions*, not votes.
- Capture is **server-side and verified**: the worker fetches the source, re-hashes
  it, and only stores it if the hash matches the claimed version. The browser never
  uploads content, and a client can't poison the store. Fetches are origin-allowlisted
  (SSRF guard) and run in the background via `waitUntil`.

**Why store the text at all, when it's on the live site / in git?** Because the live
`.md` and git history both change or can be rewritten. Snapshotting into D1 makes the
rating-to-content link durable and **independent of git** — so history can still be
scrubbed without losing the dataset. Adopters who prefer to keep history can flip
`SNAPSHOT_MODE=ref` and store just a git-pinned source URL instead (no copy).

A neat side effect: the `/blog/<slug>.md` endpoints built for snapshots are also a
clean, token-efficient representation for LLM/agent readers — the seed of a separate
"make the site agent-readable" project.

## 12. Roadmap

- **Remote MCP on the Worker** → connect in Claude Cowork, ask for insights, and
  have Claude render a **live artifact** dashboard. `/summary` and `/versions` are
  already the data sources this would wrap. (The token stays server-side in the MCP
  layer, never in a shared artifact.)
- **Surface versions in the dashboard** — `/versions` exists; show the
  "v1: 71 → v2: 38" trend as you revise a post.
- **Abuse hardening** — optional per-IP global rate limit; optional proof-of-work
  or Turnstile if it ever gets gamed.
- **Distribution** — publish the widget to npm / a CDN so other sites embed it with
  one script tag.

---

## 13. Extracting to its own repo

Everything needed lives in this `slop-meter/` directory — it has no dependency on
the surrounding Astro site. To split it out:

1. Copy `slop-meter/` to a new repo root.
2. Keep: `src/`, `widget/`, `schema.sql`, `wrangler.toml`, `package.json`,
   `README.md`, `docs/`, `.gitignore`, `.dev.vars.example`.
3. Add a `LICENSE` (MIT recommended for broad reuse).
4. The host site just needs a copy of `widget/slop-meter.js` (served statically) and
   the `<slop-meter>` element pointing at the deployed Worker — document that in the
   README's "Embed" section.
5. Optionally add a tiny demo `index.html` that embeds the widget against a public
   demo Worker.

---

## 14. Article angles

- "An anonymous, anti-slop feedback widget — and why the *receipt* comes from the
  reader." (Ties to the agentic-transparency theme: feedback signals as first-class
  artifacts.)
- The privacy pattern: useful anti-abuse dedup with **zero** PII at rest.
- The reusability discipline: building a feature as a deployable function from day
  one (opaque ids, decoupled widget/API) rather than welding it to one site.
- A short blooper reel: the CORS preflight, the self-named secret, the stray script
  tag — small, common, instructive mistakes.
