---
title: "Adversarial ML in Practice: What Government Systems Need to Know"
description: "Evasion attacks, data poisoning, and model stealing are not theoretical concerns — they're active threats to AI systems in high-stakes environments. A practical overview for technical leaders who aren't researchers."
pubDate: 2026-04-20
tags: ["university", "ai-government", "technology"]
linkedinSnippet: "Adversarial ML threats aren't just academic. Evasion, poisoning, and model stealing attacks matter for any organisation deploying AI in high-stakes contexts. My write-up for the postgrad cybersecurity course."
---

This post started as coursework for my cybersecurity analytics unit, but the topic is directly relevant to anyone deploying AI in government or enterprise contexts. I'm sharing it here because I think the framing for practitioners — rather than researchers — is underdeveloped.

Adversarial machine learning describes a class of attacks specifically designed to manipulate AI systems. Unlike traditional cyber attacks that target infrastructure, these attacks target the *model's reasoning* itself.

## The three threat types

**Evasion attacks** occur at inference time. An attacker crafts an input that causes the model to misclassify or produce incorrect output, while the input appears normal to a human observer. The canonical example is image perturbations — small pixel changes invisible to the human eye that completely fool a classifier. But the real-world examples that matter for government are subtler: fraud detection systems that can be gamed by slightly modifying transaction patterns, or document classifiers fooled by adversarial text formatting.

<figure class="breakout">
  <img src="images/adversarial_image2.png" alt="A table that lays out the increasing effectiveness of Noise and the impact on an AI model being able to successfully identify an object. The human eye is not overly impacted on the ability to judge this image.">
  <figcaption>A table that lays out the increasing effectiveness of Noise and the impact on an AI model being able to successfully identify an object. The human eye is not overly impacted on the ability to judge this image. Note as the Noise Scale decreases (from left to right) the prediction success is increasing - starting from a Boot being identified as a Bag with a 74% accuracy (at a scale of 1/2), reaching 100% confidence once the scale hits 1/5.</figcaption>
</figure>

**Poisoning attacks** occur at training time. An attacker who can influence training data can embed behaviours that activate under specific conditions — a backdoor. For models trained on third-party or scraped data, this is a genuine supply chain risk. If your fraud model was trained on data that an attacker could influence, your model may have been compromised before you deployed it. 

**Model stealing** targets intellectual property and system knowledge. By querying a model systematically, an attacker can reconstruct a functional copy. For proprietary government models — particularly those used in eligibility decisions — this creates both IP risk and a pathway to developing targeted evasion attacks.

## Why this matters for government AI

Government systems have properties that make them particularly interesting targets:

- **High value outcomes**: visa decisions, welfare eligibility, and border control have consequences that motivate sophisticated attackers
- **Transparency requirements**: published fairness audits and bias reports can inadvertently reveal information that helps attackers craft evasion inputs
- **Update cadence**: assurance and procurement processes mean model update cycles need to be planned deliberately against a fast-moving threat landscape
- **Maturing red-team practice**: adversarial testing of AI systems is still an emerging discipline across the sector — in industry and government alike

## What adequate defence looks like

I want to resist giving a false sense of security here : adversarial robustness is an active research area without settled solutions. But some practical posture shifts matter:

*Input validation and anomaly detection* won't catch sophisticated attacks, but they raise the cost of simple ones. Rate limiting and query logging on model inference endpoints make model stealing significantly harder. This can be implemented at run time as a form of a guardrail.

*Ensemble methods and model diversity* (using multiple models rather than a single classifier) reduce the effectiveness of targeted evasion attacks, since perturbations tuned to fool one model often don't transfer cleanly. A practical example of this may be having three models classify the same object, and seek consensus from the models.

*Data provenance and supply chain controls* address poisoning risk. Training data should be treated as a security artefact, with provenance tracking and integrity checking. This form of an AI passport is being considered currently that allows a model to possess 'credentials' that can verify the data the model has been trained on. Think an extension to a model card.

*Red team exercises specifically targeting the model*, not just the surrounding infrastructure, should be standard before high-stakes deployment. What are the thresholds to which your model starts to falter?

To make that concrete, here's the output from testing the same attack across a range of noise scales. As the perturbation shrinks (intensity dropping from left to right), the model recovers and the attack's success rate falls away.

```text
Noise matrix: 32x32  mean=0.4929

Scale  Intensity  Fooled  Success
-----  ---------  ------  -------
1/2    0.2465     3/5     60%
1/3    0.1643     1/5     20%
1/4    0.1232     1/5     20%
1/5    0.0986     1/5     20%
1/8    0.0616     0/5      0%
```

## The gap I'm trying to close

The security community and the AI community don't talk to each other enough. CISOs often don't know what adversarial ML means in practice. AI teams often treat security as someone else's problem until something goes wrong.

In large organisations, these communities often sit in separate divisions, which can widen the gap. Part of what draws my interest in AI governance is helping ensure these conversations happen *before* deployment, not after.

---

*This post draws on coursework from my postgraduate cybersecurity analytics unit. The views are my own.*
