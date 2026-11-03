# /// script
# dependencies = ["yt-dlp"]
# ///
"""YouTube research without an API key or login. Run with `uv run yt.py <command> --help`."""
import argparse, base64, json, re, statistics, sys, urllib.parse, urllib.request
import concurrent.futures as cf
import yt_dlp

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

# Search filter (the `sp=` URL parameter) is a protobuf; these are its enum values.
SORT = {"relevance": None, "date": 2, "views": 3}
WHEN = {"hour": 1, "today": 2, "week": 3, "month": 4, "year": 5}
TYPE = {"video": 1, "shorts": 9}
LENGTH = {"short": 1, "long": 2, "medium": 3}  # short <4 min, medium 4-20, long >20


def varint(n):
    out = b""
    while True:
        b, n = n & 0x7F, n >> 7
        if n:
            out += bytes([b | 0x80])
        else:
            return out + bytes([b])


def sp(sort=None, when=None, type_=None, length=None):
    f = b""
    for tag, v in ((0x08, when), (0x10, type_), (0x18, length)):
        if v:
            f += bytes([tag]) + varint(v)
    msg = (b"\x08" + varint(sort) if sort is not None else b"") + (b"\x12" + varint(len(f)) + f if f else b"")
    return urllib.parse.quote(base64.b64encode(msg).decode()) if msg else ""


def ydl(**kw):
    opts = dict(quiet=True, no_warnings=True, js_runtimes={"node": {}}, skip_download=True)
    opts.update(kw)
    return yt_dlp.YoutubeDL(opts)


def flat(**kw):
    return ydl(extract_flat="in_playlist", **kw)


def video_id(s):
    m = re.search(r"(?:v=|youtu\.be/|shorts/|live/|embed/)([\w-]{11})", s)
    return m.group(1) if m else s


def channel_url(s):
    if s.startswith("http"):
        return s.split("?")[0].rstrip("/")
    if s.startswith("UC") and len(s) == 24:
        return f"https://www.youtube.com/channel/{s}"
    return f"https://www.youtube.com/@{s.lstrip('@')}"


def thumb(vid):
    return f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"


def row(e):
    vid = e["id"]
    return dict(id=vid, title=e.get("title"), channel=e.get("channel") or e.get("uploader"), channel_id=e.get("channel_id"),
                views=e.get("view_count"), duration=e.get("duration"), url=f"https://www.youtube.com/watch?v={vid}", thumb=thumb(vid))


def search(q, sort="relevance", when=None, type_=None, length=None, n=30):
    f = sp(SORT[sort], WHEN.get(when), TYPE.get(type_), LENGTH.get(length))
    url = f"https://www.youtube.com/results?search_query={urllib.parse.quote_plus(q)}" + (f"&sp={f}" if f else "")
    entries = flat(playlistend=n).extract_info(url, download=False).get("entries") or []
    return [dict(row(e), query=q) for e in entries if e.get("id") and e.get("ie_key", "Youtube") == "Youtube"]


def channel(ch, n=30, shorts=False):
    base = channel_url(ch)
    info = flat(playlist_items="0").extract_info(base, download=False)
    ups = flat(playlistend=n).extract_info(base + ("/shorts" if shorts else "/videos"), download=False).get("entries") or []
    ups = [row(e) for e in ups if e.get("id")]
    views = [u["views"] for u in ups if u["views"]]
    return dict(channel=info.get("channel"), channel_id=info.get("channel_id"), handle=info.get("uploader_id"),
                subs=info.get("channel_follower_count"), url=info.get("channel_url") or base,
                description=(info.get("description") or "")[:1000],
                median_views=statistics.median(views) if views else None, uploads=ups)


def video(v):
    i = ydl(ignore_no_formats_error=True).extract_info(f"https://www.youtube.com/watch?v={video_id(v)}", download=False)
    views, likes = i.get("view_count"), i.get("like_count")
    return dict(id=i["id"], title=i.get("title"), channel=i.get("channel"), channel_id=i.get("channel_id"),
                subs=i.get("channel_follower_count"), views=views, likes=likes, comments=i.get("comment_count"),
                like_rate=round(likes / views, 5) if likes and views else None,
                date=i.get("upload_date"), duration=i.get("duration"), tags=i.get("tags"), categories=i.get("categories"), chapters=[dict(t=c["start_time"], title=c["title"]) for c in i.get("chapters") or []],
                description=i.get("description"), thumb=f"https://i.ytimg.com/vi/{i['id']}/maxresdefault.jpg",
                caption_langs=sorted(i.get("subtitles") or {}), url=f"https://www.youtube.com/watch?v={i['id']}")


def transcript(v, lang="en"):
    i = ydl(ignore_no_formats_error=True).extract_info(f"https://www.youtube.com/watch?v={video_id(v)}", download=False)
    # Exact codes only: wildcards like en.* pull every auto-translation and get rate-limited (HTTP 429).
    for source, kind in ((i.get("subtitles") or {}, "manual"), (i.get("automatic_captions") or {}, "auto")):
        for code in (lang, f"{lang}-orig", next((c for c in source if c.split("-")[0] == lang), None)):
            tracks = source.get(code) if code else None
            fmt = next((t for t in tracks or [] if t.get("ext") == "json3"), None)
            if fmt:
                data = json.load(urllib.request.urlopen(fmt["url"], timeout=30))
                segs = []
                for ev in data.get("events", []):
                    text = "".join(s.get("utf8", "") for s in ev.get("segs") or []).replace("\n", " ").strip()
                    if text:
                        segs.append(dict(t=round(ev.get("tStartMs", 0) / 1000, 1), text=text))
                return dict(id=i["id"], title=i.get("title"), lang=code, kind=kind, segments=segs)
    return dict(id=i["id"], title=i.get("title"), error=f"no {lang} captions", available=sorted(i.get("subtitles") or {}))


def comments(v, n=50, sort="top"):
    i = ydl(getcomments=True, ignore_no_formats_error=True,
            extractor_args={"youtube": {"max_comments": [str(n), "all", "0", "0"], "comment_sort": [sort]}}).extract_info(
        f"https://www.youtube.com/watch?v={video_id(v)}", download=False)
    return [dict(author=c.get("author"), text=c.get("text"), likes=c.get("like_count"), when=c.get("_time_text"),
                 by_uploader=c.get("author_is_uploader")) for c in (i.get("comments") or [])[:n]]


def is_ad(r):
    """Paid ads collect views without engagement: real videos sit at 0.2-3 likes per 100 views."""
    v = r["views"]
    if r.get("likes") is not None:
        return r["likes"] / v < 0.0015 or not r.get("comments")
    return (r.get("comments") or 0) / v < 0.0001


def outliers(queries, when="month", type_="video", n=60, min_views=20_000, max_subs=100_000, top=60, keep_ads=False):
    shorts = type_ == "shorts"
    vids = {}
    with cf.ThreadPoolExecutor(4) as pool:
        for hits in pool.map(lambda q: search(q, "views", when, type_, None, n), queries):
            for h in hits:
                if (h["views"] or 0) >= min_views and h["channel_id"]:
                    vids.setdefault(h["id"], h)
    print(f"{len(vids)} videos with >= {min_views:,} views from {len(queries)} searches", file=sys.stderr)
    cids = sorted({v["channel_id"] for v in vids.values()})

    def chan(cid):
        try:
            c = channel(cid, 30, shorts)
            return cid, c["subs"], {u["id"]: u["views"] for u in c["uploads"] if u["views"]}
        except Exception:
            return cid, None, {}
    with cf.ThreadPoolExecutor(4) as pool:
        chans = {cid: (subs, ups) for cid, subs, ups in pool.map(chan, cids)}
    print(f"{len(cids)} channels looked up", file=sys.stderr)

    rows = []
    for v in vids.values():
        subs, ups = chans[v["channel_id"]]
        if not subs or subs > max_subs:
            continue
        others = [x for i, x in ups.items() if i != v["id"]]
        med = statistics.median(others) if len(others) >= 3 else None
        rows.append(dict(v, subs=subs, per_sub=round(v["views"] / max(subs, 100), 1),
                         vs_median=round(v["views"] / med, 1) if med else None, channel_median=med))
    rows.sort(key=lambda r: r["per_sub"], reverse=True)
    rows = rows[:top]

    def enrich(r):
        try:
            d = video(r["id"])
            return dict(r, likes=d["likes"], comments=d["comments"], date=d["date"], like_rate=d["like_rate"], tags=d["tags"])
        except Exception as e:
            return dict(r, error=str(e)[:200])
    with cf.ThreadPoolExecutor(4) as pool:
        rows = list(pool.map(enrich, rows))
    ads = [r for r in rows if "error" not in r and is_ad(r)]
    print(f"{len(rows)} small-channel hits checked, {len(ads)} look like paid ads"
          + ("" if keep_ads else " (dropped; --keep-ads to keep)"), file=sys.stderr)
    for r in rows:
        r["likely_ad"] = r in ads
    return rows if keep_ads else [r for r in rows if not r["likely_ad"]]


def download_thumb(v, out=None):
    vid = video_id(v)
    for size in ("maxresdefault", "sddefault", "hqdefault"):
        try:
            data = urllib.request.urlopen(f"https://i.ytimg.com/vi/{vid}/{size}.jpg", timeout=20).read()
            path = out or f"{vid}.jpg"
            open(path, "wb").write(data)
            return dict(id=vid, size=size, path=path, bytes=len(data))
        except Exception:
            continue
    return dict(id=vid, error="no thumbnail")


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--out", help="write JSON here instead of stdout")
    sub = p.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("search", help="search videos")
    s.add_argument("query")
    s.add_argument("--sort", choices=SORT, default="relevance")
    s.add_argument("--when", choices=WHEN)
    s.add_argument("--type", choices=TYPE)
    s.add_argument("--length", choices=LENGTH)
    s.add_argument("-n", type=int, default=30)
    c = sub.add_parser("channel", help="subs and recent uploads with views")
    c.add_argument("channel", help="@handle, channel URL or UC... id")
    c.add_argument("-n", type=int, default=30)
    c.add_argument("--shorts", action="store_true")
    v = sub.add_parser("video", help="full stats for one video")
    v.add_argument("video")
    t = sub.add_parser("transcript", help="captions as timed text")
    t.add_argument("video")
    t.add_argument("--lang", default="en")
    t.add_argument("--text", action="store_true", help="plain text, no timestamps")
    m = sub.add_parser("comments", help="top comments")
    m.add_argument("video")
    m.add_argument("-n", type=int, default=50)
    m.add_argument("--sort", choices=["top", "new"], default="top")
    th = sub.add_parser("thumb", help="download the largest thumbnail")
    th.add_argument("video")
    th.add_argument("--file")
    o = sub.add_parser("outliers", help="high views, low subs across searches")
    o.add_argument("queries", nargs="+")
    o.add_argument("--when", choices=WHEN, default="month")
    o.add_argument("--type", choices=TYPE, default="video")
    o.add_argument("-n", type=int, default=60, help="results per search")
    o.add_argument("--min-views", type=int, default=20_000)
    o.add_argument("--max-subs", type=int, default=100_000)
    o.add_argument("--top", type=int, default=60, help="rows to check for ads and return")
    o.add_argument("--keep-ads", action="store_true")
    a = p.parse_args()

    if a.cmd == "search":
        res = search(a.query, a.sort, a.when, a.type, a.length, a.n)
    elif a.cmd == "channel":
        res = channel(a.channel, a.n, a.shorts)
    elif a.cmd == "video":
        res = video(a.video)
    elif a.cmd == "transcript":
        res = transcript(a.video, a.lang)
        if a.text and "segments" in res:
            text = " ".join(s["text"] for s in res["segments"])
            return print(text) if not a.out else open(a.out, "w", encoding="utf-8").write(text)
    elif a.cmd == "comments":
        res = comments(a.video, a.n, a.sort)
    elif a.cmd == "thumb":
        res = download_thumb(a.video, a.file)
    else:
        res = outliers(a.queries, a.when, a.type, a.n, a.min_views, a.max_subs, a.top, a.keep_ads)
    text = json.dumps(res, ensure_ascii=False, indent=1)
    if a.out:
        open(a.out, "w", encoding="utf-8").write(text)
        print(f"wrote {a.out}", file=sys.stderr)
    else:
        print(text)


if __name__ == "__main__":
    main()
