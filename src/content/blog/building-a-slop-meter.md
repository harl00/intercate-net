---
title: "Is This Slop? Building an Anonymous Reader Verdict Into Every Post"
description: "I built a little widget that lets readers anonymously rate how much any post smells of AI slop: a slider from human craft to pure slop. Here's the design, the privacy tricks, and the small mistakes I made along the way."
pubDate: 2026-06-03
tags: ["technology"]
project: "slop-meter"
linkedinSnippet: "I built a 'slop-o-meter': an anonymous slider that lets readers rate how much any post smells of AI slop, then shows the crowd verdict. A write-up of the design, the zero-PII privacy model, and the gotchas: CORS preflights, a self-named secret, and a stray script tag."
---

There's a reflex a lot of us have developed over the past couple of years: reading a paragraph and quietly clocking it as **AI slop**. Formulaic, padded, weirdly confident, technically correct and completely lifeless. The tells are getting easier to spot, and the suspicion is getting more reflexive.

I wanted to know when readers feel that about *my* writing. Not a polite comment, not a thumbs-up, just an honest, anonymous, slightly playful signal. So I built a small widget: a slider you drag from "human craft" to "pure slop", and when you let go it records your verdict and shows you how the crowd scored the same piece. There's one at the bottom of this very post. Go on.

This is a write-up of how it works, the decisions behind it, and (more usefully) the small things that went wrong.

## The shape of the problem

Three principles set the whole design before I wrote any code:

1. **Anonymous.** No logins, no accounts, no cookies, no personal data stored. A signal, not a surveillance feed.
2. **Engaging.** A slider with a live, slightly silly label ("Has a pulse." … "Smells like a language model.") and a small emoji burst when you vote. Friction kills feedback.
3. **Reusable.** Built as a standalone thing I could lift out and drop onto any site later, not welded to this blog.

That last principle did the most work. It pushed me toward a clean split between a generic backend and a portable front end, rather than something tangled into one Astro site.

## Where the votes live

This site is static: Astro, built to flat files, served from a CDN. There's no server sitting there ready to record a vote. So persistence had to live elsewhere.

The site already sits behind Cloudflare, which made the choice easy: a **Cloudflare Worker** with a **D1** database (their serverless SQLite). It runs at the edge, costs nothing at this scale, and (the part that mattered most) it's completely independent of the blog. The Worker doesn't know what a "post" is. It just stores votes keyed by an opaque `id`, so the same deployment could serve a dozen different sites.

That gives the two-part architecture: a **Worker API** (the brain) and an embeddable **web component** (the face), talking over plain JSON. A third piece, an owner-only dashboard, came later, reading the same data.

## The two tricks I'm happiest with

Most of this is unremarkable plumbing. Two small ideas make it work nicely.

**The dedup trick.** I wanted "one vote per person per post, but let them change their mind." With no accounts, "per person" is fuzzy, so I lean on the database. Every vote row carries an anonymised bucket, and a unique index does the enforcement:

```sql
CREATE UNIQUE INDEX idx_votes_dedup
  ON votes(post_id, vote_day, ip_hash);
```

The insert is an upsert (`ON CONFLICT … DO UPDATE`), so re-voting the same day quietly overwrites your previous score instead of stacking a second one. The "change your vote any time" promise is enforced by the schema, not by application logic I have to remember to get right.

**The privacy trick.** The only identifier I keep is a one-way hash, and it's deliberately built to be useless for tracking:

```
ip_hash = sha256(SALT + day + post_id + IP)   // then truncated
```

The raw IP is never stored. Because the day is mixed in, the hash rotates every 24 hours, so yesterday's bucket can't be matched to today's. Because the post id is mixed in, the same person voting on two posts produces two unrelated hashes, so votes can't be correlated across the site. It's enough to stop casual double-voting and nothing more. No cookies, no fingerprint, no profile.

## The widget

The front end is a single-file **web component** (no framework, no dependencies) rendered into shadow DOM so its styles can't leak out or be clobbered by the host page. You embed it with one script tag and one element:

```html
<slop-meter post-id="/blog/this-post/"
            endpoint="https://slop.intercate.net"></slop-meter>
```

It reads a few CSS custom properties (`--accent`, the body font, a handful of `--slop-*` variables) for theming. Custom properties inherit *through* the shadow boundary, which is the neat part: this site hands the widget its own light/dark palette and the component just adopts it. The emoji burst uses the Web Animations API and bows out politely if you've asked for reduced motion.

On the site itself, the whole thing is behind a one-line feature flag (an empty endpoint renders nothing), so I could ship it dormant and switch it on only once the backend was live.

## The blooper reel

The honest part. None of these were hard; all of them are the kind of thing that eats twenty minutes and teaches you something.

**A CORS preflight blocked my own dashboard.** The dashboard sends an `Authorization` header, which quietly triggers a preflight `OPTIONS` request. My Worker was advertising `Access-Control-Allow-Headers: content-type` (no `authorization`), so the browser refused the real request before it ever left. The fix is one word added to a header. The lesson: any custom request header, `Authorization` included, has to be named in the preflight response or the browser won't send it.

**I created a secret named after its own value.** Setting the admin token, I ran the equivalent of `wrangler secret put <the-actual-token>`. But that argument is the secret's *name*, not its value. The value is entered at a prompt afterwards. So I'd created a secret literally *named* after my token. And secret names are visible in the dashboard and the CLI listing, which meant the token was no longer secret at all. Delete, regenerate, move on, but a good reminder that the thing after `secret put` is a label, not a payload.

**A script tag escaped the document.** My loader `<script>` was sitting just after the closing layout tag, which put it fractionally outside `</html>`. Browsers are forgiving and usually run it anyway, but "usually" is how you get a bug report that only reproduces in one person's browser. Moving it inside the body where it belongs took ten seconds and removed a whole category of "it doesn't show up for me."

**My Worker URL had my name in it.** Cloudflare's default Worker address is `your-worker.<account-name>.workers.dev`, and the account part defaulted to something personal. Rather than rename an account-wide subdomain (which would change the URL of *every* Worker I ever deploy), I pointed a custom domain (`slop.intercate.net`) at it. Cleaner, and nothing leaks.

## Building it to be given away

Because "reusable" was a goal from the start, the discipline was small but constant: keep the API keyed by an opaque id, keep the widget free of any dependency on the host, keep the secrets out of the front end. The result is a self-contained package (Worker, schema, web component, dashboard, and docs) that should drop into someone else's site with a deploy and a script tag. It's MIT licensed for exactly that reason.

The next step I'm tempted by is exposing the vote data through a small read-only interface an AI assistant can query, so I could ask "which posts are trending sloppy this month?" and get a live, generated dashboard back rather than reading a table. The data model already supports it (every vote keeps a timestamp), so it's a matter of wiring, not rework.

For now, though, the loop is simple and honest: you read something, you decide whether it has a pulse, you drag a slider. The receipt comes from the reader.

So, was this post slop? There's a slider right below. I genuinely want to know.
