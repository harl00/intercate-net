---
title: "The Receipt Nobody Thought To Issue"
description: "When government acts on your behalf, what record do you get? The accountability frameworks for agentic government build the supply side of the audit trail without specifying the citizen-facing output. The case for an Agentic Transparency Standard."
pubDate: 2026-06-01
tags: ["ai-government", "essay"]
project: "agentic-systems-government"
linkedinSnippet: "In an agentic state, government acts first and the citizen is the beneficiary of an action they didn't initiate. The natural 'receipt' from citizen-initiated transactions disappears. My follow-up post argues for a citizen-facing action ledger - an Agentic Transparency Standard."
---

*When government acts on your behalf, what record do you get?*

There's a compelling vision circulating in digital government circles: the Agentic State. The idea is that AI systems will increasingly act *on behalf of* citizens rather than waiting for citizens to act on themselves. Benefits will be paid before you apply. Permits will be pre-approved before you ask. Eligibility will be detected before you know you qualify.

It's genuinely exciting. And it contains a quiet problem nobody has quite named yet.

---

When you initiate a transaction with government - you submit a form, lodge an application, make a payment - there's a natural accountability artifact. You did the thing. You have the receipt. You know what happened, when, and why.

In an agentic model, that dynamic inverts. Government acts first. The agent files, the system decides, the benefit lands. The citizen is the beneficiary of an action they didn't initiate and may not fully understand. The "receipt" that came naturally from citizen-initiated transactions doesn't exist anymore.

What replaces it?

---

The serious thinking about agentic government - including work coming out of Estonia, Ukraine, Singapore, the World Bank, and several other leading jurisdictions - does grapple with accountability. It talks about audit trails, explainability requirements, cryptographic attestation of agent actions, decision logs, and the right to human review. These are the right ingredients.

But they're oriented primarily toward institutional accountability. They're the mechanisms by which governments hold themselves responsible, by which oversight bodies can inspect systems, by which courts can review decisions. They answer: *can we reconstruct what happened?*

They don't fully answer a different question: *does the citizen know what happened, in real time, in a form they can act on?*

That distinction matters more than it might seem.

---

Consider what a mature agentic government might look like from the citizen's perspective. Your tax agent has lodged your return. Your benefits agent has detected a change in your eligibility and adjusted your payments. An infrastructure agent has pre-approved a development application on your property. A compliance agent has flagged a discrepancy in your business reporting.

All of this is, in principle, good. Government working for you rather than making you work for it.

But if you don't know any of it happened - if there's no standardised way for you to see a feed of actions taken in your name - then "on your behalf" starts to sound a lot like "without your knowledge." The efficiency gains are real, but so is the erosion of the sense of agency that comes from understanding your own relationship with the state.

This is the gap: **the absence of a citizen-facing event standard for agentic government actions**.

---

In the security world, the SIEM - Security Information and Event Management - is the system that aggregates, correlates, and surfaces events across a complex infrastructure. It gives operators visibility into what's happening across systems they're responsible for.

The analogy for citizens in an agentic state is imperfect but instructive. What citizens need isn't a threat detection system - it's a **personal action ledger**: a standardised, queryable record of every consequential action an autonomous government system has taken on their behalf.


---

## What would this look like in practice?

The concept is simpler than it sounds. Any time an agentic government system takes a consequential action involving a citizen - a decision, a payment, an application, a status change, a disclosure - it emits a signed, structured event record. That record contains at minimum:

- **What happened** - the action taken, in plain language
- **On whose behalf** - the citizen or entity affected
- **By which system** - the agent or service, with verifiable identity
- **Under what authority** - the delegation or legislative basis
- **When** - timestamp, immutable
- **What it means** - any change to the citizen's status, entitlements, or obligations

Citizens access this through whatever interface they choose: a government-provided viewer, a personal AI assistant, a trusted intermediary, or direct API access for those who want it. The key is that the standard is on the *supply* side - government systems must emit it - not on the demand side.

This is closer to the **Open Banking transaction feed model** than to enterprise security tooling. Every bank is required to provide a consistent, queryable record of transactions. Customers choose how to access and act on that information. The standard is what makes the ecosystem work.

---

## Why this requires a standard, not just a policy

It would be easy to say: agencies should be transparent, citizens should be informed, design services to explain themselves. This is true and insufficient.

Without a standard or a defined schema, signing requirements, retention rules, and query interface - you get a fragmentation problem. Every agency implements transparency differently. Citizens face a separate portal for every interaction. Personal AI agents can't aggregate across agencies. Oversight bodies can't compare across systems. The accountability infrastructure becomes as siloed as the services it's meant to explain.

A standard also matters for the agentic future itself. As citizens increasingly deploy their own AI agents to manage their interactions with government - and this is explicitly anticipated in the serious literature on this topic - those agents need a consistent interface to government action records. If your personal agent is going to review, contest, or build on what government agents have done on your behalf, it needs a feed it can actually read.

The standard is the prerequisite for the ecosystem.

---

## The deeper point

The shift to proactive, agentic government is a meaningful change in the relationship between citizen and state. Previous waves of digital government largely digitised existing transactions. The citizen still initiated, still chose, still received a confirmation. The agentic model breaks that pattern.

That's worth being thoughtful about,  not to slow it down. The case for agentic service delivery is strong, and the cost of governments falling behind is real. But to ensure that the efficiency gains don't come at the cost of something citizens currently have and mostly don't notice until it's gone: the sense that they understand their own relationship with government.

A citizen-facing action ledger - an Agentic Transparency Standard - is the architectural element that preserves that. It doesn't slow the agentic state down. It makes it trustworthy.

The technology to do this exists. The policy rationale is clear. The accountability frameworks being developed by leading digital governments are almost there - they've built the supply side of the audit trail without specifying the citizen-facing output.

Someone needs to specify it.

---

[*The Agentic State*](https://agenticstate.org/), a vision paper initiated and supported by the [*Berlin Global Government Technology Centre*](https://www.globalgovtechcentre.org/) and the [*World Bank*](https://www.worldbank.org/ext/en/home), is explicitly trying to get ahead of these questions. 

The document explores the governance and transparency questions raised here - though it doesn't fully resolve them - in its Layer 7 and Layer 9 chapters.*
