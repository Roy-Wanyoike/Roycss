import type { CSSEffect } from "./roycss-types";

/**
 * RoyCSS Effects Batch 23 — FerrumCSS Imports (50 effects)
 * Imported from FerrumCSS Effects Library with prefix conversion (rc- → roycss-ferrum-)
 * and OKLCH color conversion. Keyframes prefixed roy-ferrum- to avoid collisions.
 */
export const effectsBatch23: CSSEffect[] = [
  // ═══════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-blur-in",
  name: "Blur In",
  category: "animations",
  description: "An animated motion effect (blur in)",
  tags: ["blur", "filter", "blur-in", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-blur-in {
  animation: roy-ferrum-blur-in 0.8s ease-out both;
}

@keyframes roy-ferrum-blur-in {

  0% { filter: blur(12px); }
  100% { filter: blur(0px); }

}`,
},

{
  id: "ferrum-blur-out",
  name: "Blur Out",
  category: "animations",
  description: "An animated motion effect (blur out)",
  tags: ["blur", "filter", "blur-out", "out", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-blur-out {
  animation: roy-ferrum-blur-out 0.8s ease-in both;
}

@keyframes roy-ferrum-blur-out {

  0% { filter: blur(0px); }
  100% { filter: blur(14px); }

}`,
},

  // ═══════════════════════════════════════════════════════════════
  // FORMS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-skeleton-pulse",
  name: "Pulse",
  category: "forms",
  description: "A skeleton loading placeholder with shimmer or pulse motion",
  tags: ["skeleton", "loading", "skeleton-pulse", "pulse", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-skeleton-pulse {
    background-color: oklch(0.907 0.0 89.88);
    animation: roy-ferrum-skeleton-pulse 1.5s ease-in-out infinite;
    border-radius: 4px;
}

@keyframes roy-ferrum-skeleton-pulse {

    0%, 100% { opacity: 1; }
    50%      { opacity: 0.4; }

}`,
},

{
  id: "ferrum-skeleton-shimmer",
  name: "Shimmer",
  category: "forms",
  description: "A skeleton loading placeholder with shimmer or pulse motion",
  tags: ["skeleton", "loading", "skeleton-shimmer", "shimmer", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-skeleton-shimmer {
    background-color: oklch(0.907 0.0 89.88);
    background-image: linear-gradient(
        90deg,
        oklch(0.907 0.0 89.88) 0%,
        oklch(0.955 0.0 89.88) 20%,
        oklch(0.979 0.0 89.88) 50%,
        oklch(0.955 0.0 89.88) 80%,
        oklch(0.907 0.0 89.88) 100%
    );
    background-size: 200% 100%;
    animation: roy-ferrum-skeleton-shimmer 1.8s ease-in-out infinite;
    border-radius: 4px;
}

@keyframes roy-ferrum-skeleton-shimmer {

    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }

}`,
},

{
  id: "ferrum-skeleton-wave",
  name: "Wave",
  category: "forms",
  description: "A skeleton loading placeholder with shimmer or pulse motion",
  tags: ["skeleton", "loading", "skeleton-wave", "wave", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-skeleton-wave {
    background-color: oklch(0.907 0.0 89.88);
    position: relative;
    overflow: hidden;
    border-radius: 4px;
}
.roycss-ferrum-skeleton-wave::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
        90deg,
        transparent 0%,
        color-mix(in oklch, oklch(1 0 0) 30%, transparent) 25%,
        color-mix(in oklch, oklch(1 0 0) 60%, transparent) 50%,
        color-mix(in oklch, oklch(1 0 0) 30%, transparent) 75%,
        transparent 100%
    );
    animation: roy-ferrum-skeleton-wave 2s ease-in-out infinite;
}

@keyframes roy-ferrum-skeleton-wave {

    0%   { left: -100%; }
    100% { left: 100%; }

}`,
},

{
  id: "ferrum-skeleton-text",
  name: "Text",
  category: "forms",
  description: "A skeleton loading placeholder with shimmer or pulse motion",
  tags: ["skeleton", "loading", "skeleton-text", "text", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-skeleton-text {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.roycss-ferrum-skeleton-text::before,
.roycss-ferrum-skeleton-text::after {
    content: '';
    display: block;
    background-color: oklch(0.907 0.0 89.88);
    border-radius: 4px;
    height: 14px;
    background-image: linear-gradient(
        90deg,
        oklch(0.907 0.0 89.88) 0%,
        oklch(0.97 0.0 89.88) 50%,
        oklch(0.907 0.0 89.88) 100%
    );
    background-size: 200% 100%;
    animation: roy-ferrum-skeleton-text 1.6s ease-in-out infinite;
}
.roycss-ferrum-skeleton-text::before { width: 100%; }
.roycss-ferrum-skeleton-text::after  { width: 65%; animation-delay: 0.15s; }
.roycss-ferrum-skeleton-text > * {
    background-color: oklch(0.907 0.0 89.88);
    border-radius: 4px;
    height: 14px;
    background-image: linear-gradient(
        90deg,
        oklch(0.907 0.0 89.88) 0%,
        oklch(0.97 0.0 89.88) 50%,
        oklch(0.907 0.0 89.88) 100%
    );
    background-size: 200% 100%;
    animation: roy-ferrum-skeleton-text 1.6s ease-in-out infinite;
}

@keyframes roy-ferrum-skeleton-text {

    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }

}`,
},

{
  id: "ferrum-skeleton-card",
  name: "Card",
  category: "forms",
  description: "A skeleton loading placeholder with shimmer or pulse motion",
  tags: ["skeleton", "loading", "skeleton-card", "card"],
  previewType: "box",
  cssCode: `.roycss-ferrum-skeleton-card {
    background-color: oklch(0.97 0.0 89.88);
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    border: 1px solid oklch(0.931 0.0 89.88);`,
},

{
  id: "ferrum-skeleton-card-header",
  name: "Card Header",
  category: "forms",
  description: "A skeleton loading placeholder with shimmer or pulse motion",
  tags: ["skeleton", "loading", "skeleton-card-header", "card"],
  previewType: "box",
  cssCode: `.roycss-ferrum-skeleton-card-header {
    display: flex;
    align-items: center;
    gap: 12px;`,
},

{
  id: "ferrum-skeleton-card-avatar",
  name: "Card Avatar",
  category: "forms",
  description: "A skeleton loading placeholder with shimmer or pulse motion",
  tags: ["skeleton", "loading", "skeleton-card-avatar", "card", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-skeleton-card-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background-color: oklch(0.907 0.0 89.88);
    background-image: linear-gradient(
        90deg, oklch(0.907 0.0 89.88) 0%, oklch(0.97 0.0 89.88) 50%, oklch(0.907 0.0 89.88) 100%
    );
    background-size: 200% 100%;
    animation: roy-ferrum-skeleton-card 1.6s ease-in-out infinite;
    flex-shrink: 0;

@keyframes roy-ferrum-skeleton-card {

    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }

}`,
},

{
  id: "ferrum-skeleton-card-lines",
  name: "Card Lines",
  category: "forms",
  description: "A skeleton loading placeholder with shimmer or pulse motion",
  tags: ["skeleton", "loading", "skeleton-card-lines", "card"],
  previewType: "box",
  cssCode: `.roycss-ferrum-skeleton-card-lines {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;`,
},

{
  id: "ferrum-skeleton-card-line",
  name: "Card Line",
  category: "forms",
  description: "A skeleton loading placeholder with shimmer or pulse motion",
  tags: ["skeleton", "loading", "skeleton-card-line", "card", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-skeleton-card-line {
    height: 12px;
    border-radius: 4px;
    background-color: oklch(0.907 0.0 89.88);
    background-image: linear-gradient(
        90deg, oklch(0.907 0.0 89.88) 0%, oklch(0.97 0.0 89.88) 50%, oklch(0.907 0.0 89.88) 100%
    );
    background-size: 200% 100%;
    animation: roy-ferrum-skeleton-card 1.6s ease-in-out infinite;

@keyframes roy-ferrum-skeleton-card {

    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }

}`,
},

{
  id: "ferrum-skeleton-card-body",
  name: "Card Body",
  category: "forms",
  description: "A skeleton loading placeholder with shimmer or pulse motion",
  tags: ["skeleton", "loading", "skeleton-card-body", "card", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-skeleton-card-body {
    height: 80px;
    border-radius: 4px;
    background-color: oklch(0.907 0.0 89.88);
    background-image: linear-gradient(
        90deg, oklch(0.907 0.0 89.88) 0%, oklch(0.97 0.0 89.88) 50%, oklch(0.907 0.0 89.88) 100%
    );
    background-size: 200% 100%;
    animation: roy-ferrum-skeleton-card 1.6s ease-in-out infinite;
    animation-delay: 0.1s;
}

@keyframes roy-ferrum-skeleton-card {

    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }

}`,
},

{
  id: "ferrum-skeleton-circle",
  name: "Circle",
  category: "forms",
  description: "A skeleton loading placeholder with shimmer or pulse motion",
  tags: ["skeleton", "loading", "skeleton-circle", "circle", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-skeleton-circle {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background-color: oklch(0.907 0.0 89.88);
    position: relative;
    overflow: hidden;
}
.roycss-ferrum-skeleton-circle::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
        90deg,
        transparent 0%,
        color-mix(in oklch, oklch(1 0 0) 40%, transparent) 50%,
        transparent 100%
    );
    animation: roy-ferrum-skeleton-circle 1.5s ease-in-out infinite;
}

@keyframes roy-ferrum-skeleton-circle {

    0%   { left: -100%; }
    100% { left: 100%; }

}`,
},

{
  id: "ferrum-skeleton-grid",
  name: "Grid",
  category: "forms",
  description: "A skeleton loading placeholder with shimmer or pulse motion",
  tags: ["skeleton", "loading", "skeleton-grid", "grid"],
  previewType: "box",
  cssCode: `.roycss-ferrum-skeleton-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;`,
},

{
  id: "ferrum-skeleton-grid-item",
  name: "Grid Item",
  category: "forms",
  description: "A skeleton loading placeholder with shimmer or pulse motion",
  tags: ["skeleton", "loading", "skeleton-grid-item", "grid"],
  previewType: "box",
  cssCode: `.roycss-ferrum-skeleton-grid-item {
    display: flex;
    flex-direction: column;
    gap: 10px;`,
},

{
  id: "ferrum-skeleton-grid-img",
  name: "Grid Img",
  category: "forms",
  description: "A skeleton loading placeholder with shimmer or pulse motion",
  tags: ["skeleton", "loading", "skeleton-grid-img", "grid", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-skeleton-grid-img {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 6px;
    background-color: oklch(0.907 0.0 89.88);
    background-image: linear-gradient(
        90deg, oklch(0.907 0.0 89.88) 0%, oklch(0.955 0.0 89.88) 40%, oklch(0.979 0.0 89.88) 50%, oklch(0.955 0.0 89.88) 60%, oklch(0.907 0.0 89.88) 100%
    );
    background-size: 200% 100%;
    animation: roy-ferrum-skeleton-grid 1.8s ease-in-out infinite;

@keyframes roy-ferrum-skeleton-grid {

    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }

}`,
},

{
  id: "ferrum-skeleton-grid-line",
  name: "Grid Line",
  category: "forms",
  description: "A skeleton loading placeholder with shimmer or pulse motion",
  tags: ["skeleton", "loading", "skeleton-grid-line", "grid", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-skeleton-grid-line {
    height: 12px;
    border-radius: 4px;
    background-color: oklch(0.907 0.0 89.88);
    background-image: linear-gradient(
        90deg, oklch(0.907 0.0 89.88) 0%, oklch(0.955 0.0 89.88) 40%, oklch(0.979 0.0 89.88) 50%, oklch(0.955 0.0 89.88) 60%, oklch(0.907 0.0 89.88) 100%
    );
    background-size: 200% 100%;
    animation: roy-ferrum-skeleton-grid 1.8s ease-in-out infinite;
}
.roycss-ferrum-skeleton-grid-item:nth-child(2) .roycss-ferrum-skeleton-grid-img,
.roycss-ferrum-skeleton-grid-item:nth-child(2) .roycss-ferrum-skeleton-grid-line { animation-delay: 0.15s; }
.roycss-ferrum-skeleton-grid-item:nth-child(3) .roycss-ferrum-skeleton-grid-img,
.roycss-ferrum-skeleton-grid-item:nth-child(3) .roycss-ferrum-skeleton-grid-line { animation-delay: 0.3s; }
.roycss-ferrum-skeleton-grid-item:nth-child(4) .roycss-ferrum-skeleton-grid-img,
.roycss-ferrum-skeleton-grid-item:nth-child(4) .roycss-ferrum-skeleton-grid-line { animation-delay: 0.1s; }
.roycss-ferrum-skeleton-grid-item:nth-child(5) .roycss-ferrum-skeleton-grid-img,
.roycss-ferrum-skeleton-grid-item:nth-child(5) .roycss-ferrum-skeleton-grid-line { animation-delay: 0.25s; }
.roycss-ferrum-skeleton-grid-item:nth-child(6) .roycss-ferrum-skeleton-grid-img,
.roycss-ferrum-skeleton-grid-item:nth-child(6) .roycss-ferrum-skeleton-grid-line { animation-delay: 0.4s; }

@keyframes roy-ferrum-skeleton-grid {

    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }

}`,
},

{
  id: "ferrum-skeleton-gradient",
  name: "Gradient",
  category: "forms",
  description: "A skeleton loading placeholder with shimmer or pulse motion",
  tags: ["skeleton", "loading", "skeleton-gradient", "gradient", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-skeleton-gradient {
    background: linear-gradient(135deg, oklch(0.858 0.0 89.88) 0%, oklch(0.931 0.0 89.88) 50%, oklch(0.858 0.0 89.88) 100%);
    background-size: 200% 200%;
    animation: roy-ferrum-skeleton-gradient 2s ease-in-out infinite;
    border-radius: 4px;
}

@keyframes roy-ferrum-skeleton-gradient {

    0%, 100% { background-position: 0% 50%; }
    50%      { background-position: 100% 50%; }

}`,
},

{
  id: "ferrum-skeleton-blink",
  name: "Blink",
  category: "forms",
  description: "A skeleton loading placeholder with shimmer or pulse motion",
  tags: ["skeleton", "loading", "skeleton-blink", "blink", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-skeleton-blink {
    background-color: oklch(0.907 0.0 89.88);
    animation: roy-ferrum-skeleton-blink 1s step-end infinite;
    border-radius: 4px;
}

@keyframes roy-ferrum-skeleton-blink {

    0%, 100% { opacity: 1; }
    50%      { opacity: 0.2; }

}`,
},

{
  id: "ferrum-skeleton-fade",
  name: "Fade",
  category: "forms",
  description: "A skeleton loading placeholder with shimmer or pulse motion",
  tags: ["skeleton", "loading", "skeleton-fade", "fade", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-skeleton-fade {
    background-color: oklch(0.907 0.0 89.88);
    animation: roy-ferrum-skeleton-fade 2s ease-in-out infinite;
    border-radius: 4px;
}

@keyframes roy-ferrum-skeleton-fade {

    0%, 100% { opacity: 1; background-color: oklch(0.907 0.0 89.88); }
    50%      { opacity: 0.3; background-color: oklch(0.858 0.0 89.88); }

}`,
},

{
  id: "ferrum-toggle-switch",
  name: "Switch",
  category: "forms",
  description: "A microinteraction that animates a small UI element (switch)",
  tags: ["toggle", "interactive", "toggle-switch", "switch"],
  previewType: "box",
  cssCode: `.roycss-ferrum-toggle-switch {
    position: relative;
    width: 52px;
    height: 28px;
    appearance: none;
    -webkit-appearance: none;
    background-color: oklch(0.845 0.0 89.88);
    border-radius: 28px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    outline: none;
    border: none;
}
.roycss-ferrum-toggle-switch::before {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 22px;
    height: 22px;
    background-color: oklch(1 0 0);
    border-radius: 50%;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                box-shadow 0.3s ease;
    box-shadow: 0 1px 3px color-mix(in oklch, oklch(0 0 0) 20%, transparent);
}
.roycss-ferrum-toggle-switch:checked {
    background-color: oklch(0.673 0.162 144.21);
}
.roycss-ferrum-toggle-switch:checked::before {
    transform: translateX(24px);
    box-shadow: 0 1px 5px color-mix(in oklch, oklch(0 0 0) 25%, transparent);
}
.roycss-ferrum-toggle-switch:focus-visible {
    box-shadow: 0 0 0 3px color-mix(in oklch, oklch(0.673 0.162 144.21) 30%, transparent);
}`,
},

{
  id: "ferrum-checkbox-anim",
  name: "Anim",
  category: "forms",
  description: "A microinteraction that animates a small UI element (anim)",
  tags: ["checkbox-anim", "anim", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-checkbox-anim {
    position: relative;
    width: 22px;
    height: 22px;
    appearance: none;
    -webkit-appearance: none;
    background-color: oklch(1 0 0);
    border: 2px solid oklch(0.792 0.0 89.88);
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease;
    outline: none;
}
.roycss-ferrum-checkbox-anim:checked {
    background-color: oklch(0.658 0.169 248.81);
    border-color: oklch(0.658 0.169 248.81);
    animation: roy-ferrum-checkbox-pop 0.3s ease;
}
.roycss-ferrum-checkbox-anim::before {
    content: '';
    position: absolute;
    top: 3px;
    left: 6px;
    width: 6px;
    height: 10px;
    border: solid oklch(1 0 0);
    border-width: 0 2px 2px 0;
    transform: rotate(45deg) scale(0);
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0.1s;
}
.roycss-ferrum-checkbox-anim:checked::before {
    transform: rotate(45deg) scale(1);
}
.roycss-ferrum-checkbox-anim:focus-visible {
    box-shadow: 0 0 0 3px color-mix(in oklch, oklch(0.658 0.169 248.81) 30%, transparent);
}

@keyframes roy-ferrum-checkbox-pop {

    0%   { transform: scale(1); }
    50%  { transform: scale(1.15); }
    100% { transform: scale(1); }

}`,
},

{
  id: "ferrum-radio-pulse",
  name: "Pulse",
  category: "forms",
  description: "A microinteraction that animates a small UI element (pulse)",
  tags: ["radio-pulse", "pulse", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-radio-pulse {
    position: relative;
    width: 22px;
    height: 22px;
    appearance: none;
    -webkit-appearance: none;
    background-color: oklch(1 0 0);
    border: 2px solid oklch(0.792 0.0 89.88);
    border-radius: 50%;
    cursor: pointer;
    transition: border-color 0.2s ease;
    outline: none;
}
.roycss-ferrum-radio-pulse::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 10px;
    height: 10px;
    background-color: oklch(0.658 0.169 248.81);
    border-radius: 50%;
    transform: translate(-50%, -50%) scale(0);
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.roycss-ferrum-radio-pulse:checked {
    border-color: oklch(0.658 0.169 248.81);
    animation: roy-ferrum-radio-pulse-ring 0.4s ease;
}
.roycss-ferrum-radio-pulse:checked::after {
    transform: translate(-50%, -50%) scale(1);
}
.roycss-ferrum-radio-pulse:focus-visible {
    box-shadow: 0 0 0 3px color-mix(in oklch, oklch(0.658 0.169 248.81) 30%, transparent);
}

@keyframes roy-ferrum-radio-pulse-ring {

    0%   { box-shadow: 0 0 0 0 color-mix(in oklch, oklch(0.658 0.169 248.81) 40%, transparent); }
    70%  { box-shadow: 0 0 0 8px color-mix(in oklch, oklch(0.658 0.169 248.81) 0%, transparent); }
    100% { box-shadow: 0 0 0 0 color-mix(in oklch, oklch(0.658 0.169 248.81) 0%, transparent); }

}`,
},

{
  id: "ferrum-input-focus-glow",
  name: "Focus Glow",
  category: "forms",
  description: "A form input effect with focus or validation feedback",
  tags: ["input", "form", "input-focus-glow", "focus"],
  previewType: "box",
  cssCode: `.roycss-ferrum-input-focus-glow {
    padding: 10px 14px;
    border: 2px solid oklch(0.898 0.0 89.88);
    border-radius: 8px;
    font-size: 14px;
    outline: none;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
    background-color: oklch(1 0 0);
}
.roycss-ferrum-input-focus-glow:focus {
    border-color: oklch(0.579 0.247 288.24);
    box-shadow: 0 0 0 3px color-mix(in oklch, oklch(0.579 0.247 288.24) 20%, transparent),
                0 0 12px color-mix(in oklch, oklch(0.579 0.247 288.24) 15%, transparent);
}
.roycss-ferrum-input-focus-glow::placeholder {
    color: oklch(0.738 0.0 89.88);
    transition: color 0.3s ease;
}
.roycss-ferrum-input-focus-glow:focus::placeholder {
    color: oklch(0.845 0.0 89.88);
}`,
},

{
  id: "ferrum-input-float-label-wrapper",
  name: "Float Label Wrapper",
  category: "forms",
  description: "A form input effect with focus or validation feedback",
  tags: ["input", "form", "input-float-label-wrapper", "float"],
  previewType: "box",
  cssCode: `.roycss-ferrum-input-float-label-wrapper {
    position: relative;`,
},

{
  id: "ferrum-input-float-label",
  name: "Float Label",
  category: "forms",
  description: "A form input effect with focus or validation feedback",
  tags: ["input", "form", "input-float-label", "float"],
  previewType: "box",
  cssCode: `.roycss-ferrum-input-float-label {
    padding: 18px 14px 6px 14px;
    border: 2px solid oklch(0.898 0.0 89.88);
    border-radius: 8px;
    font-size: 14px;
    outline: none;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
    background-color: transparent;
    width: 100%;
    box-sizing: border-box;
}
.roycss-ferrum-input-float-label::placeholder {
    color: transparent;`,
},

{
  id: "ferrum-input-float-label-label",
  name: "Float Label Label",
  category: "forms",
  description: "A form input effect with focus or validation feedback",
  tags: ["input", "form", "input-float-label-label", "float"],
  previewType: "box",
  cssCode: `.roycss-ferrum-input-float-label-label {
    position: absolute;
    top: 50%;
    left: 14px;
    transform: translateY(-50%);
    font-size: 14px;
    color: oklch(0.683 0.0 89.88);
    pointer-events: none;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    background-color: oklch(1 0 0);
    padding: 0 4px;
}
.roycss-ferrum-input-float-label:focus ~ .roycss-ferrum-input-float-label-label,
.roycss-ferrum-input-float-label:not(:placeholder-shown) ~ .roycss-ferrum-input-float-label-label {
    top: 0;
    font-size: 11px;
    color: oklch(0.579 0.247 288.24);
    transform: translateY(-50%);
}
.roycss-ferrum-input-float-label:focus {
    border-color: oklch(0.579 0.247 288.24);
    box-shadow: 0 0 0 3px color-mix(in oklch, oklch(0.579 0.247 288.24) 15%, transparent);
}`,
},

  // ═══════════════════════════════════════════════════════════════
  // MICROINTERACTIONS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-tooltip-fade-wrapper",
  name: "Fade Wrapper",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (fade wrapper)",
  tags: ["tooltip", "microinteraction", "tooltip-fade-wrapper", "fade"],
  previewType: "box",
  cssCode: `.roycss-ferrum-tooltip-fade-wrapper {
    position: relative;
    display: inline-block;`,
},

{
  id: "ferrum-tooltip-fade",
  name: "Fade",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (fade)",
  tags: ["tooltip", "microinteraction", "tooltip-fade", "fade", "interactive"],
  previewType: "box",
  cssCode: `.roycss-ferrum-tooltip-fade {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%) translateY(4px);
    background-color: oklch(0.321 0.0 89.88);
    color: oklch(1 0 0);
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 13px;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.25s ease, transform 0.25s ease, visibility 0.25s;
    pointer-events: none;
    z-index: 10;
}
.roycss-ferrum-tooltip-fade::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: oklch(0.321 0.0 89.88);
}
.roycss-ferrum-tooltip-fade-wrapper:hover .roycss-ferrum-tooltip-fade {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(0);
}`,
},

{
  id: "ferrum-notification-slide-in",
  name: "Slide In",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (slide in)",
  tags: ["notification", "toast", "notification-slide-in", "slide", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-notification-slide-in {
    position: relative;
    padding: 14px 20px;
    background-color: oklch(1 0 0);
    border-radius: 8px;
    box-shadow: 0 4px 16px color-mix(in oklch, oklch(0 0 0) 12%, transparent);
    border-left: 4px solid oklch(0.673 0.162 144.21);
    animation: roy-ferrum-notification-slide-in 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    max-width: 360px;
}
.roycss-ferrum-notification-slide-in.roycss-ferrum-exit {
    animation: roy-ferrum-notification-slide-out 0.4s cubic-bezier(0.55, 0.06, 0.68, 0.19) forwards;
}

@keyframes roy-ferrum-notification-slide-in {

    0% {
        opacity: 0;
        transform: translateX(100%);
    }
    100% {
        opacity: 1;
        transform: translateX(0);
    }

}

@keyframes roy-ferrum-notification-slide-out {

    0% {
        opacity: 1;
        transform: translateX(0);
    }
    100% {
        opacity: 0;
        transform: translateX(100%);
    }

}`,
},

{
  id: "ferrum-progress-bar-fill-track",
  name: "Bar Fill Track",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (bar fill track)",
  tags: ["progress", "bar", "progress-bar-fill-track"],
  previewType: "box",
  cssCode: `.roycss-ferrum-progress-bar-fill-track {
    width: 100%;
    height: 10px;
    background-color: oklch(0.931 0.0 89.88);
    border-radius: 10px;
    overflow: hidden;
    position: relative;`,
},

{
  id: "ferrum-progress-bar-fill",
  name: "Bar Fill",
  category: "microinteractions",
  description: "A microinteraction that animates a small UI element (bar fill)",
  tags: ["progress", "bar", "progress-bar-fill", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-progress-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, oklch(0.673 0.162 144.21), oklch(0.718 0.142 144.89));
    border-radius: 10px;
    width: 0%;
    transition: width 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    position: relative;
    overflow: hidden;
}
.roycss-ferrum-progress-bar-fill::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
        90deg,
        transparent 0%,
        color-mix(in oklch, oklch(1 0 0) 30%, transparent) 50%,
        transparent 100%
    );
    background-size: 200% 100%;
    animation: roy-ferrum-progress-stripe 1s linear infinite;
}
.roycss-ferrum-progress-bar-fill.roycss-ferrum-animated {
    width: 75%;
}

@keyframes roy-ferrum-progress-stripe {

    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }

}`,
},

{
  id: "ferrum-ripple-click",
  name: "Ripple Click",
  category: "microinteractions",
  description: "A ripple click effect",
  tags: ["ripple-click", "click"],
  previewType: "box",
  cssCode: `.roycss-ferrum-ripple-click {
    position: relative;
    overflow: hidden;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
}
.roycss-ferrum-ripple-click::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background-color: color-mix(in oklch, oklch(1 0 0) 35%, transparent);
    transform: translate(-50%, -50%) scale(0);
    transition: width 0.6s ease, height 0.6s ease, opacity 0.6s ease;
    opacity: 0;
    pointer-events: none;
}
.roycss-ferrum-ripple-click:active::after {
    width: 300px;
    height: 300px;
    opacity: 1;
    transition: width 0s, height 0s, opacity 0s;
}
.roycss-ferrum-ripple-click:not(:active)::after {
    transition: width 0.6s ease, height 0.6s ease, opacity 0.6s ease;
}`,
},

  // ═══════════════════════════════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-accordion-slide",
  name: "Slide",
  category: "navigation",
  description: "A navigation component with motion or interaction feedback",
  tags: ["accordion", "navigation", "accordion-slide", "slide"],
  previewType: "box",
  cssCode: `.roycss-ferrum-accordion-slide {
    overflow: hidden;
    max-height: 0;
    opacity: 0;
    transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                opacity 0.3s ease,
                padding 0.3s ease;
    padding: 0 16px;
}
.roycss-ferrum-accordion-trigger:checked ~ .roycss-ferrum-accordion-slide,
.roycss-ferrum-accordion-slide.roycss-ferrum-open {
    max-height: 500px;
    opacity: 1;
    padding: 16px;`,
},

{
  id: "ferrum-accordion-trigger",
  name: "Trigger",
  category: "navigation",
  description: "A navigation component with motion or interaction feedback",
  tags: ["accordion", "navigation", "accordion-trigger", "trigger"],
  previewType: "box",
  cssCode: `.roycss-ferrum-accordion-trigger {
    display: none;`,
},

{
  id: "ferrum-accordion-trigger-label",
  name: "Trigger Label",
  category: "navigation",
  description: "A navigation component with motion or interaction feedback",
  tags: ["accordion", "navigation", "accordion-trigger-label", "trigger", "interactive"],
  previewType: "box",
  cssCode: `.roycss-ferrum-accordion-trigger-label {
    display: block;
    padding: 14px 16px;
    cursor: pointer;
    font-weight: 600;
    background-color: oklch(0.97 0.0 89.88);
    border-radius: 8px;
    transition: background-color 0.2s ease;
    user-select: none;
}
.roycss-ferrum-accordion-trigger-label:hover {
    background-color: oklch(0.949 0.0 89.88);
}
.roycss-ferrum-accordion-trigger:checked ~ .roycss-ferrum-accordion-trigger-label {
    border-radius: 8px 8px 0 0;
    background-color: oklch(0.931 0.0 89.88);
}
.roycss-ferrum-accordion-trigger-label::after {
    content: '+';
    float: right;
    font-size: 18px;
    line-height: 1;
    transition: transform 0.3s ease;
}
.roycss-ferrum-accordion-trigger:checked ~ .roycss-ferrum-accordion-trigger-label::after {
    content: '\\2212';
    transform: rotate(180deg);
}`,
},

{
  id: "ferrum-tab-underline-group",
  name: "Underline Group",
  category: "navigation",
  description: "A navigation component with motion or interaction feedback",
  tags: ["tabs", "navigation", "tab-underline-group", "underline"],
  previewType: "box",
  cssCode: `.roycss-ferrum-tab-underline-group {
    position: relative;
    display: flex;
    gap: 0;
    border-bottom: 2px solid oklch(0.907 0.0 89.88);`,
},

{
  id: "ferrum-tab-underline",
  name: "Underline",
  category: "navigation",
  description: "A navigation component with motion or interaction feedback",
  tags: ["tabs", "navigation", "tab-underline", "underline", "interactive"],
  previewType: "box",
  cssCode: `.roycss-ferrum-tab-underline {
    padding: 10px 20px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: oklch(0.569 0.0 89.88);
    background: none;
    border: none;
    outline: none;
    position: relative;
    transition: color 0.3s ease;
}
.roycss-ferrum-tab-underline::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 50%;
    width: 0;
    height: 2px;
    background-color: oklch(0.658 0.169 248.81);
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.roycss-ferrum-tab-underline:hover {
    color: oklch(0.321 0.0 89.88);
}
.roycss-ferrum-tab-underline:hover::after {
    width: 100%;
    left: 0;
}
.roycss-ferrum-tab-underline.roycss-ferrum-active,
.roycss-ferrum-tab-underline:active {
    color: oklch(0.658 0.169 248.81);
}
.roycss-ferrum-tab-underline.roycss-ferrum-active::after,
.roycss-ferrum-tab-underline:active::after {
    width: 100%;
    left: 0;
}`,
},

{
  id: "ferrum-dropdown-slide-wrapper",
  name: "Dropdown Slide Wrapper",
  category: "navigation",
  description: "A navigation component with motion or interaction feedback",
  tags: ["dropdown-slide-wrapper", "slide"],
  previewType: "box",
  cssCode: `.roycss-ferrum-dropdown-slide-wrapper {
    position: relative;
    display: inline-block;`,
},

{
  id: "ferrum-dropdown-slide",
  name: "Dropdown Slide",
  category: "navigation",
  description: "A navigation component with motion or interaction feedback",
  tags: ["dropdown-slide", "slide", "interactive"],
  previewType: "box",
  cssCode: `.roycss-ferrum-dropdown-slide {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    min-width: 180px;
    background-color: oklch(1 0 0);
    border: 1px solid oklch(0.907 0.0 89.88);
    border-radius: 8px;
    box-shadow: 0 8px 24px color-mix(in oklch, oklch(0 0 0) 10%, transparent);
    padding: 6px 0;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-8px);
    transition: opacity 0.25s ease,
                transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
                visibility 0.25s;
    z-index: 20;
}
.roycss-ferrum-dropdown-slide-wrapper:focus-within .roycss-ferrum-dropdown-slide,
.roycss-ferrum-dropdown-slide-wrapper:hover .roycss-ferrum-dropdown-slide {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);`,
},

{
  id: "ferrum-dropdown-slide-item",
  name: "Dropdown Slide Item",
  category: "navigation",
  description: "A navigation component with motion or interaction feedback",
  tags: ["dropdown-slide-item", "slide", "interactive"],
  previewType: "box",
  cssCode: `.roycss-ferrum-dropdown-slide-item {
    display: block;
    width: 100%;
    padding: 8px 16px;
    border: none;
    background: none;
    text-align: left;
    font-size: 14px;
    cursor: pointer;
    color: oklch(0.321 0.0 89.88);
    transition: background-color 0.15s ease;
}
.roycss-ferrum-dropdown-slide-item:hover {
    background-color: oklch(0.967 0.015 269.99);
}
.roycss-ferrum-dropdown-slide-item:first-child {
    border-radius: 8px 8px 0 0;
}
.roycss-ferrum-dropdown-slide-item:last-child {
    border-radius: 0 0 8px 8px;
}`,
},

  // ═══════════════════════════════════════════════════════════════
  // PAGE-TRANSITIONS
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-triangle-reveal",
  name: "Triangle Reveal",
  category: "page-transitions",
  description: "An animated motion effect (triangle reveal)",
  tags: ["triangle-reveal", "reveal", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-triangle-reveal {
    animation: roy-ferrum-triangle-reveal 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

@keyframes roy-ferrum-triangle-reveal {

    0%   { clip-path: polygon(50% 50%, 50% 50%, 50% 50%); }
    50%  { clip-path: polygon(50% 15%, 85% 85%, 15% 85%); }
    100% { clip-path: polygon(50% 0%, 100% 100%, 0% 100%); }

}`,
},

{
  id: "ferrum-cross-reveal",
  name: "Cross Reveal",
  category: "page-transitions",
  description: "An animated motion effect (cross reveal)",
  tags: ["cross-reveal", "reveal", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-cross-reveal {
    animation: roy-ferrum-cross-reveal 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

@keyframes roy-ferrum-cross-reveal {

    0%   { clip-path: polygon(
        40% 0%, 60% 0%, 60% 40%, 100% 40%, 100% 60%,
        60% 60%, 60% 100%, 40% 100%, 40% 60%, 0% 60%,
        0% 40%, 40% 40%
    ); opacity: 0; }
    50%  { clip-path: polygon(
        35% 0%, 65% 0%, 65% 35%, 100% 35%, 100% 65%,
        65% 65%, 65% 100%, 35% 100%, 35% 65%, 0% 65%,
        0% 35%, 35% 35%
    ); opacity: 1; }
    100% { clip-path: polygon(
        0% 0%, 100% 0%, 100% 0%, 100% 0%, 100% 0%,
        100% 100%, 0% 100%, 0% 100%, 0% 100%, 0% 100%,
        0% 0%, 0% 0%
    ); opacity: 1; }

}`,
},

{
  id: "ferrum-hexagon-reveal",
  name: "Hexagon Reveal",
  category: "page-transitions",
  description: "An animated motion effect (hexagon reveal)",
  tags: ["hexagon-reveal", "reveal", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-hexagon-reveal {
    animation: roy-ferrum-hexagon-reveal 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

@keyframes roy-ferrum-hexagon-reveal {

    0%   { clip-path: polygon(50% 50%, 50% 50%, 50% 50%,
                              50% 50%, 50% 50%, 50% 50%); }
    60%  { clip-path: polygon(50% 15%, 93% 35%, 93% 65%,
                              50% 85%, 7% 65%, 7% 35%); }
    100% { clip-path: polygon(50% 0%, 100% 25%, 100% 75%,
                              50% 100%, 0% 75%, 0% 25%); }

}`,
},

{
  id: "ferrum-star-reveal",
  name: "Star Reveal",
  category: "page-transitions",
  description: "An animated motion effect (star reveal)",
  tags: ["star-reveal", "reveal", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-star-reveal {
    animation: roy-ferrum-star-reveal 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

@keyframes roy-ferrum-star-reveal {

    0%   { clip-path: polygon(50% 50%, 50% 50%, 50% 50%,
                              50% 50%, 50% 50%, 50% 50%,
                              50% 50%, 50% 50%, 50% 50%); }
    50%  { clip-path: polygon(50% 20%, 61% 40%, 80% 40%, 65% 55%,
                              75% 75%, 55% 65%, 50% 85%, 45% 65%,
                              25% 75%, 35% 55%, 20% 40%, 39% 40%); }
    100% { clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%,
                              79% 91%, 50% 70%, 21% 91%, 32% 57%,
                              2% 35%, 39% 35%); }

}`,
},

{
  id: "ferrum-slide-left-reveal",
  name: "Slide Left Reveal",
  category: "page-transitions",
  description: "An animated motion effect (slide left reveal)",
  tags: ["slide", "transition", "slide-left-reveal", "left", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-slide-left-reveal {
    animation: roy-ferrum-slide-left-reveal 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

@keyframes roy-ferrum-slide-left-reveal {

    0%   { clip-path: inset(0 100% 0 0); }
    100% { clip-path: inset(0 0% 0 0); }

}`,
},

{
  id: "ferrum-slide-down-reveal",
  name: "Slide Down Reveal",
  category: "page-transitions",
  description: "An animated motion effect (slide down reveal)",
  tags: ["slide", "transition", "slide-down-reveal", "down", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-slide-down-reveal {
    animation: roy-ferrum-slide-down-reveal 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

@keyframes roy-ferrum-slide-down-reveal {

    0%   { clip-path: inset(100% 0 0 0); }
    100% { clip-path: inset(0% 0 0 0); }

}`,
},

{
  id: "ferrum-wipe-reveal",
  name: "Wipe Reveal",
  category: "page-transitions",
  description: "An animated motion effect (wipe reveal)",
  tags: ["wipe-reveal", "reveal", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-wipe-reveal {
    animation: roy-ferrum-wipe-reveal 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

@keyframes roy-ferrum-wipe-reveal {

    0%   { clip-path: polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%); }
    50%  { clip-path: polygon(0% 0%, 60% 0%, 40% 100%, 0% 100%); }
    100% { clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%); }

}`,
},

  // ═══════════════════════════════════════════════════════════════
  // VISUAL
  // ═══════════════════════════════════════════════════════════════

{
  id: "ferrum-grayscale-in",
  name: "Grayscale In",
  category: "visual",
  description: "An animated motion effect (grayscale in)",
  tags: ["grayscale-in", "in", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-grayscale-in {
  animation: roy-ferrum-grayscale-in 1s ease-out both;
}

@keyframes roy-ferrum-grayscale-in {

  0% { filter: grayscale(1); }
  100% { filter: grayscale(0); }

}`,
},

{
  id: "ferrum-grayscale-out",
  name: "Grayscale Out",
  category: "visual",
  description: "An animated motion effect (grayscale out)",
  tags: ["grayscale-out", "out", "animated"],
  previewType: "box",
  cssCode: `.roycss-ferrum-grayscale-out {
  animation: roy-ferrum-grayscale-out 1s ease-in both;
}

@keyframes roy-ferrum-grayscale-out {

  0% { filter: grayscale(0); }
  100% { filter: grayscale(1); }

}`,
},

];
