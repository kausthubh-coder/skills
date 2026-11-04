---
name: content-research
description: Research YouTube and X for free. Search videos and posts, pull a channel's uploads or an account's posts, get transcripts, thumbnails, views, likes, comments, threads and trends, and find outliers (lots of views from small channels or accounts). Use when I ask what's performing in a niche, about a creator, or for content research on YouTube or X.
---

# Content research on YouTube and X

Two scripts next to this file print JSON. Run them with `uv run` (it installs their dependencies on first use). Add `--out file.json` before the command for big results. Every command has `--help`.

## YouTube: `yt.py`, no login or API key

```
uv run <this folder>/yt.py search "<query>" [--sort views|date] [--when hour|today|week|month|year] [--type video|shorts] [--length short|medium|long] [-n 30]
uv run <this folder>/yt.py channel <@handle|URL|UC id> [-n 30] [--shorts]   # subs, median views, recent uploads with views
uv run <this folder>/yt.py video <id|URL>           # views, likes, comments, like rate, subs, date, tags, chapters, description
uv run <this folder>/yt.py transcript <id|URL> [--lang en] [--text]
uv run <this folder>/yt.py comments <id|URL> [-n 50] [--sort top|new]
uv run <this folder>/yt.py thumb <id|URL> [--file out.jpg]                  # largest available thumbnail
uv run <this folder>/yt.py outliers "<query>" "<query 2>" ... [--when month] [--type shorts] [--max-subs 100000] [--min-views 20000]
```

- It uses yt-dlp, which scrapes YouTube's own pages, so there is no 100-search daily cap. `video`, `transcript` and `comments` need Node on PATH; YouTube's player is a JS challenge.
- About 300 videos an hour is safe logged out. `outliers` over 20 searches takes about 10 minutes. On HTTP 429 or "confirm you're not a bot", wait, or pass a throwaway account's cookies to yt-dlp (`cookiesfrombrowser: ("firefox",)`). Chrome's cookies can't be read on Windows (app-bound encryption).
- `search` view counts come from the results page; `video` is the exact current count.

## X: `x.py`, a logged-in session

```
uv run <this folder>/x.py login [--browser firefox]  # once: copies the X session from a browser I'm logged in to. No window opens
uv run <this folder>/x.py search "<query>" [--latest] [-n 50]   # X operators work: min_faves:500 since:2026-10-01 lang:en from:handle -filter:replies
uv run <this folder>/x.py user <handle>              # followers, following, post count, bio, created
uv run <this folder>/x.py posts <handle> [-n 40] [--replies]    # recent posts with views, likes, reposts, replies, bookmarks; median views
uv run <this folder>/x.py post <id|URL>
uv run <this folder>/x.py thread <id|URL>            # the author's whole thread
uv run <this folder>/x.py replies <id|URL> [-n 50]
uv run <this folder>/x.py trends [trending|news|sport|entertainment]
uv run <this folder>/x.py people "<query>"           # account search
uv run <this folder>/x.py outliers "<query>" ... [--max-followers 50000] [--min-views 10000]
```

- X's API has no free reads, so this calls X's own web API (twscrape) with a logged-in session. No browser, no screenshots: hundreds of posts come back as JSON in seconds. The session lives in `~/.content-research/x/accounts.db`, never in this repo. `accounts` shows its state.
- `login` reads cookies from Firefox (or Chrome, Safari, Brave on the Mac). Chrome and Edge on Windows encrypt theirs, so there use Firefox or paste the two cookies from DevTools (Application, Cookies, x.com): `x.py cookies "auth_token=...; ct0=..."`.
- With no session, only `post` works (likes, replies and text from X's embed endpoint; no views). Every other command says how to add a session.
- Use a throwaway X account; scraping can get an account locked. X rate-limits each account per endpoint in 15-minute windows, and twscrape waits out the limit instead of failing. More accounts (`cookies`) spread the load.

## Outliers

The score I care about is **views per subscriber** (or follower) on recent posts, plus **× usual**: views divided by the median of the channel's last 30 uploads. A high × usual with a tiny median means a promoted video, not a hit.

- Rank Shorts and long-form separately. Their view counts aren't comparable.
- `yt.py outliers` drops paid ads: they get views with almost no engagement. A video is dropped under 0.15 likes per 100 views, or with zero comments. Real videos sit at 0.2 to 3. Brand channels (Manus, monday CRM, OpenAI Japan) are what it catches. `--keep-ads` shows them.
- YouTube's Shorts filter returns about a tenth as many results as long-form. Use more queries for Shorts.

## Showing results

Results I'll read go on an HTML page (`html-artifacts`): a ranked table with thumbnails (`i.ytimg.com/vi/<id>/mqdefault.jpg`), views, subs, views per sub and × usual, each linked. Fold the method and the dropped ads.
