#!/usr/bin/env python3
"""Generate RSS feed (feed.xml) from HTML articles in the repository."""

import os
import re
import html
from datetime import datetime
from xml.etree.ElementTree import Element, SubElement, tostring, indent

SITE_URL = "https://elrockdetodoslosdias.com.mx"
SITE_TITLE = "El Rock de todos los Días"
SITE_DESCRIPTION = "Archivo independiente de cultura y ruido. Rock, metal y música underground mexicana."
IGNORE_DIRS = {".git", ".github", "olds", "webfonts"}
SKIP_FILES = {"index.html", "plantilla-nota.html", "CMBA.html", "JUMBO1.html"}


def extract_meta(content, pattern):
    m = re.search(pattern, content)
    return html.unescape(m.group(1)).strip() if m else ""


def parse_html(filepath, repo_root):
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    if "article:published_time" not in content:
        return None

    title = extract_meta(content, r"<title>(.*?)</title>")
    title = re.sub(r"^\s*(ELROCK|BYTEMOS)\s*\|?\s*", "", title).strip()
    if not title:
        return None

    date_str = extract_meta(content, r'article:published_time"\s*content="([^"]+)"')
    description = extract_meta(content, r'<meta\s+name="description"\s+content="([^"]+)"')
    if not description:
        description = extract_meta(content, r'<meta\s+content="([^"]+)"\s+name="description"')

    og_image = extract_meta(content, r'property="og:image"\s+content="([^"]+)"')
    if not og_image:
        og_image = extract_meta(content, r'content="([^"]+)"\s+property="og:image"')

    og_url = extract_meta(content, r'property="og:url"\s+content="([^"]+)"')
    if not og_url:
        og_url = extract_meta(content, r'content="([^"]+)"\s+property="og:url"')

    canonical = extract_meta(content, r'rel="canonical"\s+href="([^"]+)"')
    if not canonical:
        canonical = extract_meta(content, r'href="([^"]+)"\s+rel="canonical"')

    rel_path = os.path.relpath(filepath, repo_root).replace("\\", "/")
    link = og_url or canonical or f"{SITE_URL}/{rel_path}"

    try:
        pub_date = datetime.strptime(date_str, "%Y-%m-%d")
    except (ValueError, TypeError):
        pub_date = datetime.now()

    return {
        "title": title,
        "link": link,
        "description": description or title,
        "pub_date": pub_date,
        "image": og_image,
        "rel_path": rel_path,
    }


def build_rss(articles):
    articles.sort(key=lambda a: a["pub_date"], reverse=True)

    rss = Element("rss", version="2.0")
    rss.set("xmlns:media", "http://search.yahoo.com/mrss/")
    rss.set("xmlns:content", "http://purl.org/rss/1.0/modules/content/")

    channel = SubElement(rss, "channel")
    SubElement(channel, "title").text = SITE_TITLE
    SubElement(channel, "link").text = SITE_URL
    SubElement(channel, "description").text = SITE_DESCRIPTION
    SubElement(channel, "language").text = "es-mx"
    SubElement(channel, "lastBuildDate").text = datetime.now().strftime(
        "%a, %d %b %Y %H:%M:%S +0000"
    )
    SubElement(channel, "generator").text = "generate-rss.py"

    for art in articles:
        item = SubElement(channel, "item")
        SubElement(item, "title").text = art["title"]
        SubElement(item, "link").text = art["link"]
        SubElement(item, "guid").text = art["link"]
        SubElement(item, "description").text = art["description"]
        SubElement(item, "pubDate").text = art["pub_date"].strftime(
            "%a, %d %b %Y %H:%M:%S +0000"
        )
        if art["image"]:
            SubElement(item, "media:thumbnail", url=art["image"])
            SubElement(item, "media:content", url=art["image"], medium="image")

    indent(rss, space="  ")
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + tostring(
        rss, encoding="unicode", xml_declaration=False
    )


def main():
    repo_root = os.path.dirname(os.path.abspath(__file__))
    articles = []

    for root, dirs, files in os.walk(repo_root):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for fname in files:
            if not fname.endswith(".html") or fname in SKIP_FILES:
                continue
            fpath = os.path.join(root, fname)
            art = parse_html(fpath, repo_root)
            if art:
                articles.append(art)

    if not articles:
        print("WARNING: No articles found.")
        return

    rss_xml = build_rss(articles)
    out_path = os.path.join(repo_root, "feed.xml")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(rss_xml)

    print(f"feed.xml generated with {len(articles)} articles.")


if __name__ == "__main__":
    main()
