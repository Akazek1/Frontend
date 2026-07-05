#!/usr/bin/env python3
"""Generate every PWA icon from one master logo.

Usage (from the HWA_Frontend directory):

    python3 scripts/generate-icons.py "/path/to/logo.png" [#background]

Example:

    python3 scripts/generate-icons.py \
        "/Users/egide/Documents/akazek/Logos/Logo white.png" "#145B10"

The logo may have a transparent background — it is composited onto the
given solid color (default: Akazek green #145B10), because home-screen
icons cannot be transparent (iOS fills transparency with black).

Outputs (overwritten in place):
    app/apple-icon.png              180x180  iOS home-screen icon
    app/icon.png                     32x32   favicon
    public/icons/apple-touch-icon.png 180x180 (same art as apple-icon)
    public/icons/icon-192.png       192x192  manifest / Android
    public/icons/icon-512.png       512x512  manifest / Android
    public/icons/icon-maskable-512.png 512x512 Android maskable (extra
        padding so the logo survives circular cropping)

After running: commit the changed PNGs and deploy. On iPhone, delete the
old home-screen icon AND clear the site's entry in Settings > Safari >
Advanced > Website Data, or iOS keeps showing its cached icon.
"""

import sys
from pathlib import Path

from PIL import Image

# How much of the icon's width the logo occupies. Regular icons can fill
# most of the canvas; maskable icons need the logo inside the central 80%
# "safe zone" or Android's circular mask crops it.
LOGO_SCALE = 0.78
LOGO_SCALE_MASKABLE = 0.62

OUTPUTS = [
    ("app/apple-icon.png", 180, LOGO_SCALE),
    ("app/icon.png", 32, LOGO_SCALE),
    ("public/icons/apple-touch-icon.png", 180, LOGO_SCALE),
    ("public/icons/icon-192.png", 192, LOGO_SCALE),
    ("public/icons/icon-512.png", 512, LOGO_SCALE),
    ("public/icons/icon-maskable-512.png", 512, LOGO_SCALE_MASKABLE),
]


def trim_transparent(img: Image.Image) -> Image.Image:
    """Crop away fully-transparent padding so LOGO_SCALE is measured
    against the actual artwork, not whatever padding the export had."""
    bbox = img.getbbox()
    return img.crop(bbox) if bbox else img


def is_opaque(img: Image.Image) -> bool:
    """True when the source has its own background baked in (no alpha).
    Such files are used FULL-BLEED: they already are the icon design, so
    scaling them down onto another color would frame them in a box."""
    alpha = img.getchannel("A")
    return alpha.getextrema()[0] == 255


def build_icon(logo: Image.Image, size: int, scale: float, bg: str) -> Image.Image:
    canvas = Image.new("RGB", (size, size), bg)
    target = int(size * scale)
    ratio = min(target / logo.width, target / logo.height)
    resized = logo.resize(
        (max(1, round(logo.width * ratio)), max(1, round(logo.height * ratio))),
        Image.LANCZOS,
    )
    pos = ((size - resized.width) // 2, (size - resized.height) // 2)
    canvas.paste(resized, pos, resized)  # logo's alpha as the paste mask
    return canvas


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src = Path(sys.argv[1])
    bg = sys.argv[2] if len(sys.argv) > 2 else "#145B10"

    root = Path(__file__).resolve().parent.parent
    logo = trim_transparent(Image.open(src).convert("RGBA"))

    full_bleed = is_opaque(logo)
    if full_bleed:
        # Full-bleed source: pad the maskable variant with the source's own
        # background color (corner pixel) so the padding is invisible.
        corner = logo.getpixel((0, 0))[:3]
        bg = "#%02x%02x%02x" % corner
        print(f"Opaque source: full-bleed icons, maskable padded with {bg}")

    for rel_path, size, scale in OUTPUTS:
        if full_bleed and scale == LOGO_SCALE:
            scale = 1.0
        icon = build_icon(logo, size, scale, bg)
        # Palette mode shrinks these flat-color PNGs ~4x with no visible loss.
        icon = icon.convert("P", palette=Image.ADAPTIVE, colors=256)
        out = root / rel_path
        icon.save(out, optimize=True)
        print(f"{rel_path}  {size}x{size}  {out.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
