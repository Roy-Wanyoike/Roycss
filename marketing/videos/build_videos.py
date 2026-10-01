#!/usr/bin/env python3
"""RoyCSS marketing video builder.

Produces:
  videos/roycss-overview-30s.mp4   — narrated product overview (TTS voiceover)
  videos/roycss-logo-sting-10s.mp4 — silent brand sting for social loops
  videos/VO-SCRIPT.md              — voiceover script + scene captions
"""
import os, subprocess, json
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import numpy as np

ROOT = "/home/z/roycss/marketing"
VID = f"{ROOT}/videos"
TMP = f"{VID}/.build"
os.makedirs(TMP, exist_ok=True)

W, H = 2400, 1350            # scene canvas (Ken Burns headroom)
OUT_W, OUT_H = 1920, 1080
FPS = 30
XFADE = 0.6
FONT_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_R = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

NAVY = (11, 17, 32)

VO = [
    ("s1", "Meet RoyCSS. The AI-native frontend engineering platform."),
    ("s2", "Nearly two thousand production-ready CSS effects. Zero JavaScript runtime. Just add a class."),
    ("s3", "Preview every effect live, then copy it as CSS, Tailwind, Vue, and more."),
    ("s4", "Roy AI helps you architect, build, review, and learn. Right where you work."),
    ("s5", "RoyCSS. Build beautiful. Start free at roycss dot vercel dot app, or npm install roycss."),
]

CAPTIONS = [
    "AI-Native Frontend Engineering Platform",
    "1,983 production-ready effects · zero JS runtime",
    "Live previews — copy as CSS, Tailwind, Vue & more",
    "RoyAI — architect · pair · review · mentor",
    "roycss.vercel.app   ·   npm install roycss",
]


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"CMD FAILED: {' '.join(cmd[:8])}...\n{r.stderr[-1200:]}")
    return r


def gradient_np(w, h):
    xx, yy = np.meshgrid(np.linspace(0, 1, w), np.linspace(0, 1, h))
    t = (xx + yy) / 2
    pos = np.array([0.0, 0.5, 1.0])
    cols = np.array([(16, 185, 129), (6, 182, 212), (139, 92, 246)], dtype=float)
    img = np.zeros((h, w, 3), dtype=float)
    for ch in range(3):
        img[..., ch] = np.interp(t, pos, cols[:, ch])
    return img


def brand_bg():
    """Dark stage background: navy + blurred brand-glow."""
    base = Image.new("RGB", (W, H), NAVY)
    glow = Image.fromarray(gradient_np(W, H).astype(np.uint8))
    glow = glow.filter(ImageFilter.GaussianBlur(240))
    base = Image.blend(base, glow, 0.22)
    # vignette
    yy, xx = np.mgrid[0:H, 0:W]
    d = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
    vig = np.clip(1.15 - d * 0.55, 0, 1)
    arr = (np.asarray(base).astype(float) * vig[..., None]).astype(np.uint8)
    return Image.fromarray(arr)


def rounded(im, rad):
    m = Image.new("L", im.size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, im.size[0] - 1, im.size[1] - 1], radius=rad, fill=255)
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    out.paste(im, (0, 0), m)
    return out


def drop_shadow(layer, blur=40, dy=26, alpha=130):
    pad = blur * 2
    canvas = Image.new("RGBA", (layer.size[0] + pad * 2, layer.size[1] + pad * 2), (0, 0, 0, 0))
    a = layer.split()[3]
    sh = Image.new("RGBA", layer.size, (0, 0, 0, alpha))
    sh.putalpha(a.point(lambda v: v * alpha // 255))
    canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur)), (pad, pad + dy))
    canvas.alpha_composite(layer, (pad, pad))
    return canvas


def text_layer(s, size, fill=(255, 255, 255, 255), font_path=FONT_B):
    f = ImageFont.truetype(font_path, size)
    b = f.getbbox(s)
    im = Image.new("RGBA", (b[2] - b[0] + 8, b[3] - b[1] + 8), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((4 - b[0], 4 - b[1]), s, font=f, fill=fill)
    return im


def gradient_bar(w, h):
    g = Image.fromarray(gradient_np(w, h).astype(np.uint8)).convert("RGBA")
    return rounded(g, h // 2)


def stage(scene_img_path, caption, zoom_shot=1.0):
    """Product screenshot on branded stage + caption."""
    bg = brand_bg().convert("RGBA")
    shot = Image.open(scene_img_path).convert("RGB")
    target_w = 1560
    ratio = shot.size[1] / shot.size[0]
    shot = shot.resize((target_w, int(target_w * ratio)), Image.LANCZOS)
    shot = rounded(shot, 28)
    framed = drop_shadow(shot, blur=46, dy=30, alpha=150)
    fw, fh = framed.size
    top = (H - fh - 150) // 2 - 20
    bg.alpha_composite(framed, ((W - fw) // 2, max(40, top)))

    cap = text_layer(caption, 56)
    cw, ch = cap.size
    # caption backdrop pill
    pill = Image.new("RGBA", (cw + 90, ch + 44), (0, 0, 0, 0))
    ImageDraw.Draw(pill).rounded_rectangle([0, 0, pill.size[0] - 1, pill.size[1] - 1], radius=(ch + 44) // 2, fill=(255, 255, 255, 26))
    px, py = (W - pill.size[0]) // 2, H - ch - 108
    bg.alpha_composite(pill, (px, py))
    bg.alpha_composite(cap, ((W - cw) // 2, py + 22))
    return bg


def scene_logo():
    bg = brand_bg().convert("RGBA")
    logo = Image.open(f"{ROOT}/logo/logo-icon-shadow.png").convert("RGBA")
    lw = 620
    logo = logo.resize((lw, int(logo.size[1] * lw / logo.size[0])), Image.LANCZOS)
    bg.alpha_composite(logo, ((W - logo.size[0]) // 2, 150))
    tag = text_layer(CAPTIONS[0], 64)
    tw, th = tag.size
    # tagline with subtle glow
    glow = tag.filter(ImageFilter.GaussianBlur(12))
    bg.alpha_composite(glow, ((W - tw) // 2, 880), )
    bg.alpha_composite(glow, ((W - tw) // 2, 880))
    bg.alpha_composite(tag, ((W - tw) // 2, 880))
    bar = gradient_bar(360, 10)
    bg.alpha_composite(bar, ((W - 360) // 2, 1010))
    return bg


def scene_cta():
    bg = brand_bg().convert("RGBA")
    lock = Image.open(f"{ROOT}/logo/logo-lockup-dark.png").convert("RGBA")
    lw = 1150
    lock = lock.resize((lw, int(lock.size[1] * lw / lock.size[0])), Image.LANCZOS)
    glow = lock.filter(ImageFilter.GaussianBlur(18))
    bg.alpha_composite(glow, ((W - lw) // 2, 300))
    bg.alpha_composite(lock, ((W - lw) // 2, 300))
    cta = text_layer(CAPTIONS[4], 54, fill=(226, 232, 240, 255))
    cw, ch = cta.size
    bg.alpha_composite(cta, ((W - cw) // 2, 980))
    bar = gradient_bar(520, 12)
    bg.alpha_composite(bar, ((W - 520) // 2, 1120))
    return bg


def scene_banner(path, caption):
    bg = brand_bg().convert("RGBA")
    art = Image.open(path).convert("RGB").resize((W, int(W * 768 / 1344)), Image.LANCZOS)
    ah = art.size[1]
    art = rounded(art, 30)
    framed = drop_shadow(art, blur=46, dy=30, alpha=150)
    bg.alpha_composite(framed, (0, (H - ah) // 2 - 10))
    cap = text_layer(caption, 56)
    cw, ch = cap.size
    pill = Image.new("RGBA", (cw + 90, ch + 44), (0, 0, 0, 0))
    ImageDraw.Draw(pill).rounded_rectangle([0, 0, pill.size[0] - 1, pill.size[1] - 1], radius=(ch + 44) // 2, fill=(255, 255, 255, 26))
    py = H - ch - 108
    bg.alpha_composite(pill, ((W - pill.size[0]) // 2, py))
    bg.alpha_composite(cap, ((W - cw) // 2, py + 22))
    return bg


def probe_duration(path):
    r = run(["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", path])
    return float(json.loads(r.stdout)["format"]["duration"])


def tts_all():
    durs = {}
    for key, text in VO:
        out = f"{TMP}/{key}.wav"
        if not os.path.exists(out):
            run(["z-ai", "tts", "-i", text, "-o", out, "--voice", "jam", "--format", "wav"])
        durs[key] = probe_duration(out)
    return durs


def render_scene(still_path, dur, out):
    frames = int(round(dur * FPS))
    vf = (
        f"scale={W}:{H},zoompan=z='min(1.0+0.00055*on,1.10)':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2'"
        f":d={frames}:s={OUT_W}x{OUT_H}:fps={FPS},format=yuv420p"
    )
    run(["ffmpeg", "-y", "-loop", "1", "-i", still_path, "-vf", vf, "-t", f"{dur:.3f}",
         "-c:v", "libx264", "-preset", "medium", "-crf", "19", out])


def main():
    # 1. voiceover
    vo_dur = tts_all()
    print("VO durations:", {k: round(v, 2) for k, v in vo_dur.items()})

    # 2. scene stills
    stills = [
        f"{TMP}/sc1.png", f"{TMP}/sc2.png", f"{TMP}/sc3.png", f"{TMP}/sc4.png", f"{TMP}/sc5.png",
    ]
    scene_logo().convert("RGB").save(stills[0])
    stage(f"{ROOT}/shots/hero.png", CAPTIONS[1]).convert("RGB").save(stills[1])
    stage(f"{ROOT}/shots/effect-detail.png", CAPTIONS[2]).convert("RGB").save(stills[2])
    scene_banner(f"{ROOT}/images/banner-ai.png", CAPTIONS[3]).convert("RGB").save(stills[3])
    scene_cta().convert("RGB").save(stills[4])

    # 3. durations
    durs = [max(3.6, vo_dur[k] + 1.5) for k, _ in VO]
    print("scene durations:", [round(d, 2) for d in durs])

    # 4. render scenes
    scene_files = []
    for i, (sp, d) in enumerate(zip(stills, durs)):
        out = f"{TMP}/scene{i}.mp4"
        render_scene(sp, d, out)
        scene_files.append(out)

    # 5. xfade concat
    n = len(scene_files)
    inputs = []
    for f in scene_files:
        inputs += ["-i", f]
    offsets = []
    acc = 0.0
    for i in range(1, n):
        acc += durs[i - 1] - XFADE
        offsets.append(acc)
    fc = []
    prev = "[0:v]"
    for i in range(1, n):
        outl = f"[v{i}]" if i < n - 1 else "[vout]"
        fc.append(f"{prev}[{i}:v]xfade=transition=fade:duration={XFADE}:offset={offsets[i-1]:.3f}{outl}")
        prev = f"[v{i}]"
    total = sum(durs) - XFADE * (n - 1)
    run(["ffmpeg", "-y", *inputs, "-filter_complex", ";".join(fc), "-map", "[vout]",
         "-c:v", "libx264", "-preset", "medium", "-crf", "19", f"{TMP}/concat.mp4"])
    print("concat done, total", round(total, 2))

    # 6. audio: VOs at scene starts + soft ambient bed
    starts = [0.0]
    for i in range(1, n):
        starts.append(starts[-1] + durs[i - 1] - XFADE)
    a_inputs = ["-i", f"{TMP}/concat.mp4"]
    fc = []
    mix = "[0:a]anull[a0]"
    labels = ["[a0]"]
    for i, (k, _) in enumerate(VO):
        a_inputs += ["-i", f"{TMP}/{k}.wav"]
        delay = int((starts[i] + 0.75) * 1000)
        fc.append(f"[{i+1}:a]adelay={delay}:all=1,apad[vo{i}]")
        labels.append(f"[vo{i}]")
    T = total
    bed = (
        "aevalsrc='0.045*sin(2*PI*110*t)*(0.6+0.4*sin(2*PI*0.07*t))"
        "+0.035*sin(2*PI*165*t)*(0.6+0.4*sin(2*PI*0.05*t+1.3))"
        "+0.03*sin(2*PI*220*t)*(0.6+0.4*sin(2*PI*0.09*t+0.4))':s=44100:d=%.3f,lowpass=f=900[bed]" % T
    )
    fc.append(bed)
    labels.append("[bed]")
    fc.append(f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0:duration=longest,"
              f"atrim=0:{T:.3f},afade=t=in:st=0:d=0.8,afade=t=out:st={T-1.4:.3f}:d=1.4[aout]")
    run(["ffmpeg", "-y", *a_inputs, "-filter_complex", ";".join(fc), "-map", "0:v", "-map", "[aout]",
         "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
         f"{VID}/roycss-overview-30s.mp4"])
    print("OVERVIEW DONE:", f"{VID}/roycss-overview-30s.mp4", round(probe_duration(f'{VID}/roycss-overview-30s.mp4'), 2), "s")

    # 7. logo sting (silent, 10s, zoom-out + fades)
    sting_still = f"{TMP}/sting.png"
    sting = brand_bg().convert("RGBA")
    logo = Image.open(f"{ROOT}/logo/logo-icon-shadow.png").convert("RGBA")
    lw = 700
    logo = logo.resize((lw, int(logo.size[1] * lw / logo.size[0])), Image.LANCZOS)
    sting.alpha_composite(logo, ((W - logo.size[0]) // 2, (H - logo.size[1]) // 2 - 60))
    tag = text_layer("RoyCSS", 88)
    tw, _ = tag.size
    sting.alpha_composite(tag, ((W - tw) // 2, 1010))
    tag2 = text_layer("Build beautiful.", 46, fill=(148, 163, 184, 255), font_path=FONT_R)
    tw2, _ = tag2.size
    sting.alpha_composite(tag2, ((W - tw2) // 2, 1150))
    sting.convert("RGB").save(sting_still)
    frames = 10 * FPS
    vf = (f"scale={W}:{H},zoompan=z='max(1.18-0.00062*on,1.0)':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2'"
          f":d={frames}:s={OUT_W}x{OUT_H}:fps={FPS},fade=t=in:st=0:d=0.9,fade=t=out:st=9.0:d=1.0,format=yuv420p")
    run(["ffmpeg", "-y", "-loop", "1", "-i", sting_still, "-vf", vf, "-t", "10",
         "-c:v", "libx264", "-preset", "medium", "-crf", "19", f"{VID}/roycss-logo-sting-10s.mp4"])
    print("STING DONE")

    # 8. VO script doc
    with open(f"{VID}/VO-SCRIPT.md", "w") as f:
        f.write("# RoyCSS Marketing — Voiceover Script & Scene Captions\n\n")
        f.write("Voice: `jam` (British English) · Overview runtime: ~%.0fs\n\n" % total)
        for i, (k, text) in enumerate(VO):
            f.write(f"## Scene {i+1} — {durs[i]:.1f}s (VO starts at {starts[i]+0.75:.1f}s)\n")
            f.write(f"- **Caption:** {CAPTIONS[i]}\n- **Voiceover:** \"{text}\"\n\n")
    print("ALL DONE")


if __name__ == "__main__":
    main()
