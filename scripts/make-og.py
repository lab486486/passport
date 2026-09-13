#!/usr/bin/env python3
from __future__ import annotations

import io
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "og"
ASSETS = ROOT / "assets"

COUNTRIES = [
    ("japan", "일본", "jp"),
    ("vietnam", "베트남", "vn"),
    ("thailand", "태국", "th"),
    ("taiwan", "대만", "tw"),
    ("philippines", "필리핀", "ph"),
    ("usa", "미국", "us"),
    ("china", "중국", "cn"),
    ("hongkong", "홍콩", "hk"),
    ("macau", "마카오", "mo"),
    ("singapore", "싱가포르", "sg"),
    ("malaysia", "말레이시아", "my"),
    ("indonesia", "인도네시아", "id"),
    ("guam", "괌", "gu"),
    ("saipan", "사이판", "mp"),
    ("hawaii", "하와이", "us"),
    ("australia", "호주", "au"),
    ("canada", "캐나다", "ca"),
    ("uk", "영국", "gb"),
    ("france", "프랑스", "fr"),
    ("italy", "이탈리아", "it"),
    ("spain", "스페인", "es"),
    ("germany", "독일", "de"),
    ("czech", "체코", "cz"),
    ("switzerland", "스위스", "ch"),
    ("turkey", "튀르키예", "tr"),
    ("laos", "라오스", "la"),
    ("cambodia", "캄보디아", "kh"),
    ("mongolia", "몽골", "mn"),
    ("uae", "UAE", "ae"),
    ("newzealand", "뉴질랜드", "nz"),
]


def font(size: int) -> ImageFont.FreeTypeFont:
    for path in (
        "/System/Library/Fonts/AppleSDGothicNeo.ttc",
        "/Library/Fonts/AppleGothic.ttf",
        "/System/Library/Fonts/Supplemental/AppleGothic.ttf",
    ):
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def flag(iso: str) -> Image.Image | None:
    url = f"https://flagcdn.com/w640/{iso}.png"
    try:
        with urllib.request.urlopen(url, timeout=20) as res:
            return Image.open(io.BytesIO(res.read())).convert("RGBA")
    except Exception:
        return None


def compose_default() -> Image.Image:
    sources = [
        ASSETS / "___________2026-08-17_14.06.14-73aa0e62-67d1-4e2c-8eca-1d052f258161.png",
        ROOT / "public" / "og" / "default.png",
    ]
    src = next((path for path in sources if path.exists()), None)
    target = (1200, 630)
    canvas = Image.new("RGB", target, "#0b1f4a")
    if not src:
        return canvas
    photo = Image.open(src).convert("RGB")
    scale = min(target[0] / photo.width, target[1] / photo.height)
    nw, nh = round(photo.width * scale), round(photo.height * scale)
    fitted = photo.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (target[0] - nw) // 2
    top = (target[1] - nh) // 2
    canvas.paste(fitted, (left, top))
    return canvas


def compose(name: str, iso: str) -> Image.Image:
    img = Image.new("RGB", (1200, 630), "#1b365d")
    draw = ImageDraw.Draw(img)
    banner = flag(iso)
    if banner:
        banner = banner.resize((1200, 630))
        overlay = Image.new("RGB", (1200, 630), "#1b365d")
        img = Image.blend(overlay, banner.convert("RGB"), 0.28)
        draw = ImageDraw.Draw(img)
    draw.rectangle((0, 0, 1200, 630), outline="#b8892d", width=16)
    draw.text((64, 70), "국가별 여권 유효기간", font=font(36), fill="#b8892d")
    draw.text((64, 220), f"{name} 여행", font=font(72), fill="#ffffff")
    draw.text((64, 320), "여권 유효기간", font=font(72), fill="#ffffff")
    draw.text((64, 520), "6개월 미만 · 3개월 미만 · 만료 전 조회", font=font(28), fill="#e8eef6")
    return img


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    compose_default().save(OUT / "default.png", "PNG")
    handmade = {
        "japan",
        "vietnam",
        "thailand",
        "taiwan",
        "usa",
        "china",
        "hongkong",
        "philippines",
    }
    for slug in handmade:
        src = ASSETS / f"{slug}.png"
        if src.exists():
            Image.open(src).convert("RGB").resize((1200, 630)).save(OUT / f"{slug}.png", "PNG")
    for slug, name, iso in COUNTRIES:
        if (OUT / f"{slug}.png").exists() and slug in handmade:
            continue
        compose(name, iso).save(OUT / f"{slug}.png", "PNG")


if __name__ == "__main__":
    main()
