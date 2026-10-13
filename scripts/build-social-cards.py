#!/usr/bin/env python3
"""Build page-specific Open Graph cards from cms/metadata.json.

Requires Pillow (python -m pip install Pillow). No network or browser at build
runtime. Manrope is bundled under SIL OFL; its license is in scripts/assets/.
Font source: https://github.com/google/fonts/tree/main/ofl/manrope
The output registry is consumed by the site's server-rendered SEO metadata.
"""
from __future__ import annotations

import argparse
import html
import json
import math
import re
from functools import lru_cache
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
WIDTH, HEIGHT, SCALE = 1200, 630, 2
FONT = ROOT / "scripts/assets/Manrope-Variable.ttf"
INK = "#21221f"
MUTED = "#5c6356"
BRAND = "Ziya Şakir Yılmaz"
STRAP = "KEYNOTE · EĞİTİM · MENTORLUK"
FOOTER = "Başarı · Kafa Yapısı · Satış · Liderlik"


def text(value: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(str(value))).strip()


def upper_tr(value: str) -> str:
    return value.translate(str.maketrans({"i": "İ", "ı": "I"})).upper()


@lru_cache(maxsize=128)
def font(size: int, weight: int = 600) -> ImageFont.FreeTypeFont:
    result = ImageFont.truetype(str(FONT), size * SCALE)
    result.set_variation_by_axes([weight])
    return result


def slug(route: str) -> str:
    if route == "/":
        return "home"
    result = route.strip("/").replace("/", "-")
    if not re.fullmatch(r"[a-z0-9-]+", result):
        raise ValueError(f"Unsafe social image route: {route}")
    return result


def line_width(value: str, face: ImageFont.FreeTypeFont) -> float:
    return face.getlength(value) / SCALE


def wrap_balanced(value: str, face: ImageFont.FreeTypeFont, width: int) -> list[str]:
    """Choose readable whole-word lines, avoiding a very short last line."""
    words = value.split()
    n = len(words)
    widths = {(a, b): line_width(" ".join(words[a:b]), face)
              for a in range(n) for b in range(a + 1, n + 1)}
    if any(widths[i, i + 1] > width for i in range(n)):
        return []
    for count in range(1, 4):
        @lru_cache(maxsize=None)
        def best(start: int, remaining: int):
            if remaining == 0:
                return (0, []) if start == n else None
            winner = None
            for end in range(start + 1, n + 1):
                length = widths[start, end]
                if length > width:
                    break
                tail = best(end, remaining - 1)
                if tail is None:
                    continue
                # Balanced lengths feel editorial, without splitting words.
                cost = (width - length) ** 2 + tail[0]
                if remaining == 1 and end - start == 1 and count > 1:
                    cost += width ** 2 * 0.32
                candidate = (cost, [" ".join(words[start:end])] + tail[1])
                if winner is None or candidate[0] < winner[0]:
                    winner = candidate
            return winner
        answer = best(0, count)
        if answer:
            return answer[1]
    return []


def fit_title(value: str) -> tuple[int, list[str], float]:
    for size in range(82, 47, -2):
        face = font(size, 650)
        lines = wrap_balanced(value, face, 1056)
        leading = size * 1.14
        height = leading * len(lines)
        if lines and height <= 244:
            return size, lines, leading
    raise ValueError(f"Title cannot fit without truncation: {value}")


def background(route: str) -> Image.Image:
    # A quiet sage light across ivory paper, with an uncluttered reading area.
    canvas = Image.new("RGB", (300, 158))
    pixels = canvas.load()
    tint = (220, 228, 208) if route.startswith("/makaleler/") else (216, 226, 207)
    if route.startswith("/notlar/"):
        tint = (226, 223, 207)
    for y in range(canvas.height):
        for x in range(canvas.width):
            glow = math.exp(-(((x - 302) / 140) ** 2 + ((y - 50) / 140) ** 2)) * 0.9
            pixels[x, y] = tuple(round(base * (1 - glow) + accent * glow)
                                  for base, accent in zip((245, 243, 238), tint))
    return canvas.resize((WIDTH * SCALE, HEIGHT * SCALE), Image.Resampling.BICUBIC)


def draw_text(draw: ImageDraw.ImageDraw, xy: tuple[float, float], value: str,
              size: int, weight: int = 600, fill: str = INK) -> tuple[float, ...]:
    x, y = (round(v * SCALE) for v in xy)
    face = font(size, weight)
    bounds = draw.textbbox((x, y), value, font=face, anchor="lt")
    if bounds[0] < 0 or bounds[1] < 0 or bounds[2] > WIDTH * SCALE or bounds[3] > HEIGHT * SCALE:
        raise ValueError(f"Text outside image: {value}")
    draw.text((x, y), value, font=face, fill=fill, anchor="lt")
    return tuple(v / SCALE for v in bounds)


def build_card(route: str, entry: dict) -> Image.Image:
    title = text(entry["socialTitle"])
    label = upper_tr(text(entry["socialLabel"]))
    if not title or not label or not text(entry["imageAlt"]):
        raise ValueError(f"Missing social metadata at {route}")
    image = background(route)
    draw = ImageDraw.Draw(image)

    draw_text(draw, (72, 59), BRAND, 28, 700)
    strap_width = line_width(STRAP, font(15, 600))
    draw_text(draw, (1128 - strap_width, 69), STRAP, 15, 600, MUTED)

    # The label's soft capsule echoes the site's rounded controls.
    label_width = line_width(label, font(17, 650))
    if label_width > 990:
        raise ValueError(f"Social label too long: {label}")
    capsule = tuple(round(v * SCALE) for v in (72, 157, 72 + label_width + 38, 201))
    draw.rounded_rectangle(capsule, radius=22 * SCALE, fill="#e0e5d8")
    draw_text(draw, (91, 169), label, 17, 650, "#4d5944")

    size, lines, leading = fit_title(title)
    block_height = len(lines) * leading
    top = 236 + (244 - block_height) / 2
    for index, line in enumerate(lines):
        bounds = draw_text(draw, (72, top + index * leading), line, size, 650)
        if bounds[2] > 1128.5 or bounds[3] > 486:
            raise ValueError(f"Title exceeds safe region: {route}: {line}")

    draw.line((72 * SCALE, 537 * SCALE, 1128 * SCALE, 537 * SCALE), fill="#cbd1c2", width=SCALE)
    draw_text(draw, (72, 564), FOOTER, 18, 500, MUTED)
    marker = "ZIYA ŞAKİR YILMAZ"
    marker_width = line_width(marker, font(13, 650))
    draw_text(draw, (1128 - marker_width, 569), marker, 13, 650, MUTED)
    return image.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--metadata", type=Path, default=ROOT / "cms/metadata.json")
    args = parser.parse_args()
    metadata = json.loads(args.metadata.read_text(encoding="utf-8"))
    if not isinstance(metadata, dict) or not metadata:
        raise ValueError("Metadata must be a non-empty route mapping")
    registry = {}
    sizes = []
    output_paths = [ROOT / "website/assets/og", ROOT / "public/assets/og"]
    for folder in output_paths:
        folder.mkdir(parents=True, exist_ok=True)
    expected = set()
    for route, entry in sorted(metadata.items()):
        filename = f"{slug(route)}.png"
        if filename in expected:
            raise ValueError(f"Social image filename collision: {filename}")
        expected.add(filename)
        card = build_card(route, entry)
        destination = output_paths[0] / filename
        card.save(destination, format="PNG", optimize=True, compress_level=9)
        payload = destination.read_bytes()
        (output_paths[1] / filename).write_bytes(payload)
        sizes.append(len(payload))
        registry[f"/assets/og/{filename}"] = {
            "alt": text(entry["imageAlt"]),
            "width": WIDTH,
            "height": HEIGHT,
            "type": "image/png",
        }
    # Remove obsolete generated cards when a route is removed from the catalog.
    for folder in output_paths:
        for item in folder.glob("*.png"):
            if item.name not in expected:
                item.unlink()
    (ROOT / "cms/social-images.json").write_text(
        json.dumps(registry, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(registry)} page-specific social cards: {WIDTH}×{HEIGHT}; "
          f"all titles fit; {sum(sizes) / 1048576:.2f} MiB total; "
          f"largest {max(sizes) / 1024:.0f} KiB.")


if __name__ == "__main__":
    main()
