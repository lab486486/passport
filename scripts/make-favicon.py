#!/usr/bin/env python3
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
NAVY = (27, 54, 93, 255)
WHITE = (255, 255, 255, 255)


def plane_points(size: int) -> list[tuple[float, float]]:
    s = size / 64
    return [
        (10 * s, 36.5 * s),
        (28 * s, 32.2 * s),
        (34 * s, 16.5 * s),
        (39.2 * s, 18.6 * s),
        (37.2 * s, 32.4 * s),
        (54 * s, 30.2 * s),
        (57.5 * s, 34.2 * s),
        (37.2 * s, 37.8 * s),
        (31.8 * s, 50.8 * s),
        (26.8 * s, 48.8 * s),
        (31.2 * s, 37.6 * s),
        (10 * s, 40.2 * s),
    ]


def make_icon(size: int, rounded: bool = True) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    radius = int(size * 0.18) if rounded else 0
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=NAVY)
    width = max(2, round(size * 0.04))
    draw.line(plane_points(size) + [plane_points(size)[0]], fill=WHITE, width=width, joint="curve")
    return img


def main() -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)
    icon32 = make_icon(32)
    icon48 = make_icon(48)
    icon96 = make_icon(96)
    icon192 = make_icon(192, rounded=False)
    icon180 = make_icon(180, rounded=False)
    icon32.save(PUBLIC / "favicon-32.png", "PNG")
    icon48.save(PUBLIC / "favicon-48.png", "PNG")
    icon96.save(PUBLIC / "favicon-96.png", "PNG")
    icon192.save(PUBLIC / "favicon-192.png", "PNG")
    icon180.save(PUBLIC / "apple-touch-icon.png", "PNG")
    icon48.convert("RGBA").save(
      PUBLIC / "favicon.ico",
      format="ICO",
      sizes=[(16, 16), (32, 32), (48, 48)],
    )


if __name__ == "__main__":
    main()
