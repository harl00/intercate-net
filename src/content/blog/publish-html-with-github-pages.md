---
title: "From HTML File to Live Web Page: Publishing Artifacts with GitHub Pages"
description: "You made a single-page HTML thing and it works when you double-click it, but you can't share it. Here is the simplest way I know to put it on the web for free, with no coding and no command line."
pubDate: 2026-07-21
tags: ["technology"]
linkedinSnippet: "A beginner-friendly guide: how to take a single HTML file (the kind you get when you ask an AI to build you a little page) and publish it as a real, shareable web address for free using GitHub Pages. No coding, no command line."
---

You have made something. Maybe you asked an AI to build you a little interactive page: a calculator, a chart, a quiz, a decision helper. It is sitting on your computer as a single `.html` file. It works when you double-click it, the browser opens, everything runs. But you cannot share it. "Here, email yourself this file" is not a link, and nobody else can open it in their browser.

This guide takes you from that file to a real, public web address. It is free, there is no coding, and you never touch a command line. Everything happens in your browser using a service called **GitHub Pages**.

Set aside about fifteen minutes for the first time. After that, publishing takes a minute.

## What you need

- The HTML file you want to publish.
- An email address.
- A web browser.

That is the whole list.

## Step 1: Create a free GitHub account

GitHub is a website where people store and share files, mostly code. It also happens to be able to serve those files as web pages, which is the part we care about.

1. Go to [github.com](https://github.com) and click **Sign up**.
2. Enter your email, choose a password, and pick a username.
3. Verify your email when the message arrives.

One thing worth pausing on: **your username becomes part of your web address.** If you pick `janesmith`, your pages will live under `janesmith.github.io`. Pick something you are happy to have visible.

## Step 2: Create a repository

A repository (everyone shortens it to "repo") is just a named folder for one project. We will make one to hold your page.

1. Click the **+** in the top right, then **New repository**.
2. Give it a short name, for example `my-pages`. This name also shows up in your web address, so keep it simple and lowercase.
3. Set it to **Public**. Free GitHub Pages only works with public repos, so this is not optional.
4. Tick **Add a README file**.
5. Click **Create repository**.

## Step 3: Upload your HTML file

Before you upload, do one small but important thing: **rename your file to `index.html`** (all lowercase). When someone visits a folder on the web, the server automatically shows the file called `index.html`. That is what gives you a clean address with nothing tacked on the end.

Now upload it:

1. On your repo page, click **Add file**, then **Upload files**.
2. Drag your `index.html` into the box, or click to browse for it.
3. Scroll down and click **Commit changes**. ("Commit" just means "save this.")

If your page uses an image or a separate stylesheet, upload those in the same step and make sure your HTML refers to them with a relative path like `./picture.png`.

## Step 4: Turn on GitHub Pages

Your file is stored now, but it is not yet being served as a web page. One switch fixes that.

1. On your repo page, click **Settings** (near the top).
2. In the left menu, click **Pages**.
3. Under **Source**, choose **Deploy from a branch**.
4. Set the branch to **main** and the folder to **/ (root)**.
5. Click **Save**.

## Step 5: Get your link

GitHub now builds your site. This takes a minute or two the first time.

Wait a moment, then refresh the **Pages** settings page. You will see a green box that says something like:

> Your site is live at `https://janesmith.github.io/my-pages/`

That is your link. Click it, and there is your page, on the real internet, ready to share with anyone.

If it shows a "404" error at first, do not panic. The build has not finished. Give it another minute and refresh.

## The one idea that unlocks everything: folders become web addresses

Here is the concept that lets you publish as many artifacts as you like from a single repo. **A folder in your repo becomes part of the web address, and the `index.html` inside it is what people see.**

So if you create a folder called `quiz` and put an `index.html` in it, that page appears at:

`https://janesmith.github.io/my-pages/quiz/`

Once that clicks, you are no longer publishing one page. You are running your own little corner of the web.

## Adding another artifact later

1. On your repo page, click **Add file**, then **Create new file**.
2. In the name box, type `quiz/index.html`. Typing the slash tells GitHub to make a folder called `quiz` with `index.html` inside it.
3. Paste your HTML into the big editor, or use **Upload files** instead if you prefer to drag a file in.
4. Click **Commit changes**.

A minute later it is live at the new address.

## Updating a page you already published

Upload a new `index.html` to the same place and confirm you want to replace the old one. The change goes live within a minute. Refresh, and if it looks unchanged, do a hard refresh (hold **Shift** and click reload) to get past your browser's cache.

## A short checklist of the things people trip on

- The repo must be **Public**.
- The file must be named **`index.html`**, all lowercase.
- Extra files (images, CSS) go **in the same folder** and are referenced with a relative path like `./style.css`.
- Every change takes **a minute or so** to appear. Patience beats panic.

That is it. The barrier to putting something you made in front of other people is now essentially zero, which is exactly how it should be. Go make something and give it an address.
