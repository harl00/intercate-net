---
title: "Making This Site Agent-Readable"
description: "An exploration of designing a website to serve two readers at once — a human and an LLM/agent. Clean per-page markdown, an llms.txt index, structured data, and a deliberate crawler posture."
status: "active"
tags: ["technology"]
featured: false
pubDate: 2026-06-03
updatedDate: 2026-06-03
draft: false
resources:
  - label: "llms.txt proposal"
    type: "link"
    url: "https://llmstxt.org/"
---

Most websites are built for one reader: a human with a browser. But more and more of the traffic that matters now comes from a second kind of reader — an LLM or an autonomous agent fetching, summarising, and reasoning over the page on someone's behalf. This project is an exploration of what it means to design deliberately for **both**.

The instinct that started it: I wanted to commit to the agent reader as a first-class citizen, not an afterthought — and to do it with purpose-built artifacts rather than by stuffing hidden content into the human page (which helps no one).

## What I'm exploring

- **Per-page markdown** — serving a clean `/blog/<slug>.md` alongside every post, so an agent can fetch token-efficient source instead of parsing rendered HTML. (These already exist — they were built as the snapshot source for the [slop-meter](/projects/slop-meter), which is a nice example of one piece of infrastructure serving two goals.)
- **`llms.txt`** — a curated markdown index at `/llms.txt` (and possibly a fuller `/llms-full.txt`), per the emerging [convention](https://llmstxt.org/), giving an LLM a map of the site.
- **Structured data** — `BlogPosting` / `Article` JSON-LD so machines can read author, dates, and relationships reliably.
- **Crawler posture** — being deliberate about which AI user-agents are welcome, rather than leaving it to chance.

## Why it interests me

This is exactly the kind of question I like to poke at: a small, concrete build that opens onto a much larger shift in how the web is read and used. If a meaningful share of your readers are now models and agents, "good content" and "good information architecture" quietly change meaning — and it's better to think that through deliberately than to inherit it by default.

This page will grow as I build and test each piece.
