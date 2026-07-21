---
title: "From Prompt to Published: Using Claude Code to Build and Publish HTML Pages"
description: "You already publish HTML with GitHub Pages by dragging files into a browser. Here is the next step: generate the page on your own computer with Claude Code, then push it live with a sentence or two. A beginner setup guide for Windows and macOS."
pubDate: 2026-07-22
tags: ["technology"]
linkedinSnippet: "The follow-up to my GitHub Pages guide. Once your site is live, the next step is to stop uploading files by hand and start building pages on your own machine with Claude Code, then publishing them with a plain-English instruction. A beginner setup walkthrough for Windows and macOS, including the design skills worth turning on."
project: "publish-it-yourself"
---

In an earlier post I walked through [publishing a single HTML file with GitHub Pages](/blog/publish-html-with-github-pages/). That guide stayed entirely in the browser: no command line, no coding, just dragging a file into a web page and flipping a switch. If you followed it, you now have a real web address and a repository (a "repo") that holds your pages.

This post is the next step. Instead of building a page somewhere else and uploading it by hand, you are going to build it right on your own computer using **Claude Code**, and publish it with an instruction as plain as "commit this and push it live." Claude Code writes the file, saves the change, and sends it up to GitHub for you.

This does mean opening a terminal, which the last guide carefully avoided. Do not let that put you off. You will type a handful of commands once during setup, and after that you mostly talk to Claude Code in ordinary sentences. I will cover **Windows first**, then **macOS**.

## An honest word about cost, before you start

Claude Code is not part of the free Claude.ai plan. To use it you need one of:

- A paid **Claude subscription** (Pro or Max), which is the simplest path for an individual, or
- A **Claude Console** account, where you pay per use from pre-paid credits.

For most people reading this, a Pro subscription is the straightforward choice, and it is the same login you may already use for chatting with Claude. You can see current options on the [Claude pricing page](https://claude.com/pricing). I am flagging this up front so nobody gets three steps in and hits a paywall by surprise.

## What you will end up with

A loop that looks like this:

1. You describe a page you want. Claude Code builds it as an HTML file in your repo folder.
2. You open the file to check it looks right.
3. You say "commit this and push it." A minute later it is live at your GitHub Pages address.

That is the whole thing. Once it clicks, the distance between an idea and a published page is a couple of sentences.

## What you need first

- The GitHub account and repo from the [previous guide](/blog/publish-html-with-github-pages/). If you have not done that yet, do it first. This post assumes your GitHub Pages site is already live.
- A paid Claude plan (see above).
- About twenty minutes for the one-time setup.

---

# Windows

There are four one-time installs: Git, the GitHub CLI, Claude Code, and then signing in. I will take them in order.

## Step 1: Install Git for Windows

Git is the tool that tracks changes to your files and talks to GitHub. Claude Code uses it under the hood.

1. Go to [git-scm.com/downloads/win](https://git-scm.com/downloads/win) and download the installer.
2. Run it. You can accept every default by clicking **Next** through the whole thing. There are a lot of screens; none of them need changing.

On Windows, having Git installed also lets Claude Code run its commands through "Git Bash", which is the smoother experience. This is why we install it first.

## Step 2: Install the GitHub CLI and log in

This is the piece that lets your computer prove to GitHub that it is really you, so it can push your changes up. GitHub stopped accepting plain passwords for this a while ago, and the GitHub CLI is by far the least painful way to handle it.

1. Go to [cli.github.com](https://cli.github.com) and download the Windows installer, then run it.
2. Open a new terminal. Press the **Start** button, type `powershell`, and open **Windows PowerShell**.
3. Type this and press Enter:

```powershell
gh auth login
```

4. It asks a few questions. Choose **GitHub.com**, then **HTTPS**, then say **Yes** to authenticate with your GitHub credentials, then **Login with a web browser**. It shows you a short code, opens your browser, you paste the code, and click to approve.

That is authentication done, once, forever on this machine.

## Step 3: Install Claude Code

Claude Code now installs on its own, and you do not need to install Node.js or anything else alongside it.

In that same PowerShell window, paste this and press Enter:

```powershell
irm https://claude.ai/install.ps1 | iex
```

When it finishes, confirm it worked:

```powershell
claude --version
```

You should see a version number followed by `(Claude Code)`. If instead you get an error, run `claude doctor`, which checks the install and tells you what to fix. The official [Windows setup notes](https://code.claude.com/docs/en/setup) cover the less common cases.

## Step 4: Get your repo onto your computer

So far your repo lives on GitHub. To work on it locally, you make a copy on your machine. This is called "cloning".

1. In your browser, open your repo on GitHub. Click the green **Code** button and copy the address (it looks like `https://github.com/yourname/my-pages.git`).
2. Back in PowerShell, choose where to keep it. Your Documents folder is fine:

```powershell
cd ~\Documents
git clone https://github.com/yourname/my-pages.git
```

Replace that address with your own. This creates a folder called `my-pages` containing everything from your repo.

## Step 5: Start Claude Code and sign in

Move into your repo folder and start Claude Code:

```powershell
cd my-pages
claude
```

The first time it runs, it opens your browser to log in. Sign in with your paid Claude account and approve the request. You are now sitting inside Claude Code, in your repo, ready to go. Skip ahead to [The core loop](#the-core-loop-build-check-publish).

---

# macOS

The same four ideas, with Mac-flavoured commands. Open the **Terminal** app first: press **Command + Space**, type `Terminal`, and press Enter.

## Step 1: Install the tools with Homebrew (recommended)

On a Mac, the tidiest way to install these tools is [Homebrew](https://brew.sh), a package manager. If you do not have it, paste the single command from the top of [brew.sh](https://brew.sh) into Terminal and follow the prompts. Then install what you need:

```bash
brew install git gh
brew install --cask claude-code
```

That gives you Git, the GitHub CLI, and Claude Code in one go. (Git is often already present on a Mac, and running the command again does no harm.)

If you would rather not use Homebrew, Claude Code also installs directly with:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

Confirm Claude Code is there:

```bash
claude --version
```

## Step 2: Log in to GitHub

```bash
gh auth login
```

Answer the same way as on Windows: **GitHub.com**, **HTTPS**, **Yes** to authenticate, then **Login with a web browser**. Paste the code it gives you into the browser and approve.

## Step 3: Clone your repo

```bash
cd ~/Documents
git clone https://github.com/yourname/my-pages.git
cd my-pages
```

Use your own repo address from the green **Code** button on GitHub.

## Step 4: Start Claude Code and sign in

```bash
claude
```

On first run it opens your browser to log in. Sign in with your paid Claude account, approve, and you are inside Claude Code in your repo.

---

## The one habit worth forming: always start Claude Code inside your project folder

Before the fun part, one idea that matters more than it looks. Notice that in both walkthroughs above you `cd` into your repo folder *before* running `claude`. That is not a detail. The folder you launch Claude Code from becomes its **project root**, and that root is the boundary of what it works on.

Here is why that boundary is worth caring about. Claude Code reads files, writes files, and runs commands. It scopes all of that to the folder you started it in and everything beneath it. Start it at the root of your repo, and its whole world is that one project. It can see your pages, edit them, and publish them, and nothing outside that folder is in play.

Now picture starting it somewhere broad instead, like your home folder, or worse, the top of your `C:` drive. You have just handed the whole of your personal file tree to it as the "project". Three things get worse at once:

- **Privacy.** Far more of your private files are now in view than you meant to share with anything.
- **Blast radius.** If a command does something you did not expect, it can now reach much more than one small project's worth of files.
- **The permission prompt means less.** Claude Code asks before it does things, but a "yes" is only as safe as the folder it is confined to. A tight folder makes that "yes" easy to give with confidence.

A tidy project folder is the simplest safety boundary you have. It costs nothing and it keeps the tool pointed at exactly the work in front of you.

Two practical notes:

- When Claude Code starts, it prints the working directory at the top. Glance at it. If that is not your repo, quit (`/exit`), `cd` into the right folder, and start again.
- On native Windows there is no separate operating-system sandbox around Claude Code, so this "start it in the right folder" habit is doing more of the work. On macOS and Linux the picture is similar for a beginner setup. Either way, the rule is the same: one project, one folder, start it there.

---

## The core loop: build, check, publish

Everything above was one-time setup. This part is what you actually do, and it is the same on both systems. You are now inside Claude Code (your prompt shows the folder and model at the top). Talk to it in plain sentences.

**Build a page.** Try something like:

```text
Create a folder called countdown with an index.html inside it. Make a simple, good-looking page that counts down to New Year's Eve, with the days, hours, minutes and seconds updating live. Keep everything in the one file.
```

Claude Code writes the file and shows you what it did. Remember the one big idea from the last guide: a folder with an `index.html` inside becomes its own web address. So this page will end up at `https://yourname.github.io/my-pages/countdown/`.

**Check it.** Ask Claude Code to open it for you:

```text
Open countdown/index.html in my browser so I can see it.
```

Look it over. If you want changes, just say so: "make the background darker and the numbers bigger". Claude Code edits the file in place.

**Publish it.** When you are happy:

```text
Commit this with a sensible message and push it to GitHub.
```

Claude Code saves the change and sends it up. A minute later, refresh your GitHub Pages address and the page is live. If it looks unchanged, do a hard refresh (hold **Shift** and click reload) to get past your browser's cache, exactly as in the previous guide.

That is the loop. Build, check, publish, all in conversation.

## Level up: turn on skills

This is where it gets genuinely fun. Claude Code has **skills**, which are bundles of expertise it can draw on for a particular kind of task. You invoke one by typing a slash. Type just `/` on its own to see the skills available to you.

A few are worth knowing about for page-building:

- **A frontend design skill.** Left to a plain prompt, generated pages can look a bit generic. A design skill pushes Claude Code toward deliberate typography, spacing, and colour, so your pages look intentional rather than templated. If you care how the thing looks, this is the one to reach for.
- **An artifact design skill.** Similar spirit, aimed specifically at self-contained single-page things (the exact kind of file you are publishing here). Good for polished one-pagers.
- **A data visualisation skill.** If your page shows numbers, a chart, or a small dashboard, this one gets the colours, axes, and layout right, and keeps them readable in both light and dark mode.

Using one is as simple as mentioning it or letting Claude Code pick it up. For example:

```text
Rebuild the countdown page, and use the design skill to make it look striking.
```

If you do not see a skill you want in the `/` list, you can add more. The [skills documentation](https://code.claude.com/docs/en/skills) explains how, and skills follow an open standard you can browse at [agentskills.io](https://agentskills.io).

## Level up: give your repo a memory with CLAUDE.md

Claude Code automatically reads a file called `CLAUDE.md` at the top of your repo every time it starts. Think of it as a sticky note that Claude Code always sees. Putting your standing preferences there means you stop repeating yourself.

Ask Claude Code to make one:

```text
Create a CLAUDE.md for this repo. Note that every published page is a self-contained HTML file in its own folder with an index.html, that pages should work on mobile, and that I like clean, modern design. Keep it short.
```

From then on, every page you ask for already knows your house style.

## Level up: a one-word publish command

If "commit this and push it" every time feels repetitive, you can make your own command. Skills and custom commands are the same idea: a short instruction file that runs when you type its slash. Ask Claude Code:

```text
Create a custom /publish command that commits all my changes with a clear message and pushes them to GitHub.
```

Now publishing really is one word: `/publish`.

## A short checklist of things people trip on

- **You need a paid Claude plan.** The free plan does not include Claude Code.
- **Run `claude` from inside your repo folder.** If Claude Code cannot see your files, you are probably in the wrong folder. `cd` into it first.
- **Folders still become web addresses.** Every page is a folder with an `index.html` inside. This has not changed from the last guide.
- **Changes take a minute to appear**, then hard-refresh if the page looks stale.
- **If a push fails**, the fix is almost always `gh auth login` again. Claude Code can usually walk you through it if you just tell it what error you saw.

## Where to go from here

You have moved from uploading files by hand to describing what you want and having it built and published for you. That is a real shift. The same setup handles a personal homepage, a set of little tools, a photo page, a résumé, whatever you feel like making next.

Two official guides are worth a bookmark: the [Claude Code quickstart](https://code.claude.com/docs/en/quickstart) for the basics, and the [best practices guide](https://code.claude.com/docs/en/best-practices) for getting better results as you go. And if the terminal itself is new to you, Anthropic's [terminal guide](https://code.claude.com/docs/en/terminal-guide) starts from the very beginning.

Go make something, and give it an address.
