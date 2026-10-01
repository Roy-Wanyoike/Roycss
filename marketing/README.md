# RoyCSS Marketing Assets

Brand, imagery, and video produced 2026-10-01. Regeneration scripts included.

## Layout

```
marketing/
├── logo/                  # Brand marks (programmatic, vector-crisp)
│   ├── logo-icon.png              # Primary squircle icon, transparent, 1024px
│   ├── logo-icon-256.png          # Small usage
│   ├── favicon-64.png             # Favicon
│   ├── logo-icon-shadow.png       # Icon + soft drop shadow
│   ├── logo-icon-dark-card.png    # Icon on dark card (social avatar)
│   ├── logo-lockup-light.png      # Horizontal lockup, light bg (primary)
│   ├── logo-lockup-dark.png       # Horizontal lockup, dark bg
│   ├── logo-lockup-transparent.png# Lockup, transparent bg (video/print)
│   ├── logo-icon-a.png            # AI-generated concept (light)
│   ├── logo-icon-dark.png         # AI-generated concept (dark)
│   └── build_logo.py              # Regenerates all programmatic marks
├── images/                # Banners & social art (AI-generated, brand palette)
│   ├── banner-effects.png         # Hero wave banner (effects story)
│   ├── banner-ai.png              # AI-native story banner
│   ├── banner-speed.png           # Performance story banner
│   └── social-square.png          # 1024x1024 social post background
├── shots/                 # Real product screenshots (dev build, port 3001)
│   ├── hero.png                   # Homepage hero (clean, no tour popup)
│   ├── hero-full.png              # Full-page capture (large, reference only)
│   ├── effects-gallery.png        # /effects catalog
│   ├── effect-detail.png          # Effect detail + live preview
│   ├── docs.png                   # Documentation
│   └── homepage-scroll.png        # Homepage scrolled section
└── videos/
    ├── roycss-overview.mp4        # 51s narrated product overview (VO + captions)
    ├── roycss-logo-sting-10s.mp4  # 10s silent brand sting (social loops)
    ├── VO-SCRIPT.md               # Voiceover script + scene captions
    └── build_videos.py            # Full regeneration pipeline (TTS + ffmpeg)
```

## Brand palette

| Token | Hex | Use |
|---|---|---|
| Emerald | `#10B981` | Gradient start |
| Cyan | `#06B6D4` | Gradient mid |
| Violet | `#8B5CF6` | Gradient end |
| Navy | `#0B1120` | Dark backgrounds |
| Charcoal | `#0F172A` | Light-bg text |

## Regenerating

```bash
cd marketing/logo && python3 build_logo.py
cd ../videos && python3 build_videos.py   # needs: z-ai CLI (TTS), ffmpeg, product screenshots in ../shots
```

## Usage notes

- Videos: H.264/AAC, 1920x1080@30fps, `+faststart` (web-streamable).
- The overview voiceover is TTS (`jam`, British English) — swap `VO` lines in
  `build_videos.py` and re-run to re-record with different copy.
- `shots/` were captured from the dev server; retake from production after the
  go-live redeploy (#75) for fully polished captures.
