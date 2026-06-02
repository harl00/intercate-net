---
title: "Government ICT Investment: Visualising and Evaluating the IT Portfolio"
description: "An exploratory data analysis of the US Federal IT Portfolio dataset — 6,716 investments across 26 agencies, covering FY2020–FY2025 and approximately USD$476 billion in ICT spend."
status: "active"
tags: ["university", "technology"]
featured: false
pubDate: 2026-05-31
draft: false
resources:
  - label: "IT Portfolio – Federal IT Dashboard"
    type: "dataset"
    url: "https://itdashboard.gov/"
---

## Background

The United States federal government is among the largest technology spenders in the world. Each year, agencies report their IT investments to the Office of Management and Budget (OMB) through the Federal IT Dashboard, producing a publicly available dataset that spans thousands of investment lines, dozens of agencies, and hundreds of billions of dollars.

This project is an exploratory data analysis (EDA) of that dataset, undertaken as part of postgraduate study in data analytics at UTS. The goal is to understand the shape, distribution, and trends in federal ICT investment — and to develop the visualisation and evaluation skills to communicate what the data shows.

## The Dataset

The IT Portfolio dataset covers:

- **6,716 records** across **31 features**
- **26 agencies** and **138 bureaus**
- Fiscal years **FY2020 through FY2025**
- Approximately **$476 billion USD** in total ICT spend

Fields include agency name, bureau, investment title, lifecycle cost, investment type, and a set of operational status and risk indicators. The dataset is published by OMB and GSA and made available as public domain data through [itdashboard.gov](https://itdashboard.gov/) and data.gov.

## Approach

The analysis uses Python — primarily pandas, matplotlib, and seaborn — to explore and visualise the dataset. Key areas of investigation include:

- **Distribution analysis**: understanding how investment sizes are distributed across agencies and over time
- **Agency comparisons**: identifying which agencies account for the largest share of ICT spend and how that composition has shifted across fiscal years
- **Time-series trends**: examining whether total and per-agency spend is growing, contracting, or holding steady across FY2020–FY2025
- **Investment type breakdown**: exploring how spend is allocated across categories such as infrastructure, development, and operations
- **Heatmap and correlation analysis**: identifying relationships between investment characteristics and outcomes or risk indicators

The analysis treats the dataset as a window into how a large federal bureaucracy plans and accounts for technology — not just as numbers to be summed, but as a record of organisational priorities and constraints.

## Expected Findings

Federal IT spend is heavily concentrated in a small number of large agencies (Defence, Health, Homeland Security). The bulk of investment at any given agency tends to be in operations and maintenance rather than new development — a pattern consistent with legacy infrastructure dependency. Spend across the portfolio has likely grown in nominal terms across FY2020–FY2025, with some acceleration associated with pandemic-era digital transformation initiatives.

Whether the data supports or challenges these assumptions is what the analysis will determine.

## Updates

This page will be updated as the analysis progresses. Code, notebooks, and outputs will be linked here as they are completed.
