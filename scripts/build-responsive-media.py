#!/usr/bin/env python3
"""Derive delivery-sized WebP assets without changing the original media.

Run after replacing any registered source photograph. Requires Pillow with
WebP support. The committed registry is used by both SSR and the CMS preview;
production builds do not need Python or an image processing service.
"""
from __future__ import annotations

import argparse
import io
import json
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    "tedx-oan-sahne-genis.jpg": "image",
    "salon-genis.webp": "image",
    "klip-uluslararasi-restored-poster.jpg": "poster",
}
WIDTHS = (480, 768, 1024, 1280, 1600)
QUALITY = 82


def build(check: bool = False) -> None:
    registry = {}
    for filename, use in SOURCES.items():
        source = ROOT / "website/assets" / filename
        with Image.open(source) as original:
            im = ImageOps.exif_transpose(original).convert("RGB")
            width, height = im.size
            sizes = sorted({*(w for w in WIDTHS if w < width), width}) if use == "image" else [width]
            variants = []
            for target_width in sizes:
                target_height = round(height * target_width / width)
                resized = im.resize((target_width, target_height), Image.Resampling.LANCZOS)
                out = io.BytesIO()
                resized.save(out, format="WEBP", quality=QUALITY, method=6)
                data = out.getvalue()
                url = f"/assets/responsive/{source.stem}-{target_width}.webp"
                for tree in ("website", "public"):
                    target = ROOT / tree / url.lstrip("/")
                    if check:
                        if not target.exists() or target.read_bytes() != data:
                            raise SystemExit(f"Stale responsive asset: {target.relative_to(ROOT)}")
                    else:
                        target.parent.mkdir(parents=True, exist_ok=True)
                        target.write_bytes(data)
                variants.append({"src": url, "width": target_width, "height": target_height, "bytes": len(data)})
            fallback = next((v for v in variants if v["width"] == 1280), variants[-1])
            registry[f"/assets/{filename}"] = {
                "use": use, "width": width, "height": height,
                "fallback": fallback["src"], "variants": variants,
            }
            print(f"{filename}: original {source.stat().st_size:,} bytes; "
                  f"fallback {fallback['width']}px / {fallback['bytes']:,} bytes; "
                  f"{len(variants)} delivery sizes")
    path = ROOT / "cms/responsive-images.json"
    content = json.dumps(registry, ensure_ascii=False, indent=2) + "\n"
    if check:
        if not path.exists() or path.read_text() != content:
            raise SystemExit("Stale responsive image registry")
    else:
        path.write_text(content)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Verify committed assets without writing")
    build(parser.parse_args().check)
