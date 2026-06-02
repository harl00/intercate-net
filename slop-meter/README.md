# slop-meter

An anonymous, playful **"is this AI slop?"** rating widget. Two decoupled parts,
so it can be dropped onto any site:

- **`src/worker.js`** — a Cloudflare Worker API backed by D1 (the brain).
- **`widget/slop-meter.js`** — a self-contained `<slop-meter>` web component (the face).

Readers drag a slider from *human craft* → *pure slop*, vote, and see the crowd
average. No accounts, no cookies; dedup uses a salted hash of the IP that is
never stored raw.

For the full story of how this was built — decisions, gotchas, roadmap — see
[`docs/BUILD-LOG.md`](docs/BUILD-LOG.md).

## API

| Method | Path                 | Auth                | Returns                                            |
|--------|----------------------|---------------------|----------------------------------------------------|
| POST   | `/vote`              | none                | `{ ok, you, count, average, histogram }`           |
| GET    | `/stats?id=<id>`     | none                | `{ id, count, average, histogram }`                |
| GET    | `/summary`           | Bearer `ADMIN_TOKEN`| `{ posts: [{ post_id, count, average, min, max, last_at, versions }] }` |
| GET    | `/versions?id=<id>`  | Bearer `ADMIN_TOKEN`| per-version breakdown (`&text=1` to include snapshots) |
| GET    | `/`                  | none                | health check                                       |

`id` is any opaque string (≤128 chars), so one deployment serves many sites.
`score` is 0 (human craft) … 100 (pure slop).

### Content versioning

`POST /vote` optionally takes `version` (a hash of the rated content) and `source`
(a URL the content can be fetched from). The first time a new version is seen, the
worker captures **one snapshot per `(post, version)`** — never per vote — so ratings
stay tied to the exact content that earned them as a post evolves. Controlled by
`SNAPSHOT_MODE`:

- **`d1`** (default) — fetch `source`, verify it hashes to `version`, store the text in D1. Git-independent: you can rewrite/scrub source history and the dataset survives.
- **`ref`** — store only the `source` URL (e.g. a commit-pinned raw URL); reconstruct text on demand. Elegant if you keep history.
- **`off`** — record the version on votes, capture nothing.

Snapshot fetches are restricted to `SNAPSHOT_SOURCE_ORIGINS` (defaults to
`ALLOWED_ORIGINS`; `"*"` disables fetching) as an SSRF guard.

On the embed side, pass `content-version` and `content-source` attributes on the
`<slop-meter>` element; the host site computes the version from its source (for an
Astro site, hash the markdown body and serve it at `/blog/<slug>.md`).

## Deploy the API (Cloudflare)

```bash
cd slop-meter
npm install

# 1. Create the D1 database, then paste the printed database_id into wrangler.toml
npx wrangler d1 create slop-meter

# 2. Create the table
npm run db:init          # remote   (or: npm run db:init:local for local dev)

# 3. Set the secrets (any long random strings)
npx wrangler secret put SALT          # hashes IPs for dedup
npx wrangler secret put ADMIN_TOKEN   # gates GET /summary (dashboard)

# 4. Ship it
npm run deploy
```

> Note: the argument to `wrangler secret put` is the **binding name**
> (`SALT`, `ADMIN_TOKEN`) — the secret *value* is entered at the prompt.

For local development, copy `.dev.vars.example` to `.dev.vars` and run
`npm run dev` (serves the API at `http://localhost:8787`).

Note the deployed URL (e.g. `https://slop-meter.<account>.workers.dev`, or bind a
custom route like `https://slop.intercate.net`). That's your **endpoint**.

Local dev: `npm run dev` serves the API at `http://localhost:8787`.

## Embed the widget

Host `widget/slop-meter.js` somewhere (this repo copies it to the Astro site's
`public/slop-meter.js`), then:

```html
<script type="module" src="/slop-meter.js"></script>
<slop-meter post-id="/blog/my-post/" endpoint="https://slop.intercate.net"></slop-meter>
```

It inherits `--accent` and `--font-body` from the host page when present.

## Owner dashboard

`slop-dashboard.html` is a self-contained, token-gated page that reads `/summary`
and shows every voted post, its average slop score, vote count, range, and a ⚠
flag for posts averaging ≥ 60 with ≥ 3 votes. Host it anywhere (it's `noindex`
and useless without the `ADMIN_TOKEN`, which the API enforces). On this site it
lives at `/slop-dashboard.html`.

## Privacy

No personal data is stored. The only per-vote identifier is
`sha256(SALT + day + post_id + IP)`, truncated — it rotates daily and differs per
post, so votes can't be correlated to a person or across posts/days.
