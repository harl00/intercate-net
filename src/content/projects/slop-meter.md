---
title: "Slop-Meter: An Anonymous AI-Slop Rating Widget"
description: "A small, reusable, privacy-first widget that lets readers anonymously rate how much any piece of writing smells of AI slop — a slider from human craft to pure slop, with a live crowd verdict."
status: "active"
tags: ["technology"]
featured: false
pubDate: 2026-06-03
updatedDate: 2026-06-03
draft: false
resources:
  - label: "Source & build log"
    type: "github"
    url: "https://github.com/harl00/intercate-net/tree/main/slop-meter"
---

Slop-meter is a small side project that started with a simple itch: I wanted to know when readers feel that something I've written reads like **AI slop** — formulaic, padded, technically fine and completely lifeless — and I wanted that signal to be anonymous, a little bit playful, and impossible to ignore.

The result is a slider you drag from *human craft* to *pure slop*. Let go, and it records your verdict and shows you how the crowd scored the same piece. There's a live one at the bottom of every post on this site.

## What it is

Two decoupled, reusable parts plus an owner dashboard:

- **A Cloudflare Worker API** (the brain) — serverless, backed by D1 (SQLite), keyed by an opaque id so one deployment can serve many sites.
- **An embeddable web component** (the face) — a single dependency-free `<slop-meter>` element that drops into any page with one script tag and adopts the host theme.
- **A token-gated dashboard** — an owner-only view of which posts have been voted on, their average slop score, and which ones to go and look at.

## Design principles

- **Anonymous** — no accounts, no cookies, no personal data stored. The only identifier is a salted, daily, per-post one-way hash used purely to stop casual double-voting.
- **Engaging** — a continuous slider with live labels and an emoji burst beats a dreary thumbs-up/down.
- **Reusable** — built as a standalone function from day one, MIT licensed, ready to lift into its own repository so anyone can deploy it.

## Where it's heading

The data model keeps a timestamp on every vote, so slop perception is queryable over time, not just as a running tally. The next step I'm interested in is exposing that read-only data to an AI assistant — via MCP — so I can ask for insights and get a live, generated dashboard back rather than reading a table.
