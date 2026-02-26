import hashlib
import re
from pathlib import Path

TARGETS = [
    ("styles-critical.css", "styles-critical.min.css"),
    ("styles.css", "styles.min.css"),
    ("promo-critical.css", "promo-critical.min.css"),
    ("promo.css", "promo.min.css"),
]


def minify_css(content: str) -> str:
    content = re.sub(r"/\*.*?\*/", "", content, flags=re.S)
    content = re.sub(r"\s+", " ", content)
    content = re.sub(r"\s*([{}:;,>])\s*", r"\1", content)
    content = content.replace(";}", "}")
    return content.strip()

versions = {}
for source, output in TARGETS:
    css = Path(source).read_text(encoding="utf-8")
    minified = minify_css(css)
    Path(output).write_text(minified, encoding="utf-8")
    versions[output] = hashlib.md5(minified.encode("utf-8")).hexdigest()[:10]

for html_file in ["index.html", "promo.html"]:
    html = Path(html_file).read_text(encoding="utf-8")
    for filename, version in versions.items():
        html = re.sub(
            rf"{re.escape(filename)}(?:\?v=[a-f0-9]{{10}})?",
            f"{filename}?v={version}",
            html,
        )
    Path(html_file).write_text(html, encoding="utf-8")

print("Built minified CSS + versioned asset references")
