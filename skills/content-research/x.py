# /// script
# dependencies = ["twscrape", "playwright"]
# ///
"""X (Twitter) research through a logged-in session, free. Run with `uv run x.py <command> --help`."""
import argparse, asyncio, json, re, statistics, sys, time, urllib.request
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

STATE = Path.home() / ".content-research" / "x"
DB = STATE / "accounts.db"
PROFILE = STATE / "browser-profile"


def api():
    from twscrape import API
    from twscrape.logger import set_log_level
    set_log_level("WARNING")
    STATE.mkdir(parents=True, exist_ok=True)
    return API(str(DB), raise_when_no_account=True)


def post_id(s):
    m = re.search(r"status(?:es)?/(\d+)", s)
    return int(m.group(1) if m else s)


def handle(s):
    return s.rstrip("/").split("/")[-1].lstrip("@")


def user_row(u):
    return dict(handle=u.username, name=u.displayname, followers=u.followersCount, following=u.friendsCount,
                posts=u.statusesCount, likes_given=u.favouritesCount, listed=u.listedCount, media=u.mediaCount,
                bio=u.rawDescription, location=u.location, created=str(u.created.date()) if u.created else None,
                verified=u.verified or u.blue, avatar=u.profileImageUrl, url=f"https://x.com/{u.username}")


def media_urls(m):
    if not m:
        return []
    out = [p.url for p in getattr(m, "photos", [])]
    for v in getattr(m, "videos", []) + getattr(m, "animated", []):
        variants = getattr(v, "variants", None) or []
        best = max(variants, key=lambda x: getattr(x, "bitrate", 0) or 0, default=None)
        out.append(getattr(best, "url", None) or getattr(v, "videoUrl", None) or getattr(v, "thumbnailUrl", None))
    return [u for u in out if u]


def post_row(t):
    u = t.user
    views = t.viewCount
    eng = (t.likeCount or 0) + (t.retweetCount or 0) + (t.replyCount or 0) + (t.quoteCount or 0)
    return dict(id=t.id_str, url=t.url, date=t.date.isoformat(), handle=u.username, followers=u.followersCount,
                text=t.rawContent, views=views, likes=t.likeCount, reposts=t.retweetCount, replies=t.replyCount,
                quotes=t.quoteCount, bookmarks=t.bookmarkedCount,
                views_per_follower=round(views / max(u.followersCount, 50), 2) if views else None,
                engagement_rate=round(eng / views, 4) if views else None,
                lang=t.lang, media=media_urls(t.media), reply_to=t.inReplyToTweetIdStr,
                conversation=t.conversationIdStr, quoted=t.quotedTweet.url if t.quotedTweet else None,
                repost_of=t.retweetedTweet.url if t.retweetedTweet else None)


async def gather(gen, n):
    out = []
    async for x in gen:
        out.append(x)
        if len(out) >= n:
            break
    return out


async def add_cookies(cookies):
    """Add a session from a cookie string containing auth_token and ct0."""
    m = re.search(r"twid=u%3D(\d+)", cookies)
    name = f"x-{m.group(1)}" if m else f"x-{int(time.time())}"
    a = api()
    await a.pool.add_account(name, "-", "-", "-", cookies=cookies)
    acc = await a.pool.get(name)
    return dict(account=name, active=acc.active, db=str(DB))


async def login(timeout=600):
    """Open a dedicated browser window, wait for the X login, then save its session cookies."""
    from playwright.async_api import async_playwright
    PROFILE.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        args = dict(user_data_dir=str(PROFILE), headless=False, ignore_default_args=["--enable-automation"],
                    args=["--disable-blink-features=AutomationControlled"])
        try:
            ctx = await p.chromium.launch_persistent_context(channel="chrome", **args)
        except Exception:
            ctx = await p.chromium.launch_persistent_context(**args)  # needs `uv run --with playwright playwright install chromium`
        page = ctx.pages[0] if ctx.pages else await ctx.new_page()
        await page.goto("https://x.com/login")
        print("Log in to X in the window that opened. Waiting...", file=sys.stderr)
        deadline = time.time() + timeout
        while time.time() < deadline:
            jar = {c["name"]: c["value"] for c in await ctx.cookies("https://x.com")}
            if jar.get("auth_token") and jar.get("ct0"):
                await asyncio.sleep(3)  # let ct0 settle after the redirect
                jar = {c["name"]: c["value"] for c in await ctx.cookies("https://x.com")}
                await ctx.close()
                return await add_cookies("; ".join(f"{k}={v}" for k, v in jar.items()))
            await asyncio.sleep(2)
        await ctx.close()
        return dict(error="timed out waiting for login")


def post_logged_out(pid):
    """X's embed endpoint serves single posts without a login (no view counts)."""
    d = json.load(urllib.request.urlopen(f"https://cdn.syndication.twimg.com/tweet-result?id={pid}&token=a", timeout=20))
    u = d.get("user", {})
    return dict(id=d.get("id_str"), url=f"https://x.com/{u.get('screen_name')}/status/{d.get('id_str')}", date=d.get("created_at"),
                handle=u.get("screen_name"), text=d.get("text"), likes=d.get("favorite_count"),
                replies=d.get("conversation_count"), lang=d.get("lang"),
                media=[m.get("media_url_https") for m in d.get("mediaDetails", [])], logged_out=True)


async def outliers(queries, n, min_views, max_followers, min_followers):
    a = api()
    seen = {}
    for q in queries:
        for t in await gather(a.search(q, limit=n, kv={"product": "Top"}), n):
            if t.retweetedTweet:
                continue
            r = post_row(t)
            if (r["views"] or 0) >= min_views and min_followers <= r["followers"] <= max_followers:
                seen.setdefault(r["id"], dict(r, query=q))
        print(f"{q}: {len(seen)} kept so far", file=sys.stderr)
    return sorted(seen.values(), key=lambda r: r["views_per_follower"] or 0, reverse=True)


async def run(a):
    if a.cmd == "login":
        return await login()
    if a.cmd == "cookies":
        return await add_cookies(a.cookies)
    if a.cmd == "accounts":
        return [dict(username=x["username"], active=x["active"], last_used=str(x["last_used"]), total_req=x["total_req"],
                     error=x["error_msg"]) for x in await api().pool.accounts_info()]
    x = api()
    if a.cmd == "search":
        kv = {"product": "Latest" if a.latest else "Top"}
        return [post_row(t) for t in await gather(x.search(a.query, limit=a.n, kv=kv), a.n)]
    if a.cmd == "user":
        u = await x.user_by_login(handle(a.user))
        return user_row(u) if u else dict(error="not found")
    if a.cmd == "posts":
        u = await x.user_by_login(handle(a.user))
        if not u:
            return dict(error="not found")
        gen = x.user_tweets_and_replies(u.id, limit=a.n) if a.replies else x.user_tweets(u.id, limit=a.n)
        posts = [post_row(t) for t in await gather(gen, a.n)]
        own = [p for p in posts if p["handle"].lower() == u.username.lower() and not p["repost_of"]]
        views = [p["views"] for p in own if p["views"]]
        return dict(user=user_row(u), median_views=statistics.median(views) if views else None, posts=posts)
    if a.cmd == "post":
        try:
            t = await x.tweet_details(post_id(a.post))
        except Exception:
            t = None  # no session: fall back to the embed endpoint
        return post_row(t) if t else post_logged_out(post_id(a.post))
    if a.cmd == "thread":
        return [post_row(t) for t in await gather(x.tweet_thread(post_id(a.post)), 200)]
    if a.cmd == "replies":
        return [post_row(t) for t in await gather(x.tweet_replies(post_id(a.post), limit=a.n), a.n)]
    if a.cmd == "trends":
        return [dict(rank=t.rank, name=t.name, url=t.trend_url.url if t.trend_url else None,
                     context=getattr(t.trend_metadata, "domain_context", None),
                     posts=getattr(t.trend_metadata, "meta_description", None))
                for t in await gather(x.trends(a.category), a.n)]
    if a.cmd == "people":
        return [user_row(u) for u in await gather(x.search_user(a.query, limit=a.n), a.n)]
    if a.cmd == "outliers":
        return await outliers(a.queries, a.n, a.min_views, a.max_followers, a.min_followers)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--out", help="write JSON here instead of stdout")
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("login", help="log in once in a browser window; saves the session")
    sub.add_parser("cookies", help="add a session from a cookie string").add_argument("cookies", help='"auth_token=...; ct0=..."')
    sub.add_parser("accounts", help="saved sessions and their state")
    s = sub.add_parser("search", help="search posts; X operators work (min_faves:500 since:2026-10-01 lang:en from:user -filter:replies)")
    s.add_argument("query")
    s.add_argument("--latest", action="store_true", help="newest first instead of Top")
    s.add_argument("-n", type=int, default=50)
    sub.add_parser("user", help="profile and counts").add_argument("user", help="handle or profile URL")
    ps = sub.add_parser("posts", help="a user's recent posts with views and engagement")
    ps.add_argument("user")
    ps.add_argument("-n", type=int, default=40)
    ps.add_argument("--replies", action="store_true", help="include their replies")
    sub.add_parser("post", help="one post's stats").add_argument("post", help="id or URL")
    sub.add_parser("thread", help="the author's thread a post belongs to").add_argument("post")
    r = sub.add_parser("replies", help="replies to a post")
    r.add_argument("post")
    r.add_argument("-n", type=int, default=50)
    t = sub.add_parser("trends", help="what's trending")
    t.add_argument("category", nargs="?", default="trending", help="trending, news, sport, entertainment")
    t.add_argument("-n", type=int, default=30)
    pe = sub.add_parser("people", help="search accounts")
    pe.add_argument("query")
    pe.add_argument("-n", type=int, default=20)
    o = sub.add_parser("outliers", help="posts with many views from small accounts")
    o.add_argument("queries", nargs="+")
    o.add_argument("-n", type=int, default=100, help="posts per search")
    o.add_argument("--min-views", type=int, default=10_000)
    o.add_argument("--max-followers", type=int, default=50_000)
    o.add_argument("--min-followers", type=int, default=0)
    a = p.parse_args()
    try:
        res = asyncio.run(run(a))
    except Exception as e:
        if "No account" in str(e) or "NoAccount" in type(e).__name__:
            sys.exit("No X session saved. Run `uv run x.py login` and log in once.")
        raise
    text = json.dumps(res, ensure_ascii=False, indent=1, default=str)
    if a.out:
        open(a.out, "w", encoding="utf-8").write(text)
        print(f"wrote {a.out}", file=sys.stderr)
    else:
        print(text)


if __name__ == "__main__":
    main()
