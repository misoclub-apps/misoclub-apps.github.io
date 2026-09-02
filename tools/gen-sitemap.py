#!/usr/bin/env python3
"""sitemap.xml を作り直す。

リポジトリ内の *.html を走査して、検索に出すページだけを列挙する。
GitHub Actions（.github/workflows/sitemap.yml）が push のたびに叩くので、
普段は手で実行しなくてよい。手元で確かめたいときだけ:

    python3 tools/gen-sitemap.py

**ページの一覧をこのファイルに持たない。** 載せる／載せないの判断は各 HTML の
`<meta name="robots" content="noindex">` が唯一の正典で、ここには「その他の除外」
（雛形と Search Console の確認ファイル）だけを書く。新しいページを足したときに
サイトマップ側を直し忘れる、という事故を構造的に起こさないため。
"""

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# <meta name="robots" ... content="...noindex...">。属性の順番が逆でも拾えるように、
# robots メタのタグ全体を取ってから noindex を探す2段構えにしている。
ROBOTS_META = re.compile(r"""<meta\b[^>]*\bname\s*=\s*["']robots["'][^>]*>""", re.I)


def is_noindex(path: Path) -> bool:
    # 制御文字などが混ざっていても落ちないようにバイトで読んで置換デコードする。
    html = path.read_bytes().decode("utf-8", errors="replace")
    return any("noindex" in tag.lower() for tag in ROBOTS_META.findall(html))


def is_excluded(rel: str) -> bool:
    # アプリ追加用の雛形（タイトルがプレースホルダのまま公開されている）
    if rel.startswith("apps/_template/"):
        return True
    # Search Console の所有権確認ファイル（ルート直下の googleXXXX.html）
    if "/" not in rel and rel.startswith("google") and rel.endswith(".html"):
        return True
    return False


def to_url(origin: str, rel: str) -> str:
    """ファイルの相対パスを公開 URL にする。index.html はディレクトリ URL にたたむ。"""
    if rel == "index.html":
        return origin + "/"
    if rel.endswith("/index.html"):
        return origin + "/" + rel[: -len("index.html")]
    return origin + "/" + rel


def last_modified(rel: str) -> str | None:
    """最終更新日（YYYY-MM-DD）を git のコミット日時から取る。

    ファイルの mtime は checkout のたびに現在時刻になるので使えない。
    まだ git に入っていないファイルは None（<lastmod> は任意項目なので省く）。
    """
    try:
        out = subprocess.run(
            ["git", "-C", str(ROOT), "log", "-1", "--format=%cI", "--", rel],
            capture_output=True,
            text=True,
            check=True,
        ).stdout.strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None
    return out[:10] or None


def main() -> int:
    cname = ROOT / "CNAME"
    if not cname.is_file():
        print("CNAME が見つからない。公開ホストが決められないので中止する。", file=sys.stderr)
        return 1
    origin = "https://" + cname.read_text().strip()

    urls = []
    forgotten = []
    for path in sorted(ROOT.rglob("*.html")):
        rel = path.relative_to(ROOT).as_posix()
        if rel.startswith(".git/") or is_excluded(rel):
            continue
        if is_noindex(path):
            # apps/<アプリ>/index.html は必ず検索に出すページ。そこに noindex が
            # 付いているのは、まず間違いなく apps/_template/ からコピーしたときの
            # 消し忘れなので警告する（ポリシー等の noindex は正常なので黙っている）。
            parts = rel.split("/")
            if len(parts) == 3 and parts[0] == "apps" and parts[2] == "index.html":
                forgotten.append(rel)
            continue
        urls.append((to_url(origin, rel), last_modified(rel)))
    urls.sort()

    for rel in forgotten:
        print(
            f"警告: {rel} に noindex が付いている。"
            "雛形からコピーしたときの消し忘れなら、その1行を削ること。",
            file=sys.stderr,
        )

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for loc, lastmod in urls:
        lines.append("  <url>")
        lines.append(f"    <loc>{loc}</loc>")
        # <changefreq> と <priority> は Google が公式に無視するので出さない。
        if lastmod:
            lines.append(f"    <lastmod>{lastmod}</lastmod>")
        lines.append("  </url>")
    lines.append("</urlset>")

    (ROOT / "sitemap.xml").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"{len(urls)} URLs -> sitemap.xml")
    return 0


if __name__ == "__main__":
    sys.exit(main())
