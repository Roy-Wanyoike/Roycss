#!/usr/bin/env python3
"""RoyCSS brand logo builder — squircle icon + wordmark lockups.

Renders vector-crisp logo assets matching the product brand:
emerald -> cyan -> violet gradient squircle, white angle brackets + 4-point sparkle.
"""
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import numpy as np
import os

OUT = os.path.dirname(os.path.abspath(__file__))

# Brand palette (matches product hero/gradient bar)
STOPS = [
    (0.0, (16, 185, 129)),    # emerald-500
    (0.5, (6, 182, 212)),     # cyan-500
    (1.0, (139, 92, 246)),    # violet-500
]
CHARCOAL = (15, 23, 42)       # slate-900 text
SS = 4                        # supersample factor


def gradient_np(w: int, h: int) -> np.ndarray:
    """Diagonal (TL -> BR) multi-stop gradient."""
    xx, yy = np.meshgrid(np.linspace(0, 1, w), np.linspace(0, 1, h))
    t = ((xx + yy) / 2.0)
    pos = np.array([p for p, _ in STOPS])
    cols = np.array([c for _, c in STOPS], dtype=float)
    img = np.zeros((h, w, 3), dtype=float)
    for ch in range(3):
        img[..., ch] = np.interp(t, pos, cols[:, ch])
    return img


def rounded_mask(size: int, radius: int) -> Image.Image:
    m = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return m


def draw_bracket(d: ImageDraw.Draw, cx: float, cy: float, half_h: float,
                 depth: float, stroke: int, flip: bool, color=(255, 255, 255)):
    """Rounded angle bracket '<' (flip=False) or '>' (flip=True)."""
    s = -1 if flip else 1
    tip = (cx - s * depth, cy)
    top = (cx + s * depth * 0.78, cy - half_h)
    bot = (cx + s * depth * 0.78, cy + half_h)
    d.line([top, tip, bot], fill=color, width=stroke, joint="curve")
    r = stroke / 2
    for (x, y) in (top, bot):
        d.ellipse([x - r, y - r, x + r, y + r], fill=color)


def draw_sparkle(d: ImageDraw.Draw, cx: float, cy: float, r_out: float,
                 color=(255, 255, 255), ratio: float = 0.26):
    """4-point sparkle star with concave-looking inner vertices."""
    pts = []
    for i in range(8):
        ang = i * np.pi / 4 - np.pi / 2  # start pointing up
        r = r_out if i % 2 == 0 else r_out * ratio
        pts.append((cx + r * np.cos(ang), cy + r * np.sin(ang)))
    d.polygon(pts, fill=color)


def render_icon(size: int = 1024) -> Image.Image:
    """Transparent squircle icon, supersampled."""
    S = size * SS
    # gradient tile
    grad = gradient_np(S, S)
    tile = Image.fromarray(grad.astype(np.uint8), "RGB")
    radius = int(S * 0.28)
    mask = rounded_mask(S, radius)
    icon = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    icon.paste(tile, (0, 0), mask)

    # subtle top-left sheen for depth
    sheen = Image.new("L", (S, S), 0)
    ds = ImageDraw.Draw(sheen)
    ds.ellipse([-S * 0.35, -S * 0.45, S * 0.75, S * 0.35], fill=46)
    sheen = sheen.filter(ImageFilter.GaussianBlur(S * 0.06))
    white_layer = Image.new("RGBA", (S, S), (255, 255, 255, 0))
    icon = Image.composite(Image.alpha_composite(icon, Image.merge("RGBA", (*white_layer.split()[:3], sheen))), icon, mask)

    # glyph
    d = ImageDraw.Draw(icon)
    stroke = int(S * 0.082)
    cx, cy = S / 2, S / 2
    half_h = S * 0.215
    depth = S * 0.115
    gap = S * 0.235
    draw_bracket(d, cx - gap, cy, half_h, depth, stroke, flip=False)
    draw_bracket(d, cx + gap, cy, half_h, depth, stroke, flip=True)
    draw_sparkle(d, cx, cy, S * 0.092)

    return icon.resize((size, size), Image.LANCZOS)


def with_shadow(icon: Image.Image, pad_ratio=0.16, dy_ratio=0.035) -> Image.Image:
    """Icon + soft drop shadow on transparent canvas."""
    size = icon.size[0]
    pad = int(size * pad_ratio)
    canvas = Image.new("RGBA", (size + pad * 2, size + pad * 2 + int(size * 0.04)), (0, 0, 0, 0))
    # shadow
    alpha = icon.split()[3]
    shadow = Image.new("RGBA", icon.size, (2, 6, 23, 110))
    shadow.putalpha(alpha.point(lambda a: int(a * 0.45)))
    shadow = shadow.filter(ImageFilter.GaussianBlur(size * 0.035))
    dy = int(size * dy_ratio)
    canvas.alpha_composite(shadow, (pad, pad + dy))
    canvas.alpha_composite(icon, (pad, pad))
    return canvas


def with_glow(icon: Image.Image) -> Image.Image:
    """Icon + colored outer glow (for dark backgrounds)."""
    size = icon.size[0]
    glow = icon.filter(ImageFilter.GaussianBlur(size * 0.055))
    glow = Image.eval(glow, lambda a: a)  # keep
    canvas = Image.new("RGBA", icon.size, (0, 0, 0, 0))
    canvas.alpha_composite(glow)
    canvas.alpha_composite(icon)
    return canvas


def gradient_text(text: str, font: ImageFont.FreeTypeFont, grad_img: Image.Image) -> Image.Image:
    """Render text filled with the brand gradient."""
    pad = 40
    bbox = font.getbbox(text)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    mask = Image.new("L", (w + pad * 2, h + pad * 2), 0)
    d = ImageDraw.Draw(mask)
    d.text((pad - bbox[0], pad - bbox[1]), text, font=font, fill=255)
    g = grad_img.resize((w + pad * 2, h + pad * 2))
    out = Image.new("RGBA", mask.size, (0, 0, 0, 0))
    out.paste(g, (0, 0), mask)
    return out.crop((pad, pad, pad + w, pad + h))


def build_lockup(icon: Image.Image, out_path: str, W=2800, H=900, dark=False):
    bg = (11, 17, 32, 255) if dark else (255, 255, 255, 255)
    canvas = Image.new("RGBA", (W, H), bg)
    icon_size = int(H * 0.62)
    ic = with_glow(icon.resize((icon_size, icon_size), Image.LANCZOS)) if dark else icon.resize((icon_size, icon_size), Image.LANCZOS)
    ix, iy = int(W * 0.09), (H - icon_size) // 2
    canvas.alpha_composite(ic, (ix, iy))

    font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    f_size = int(H * 0.42)
    font = ImageFont.truetype(font_path, f_size)
    text_x = ix + icon_size + int(W * 0.045)
    word = "Roy"
    grad_full = Image.fromarray((gradient_np(W, H)).astype(np.uint8), "RGB")

    # "Roy" solid charcoal (or white on dark)
    roy_color = (255, 255, 255, 255) if dark else (*CHARCOAL, 255)
    bbox = font.getbbox("RoyCSS")
    ty = (H - (bbox[3] - bbox[1])) // 2 - bbox[1]
    d = ImageDraw.Draw(canvas)
    roy_w = d.textlength(word, font=font)
    d.text((text_x, ty), word, font=font, fill=roy_color)

    # "CSS" gradient-filled
    css_img = gradient_text("CSS", font, grad_full)
    canvas.alpha_composite(css_img, (int(text_x + roy_w), ty + bbox[1]))

    canvas.save(out_path)
    print("wrote", out_path)


def main():
    icon = render_icon(1024)

    # transparent icon variants
    icon.save(f"{OUT}/logo-icon.png")
    with_shadow(icon).save(f"{OUT}/logo-icon-shadow.png")

    # dark card variant
    dark = Image.new("RGBA", (1024, 1024), (11, 17, 32, 255))
    glow_ic = with_glow(icon.resize((760, 760), Image.LANCZOS))
    dark.alpha_composite(glow_ic, ((1024 - 760) // 2, (1024 - 760) // 2))
    dark.convert("RGB").save(f"{OUT}/logo-icon-dark-card.png")

    # small favicon
    icon.resize((64, 64), Image.LANCZOS).save(f"{OUT}/favicon-64.png")
    icon.resize((256, 256), Image.LANCZOS).save(f"{OUT}/logo-icon-256.png")

    # lockups
    build_lockup(icon, f"{OUT}/logo-lockup-light.png", dark=False)
    build_lockup(icon, f"{OUT}/logo-lockup-dark.png", dark=True)
    print("done")


if __name__ == "__main__":
    main()
