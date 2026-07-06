export type EffectCategory =
  | "animations"
  | "hover"
  | "text"
  | "backgrounds"
  | "loaders"
  | "3d-transforms"
  | "buttons"
  | "cards";

export interface CSSEffect {
  id: string;
  name: string;
  category: EffectCategory;
  description: string;
  tags: string[];
  cssCode: string;
  previewType: "box" | "text" | "button" | "loader" | "card" | "background" | "group";
}

export const categoryMeta: Record<
  EffectCategory,
  { label: string; icon: string; color: string; description: string }
> = {
  animations: {
    label: "Animations",
    icon: "Play",
    color: "emerald",
    description: "Keyframe animations that bring elements to life",
  },
  hover: {
    label: "Hover Effects",
    icon: "MousePointer",
    color: "amber",
    description: "Interactive effects triggered on mouse hover",
  },
  text: {
    label: "Text Effects",
    icon: "Type",
    color: "rose",
    description: "Stunning text transformations and decorations",
  },
  backgrounds: {
    label: "Backgrounds",
    icon: "Layers",
    color: "violet",
    description: "Dynamic background patterns and gradients",
  },
  loaders: {
    label: "Loaders",
    icon: "Loader2",
    color: "sky",
    description: "Loading indicators and spinners",
  },
  "3d-transforms": {
    label: "3D & Transforms",
    icon: "Box",
    color: "orange",
    description: "Three-dimensional transformations and perspective effects",
  },
  buttons: {
    label: "Button Effects",
    icon: "MousePointerClick",
    color: "teal",
    description: "Interactive button animations and feedback",
  },
  cards: {
    label: "Card Effects",
    icon: "Square",
    color: "pink",
    description: "Card components with glass, borders, and reveals",
  },
};

export const effects: CSSEffect[] = [
  // ─── ANIMATIONS ─────────────────────────────────────────────
  {
    id: "pulse-glow",
    name: "Pulse Glow",
    category: "animations",
    description: "A smooth pulsing glow effect that draws attention to elements",
    tags: ["glow", "pulse", "attention", "animate"],
    previewType: "box",
    cssCode: `/* Pulse Glow */
.roycss-pulse-glow {
  animation: roy-pulse-glow 2s ease-in-out infinite;
}

@keyframes roy-pulse-glow {
  0%, 100% {
    box-shadow: 0 0 5px rgba(16, 185, 129, 0.3),
                0 0 10px rgba(16, 185, 129, 0.1);
  }
  50% {
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.6),
                0 0 40px rgba(16, 185, 129, 0.3),
                0 0 60px rgba(16, 185, 129, 0.1);
  }
}`,
  },
  {
    id: "bounce-in",
    name: "Bounce In",
    category: "animations",
    description: "Elements spring into view with an elastic bounce effect",
    tags: ["bounce", "spring", "entrance", "animate"],
    previewType: "box",
    cssCode: `/* Bounce In */
.roycss-bounce-in {
  animation: roy-bounce-in 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) both;
}

@keyframes roy-bounce-in {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
  }
}`,
  },
  {
    id: "fade-in-up",
    name: "Fade In Up",
    category: "animations",
    description: "Elements gracefully fade in while sliding upward",
    tags: ["fade", "slide", "entrance", "animate"],
    previewType: "box",
    cssCode: `/* Fade In Up */
.roycss-fade-in-up {
  animation: roy-fade-in-up 0.6s ease-out both;
}

@keyframes roy-fade-in-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}`,
  },
  {
    id: "rotate-spin",
    name: "Rotate Spin",
    category: "animations",
    description: "Continuous smooth rotation with configurable speed",
    tags: ["rotate", "spin", "infinite", "animate"],
    previewType: "box",
    cssCode: `/* Rotate Spin */
.roycss-rotate-spin {
  animation: roy-rotate-spin 2s linear infinite;
}

@keyframes roy-rotate-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}`,
  },
  {
    id: "shake",
    name: "Shake",
    category: "animations",
    description: "A vigorous shake animation perfect for error states or alerts",
    tags: ["shake", "error", "alert", "animate"],
    previewType: "box",
    cssCode: `/* Shake */
.roycss-shake {
  animation: roy-shake 0.5s ease-in-out;
}

@keyframes roy-shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}`,
  },
  {
    id: "float",
    name: "Float",
    category: "animations",
    description: "A gentle floating motion that gives elements a weightless feel",
    tags: ["float", "gentle", "hover", "animate"],
    previewType: "box",
    cssCode: `/* Float */
.roycss-float {
  animation: roy-float 3s ease-in-out infinite;
}

@keyframes roy-float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-12px);
  }
}`,
  },
  {
    id: "jello",
    name: "Jello",
    category: "animations",
    description: "A fun wobbly jello-like animation with skew transforms",
    tags: ["jello", "wobble", "fun", "animate", "skew"],
    previewType: "box",
    cssCode: `/* Jello */
.roycss-jello {
  animation: roy-jello 0.9s ease both;
}

@keyframes roy-jello {
  0% { transform: scale3d(1, 1, 1); }
  30% { transform: scale3d(1.25, 0.75, 1); }
  40% { transform: scale3d(0.75, 1.25, 1); }
  50% { transform: scale3d(1.15, 0.85, 1); }
  65% { transform: scale3d(0.95, 1.05, 1); }
  75% { transform: scale3d(1.05, 0.95, 1); }
  100% { transform: scale3d(1, 1, 1); }
}`,
  },
  {
    id: "heartbeat",
    name: "Heartbeat",
    category: "animations",
    description: "A rhythmic pulsing animation mimicking a heartbeat",
    tags: ["heartbeat", "pulse", "rhythm", "animate"],
    previewType: "box",
    cssCode: `/* Heartbeat */
.roycss-heartbeat {
  animation: roy-heartbeat 1.5s ease-in-out infinite;
}

@keyframes roy-heartbeat {
  0%, 100% { transform: scale(1); }
  14% { transform: scale(1.15); }
  28% { transform: scale(1); }
  42% { transform: scale(1.15); }
  70% { transform: scale(1); }
}`,
  },

  // ─── HOVER EFFECTS ──────────────────────────────────────────
  {
    id: "hover-scale",
    name: "Scale Up",
    category: "hover",
    description: "Smooth scale transformation on hover with a subtle shadow boost",
    tags: ["scale", "grow", "hover", "zoom"],
    previewType: "box",
    cssCode: `/* Hover Scale Up */
.roycss-hover-scale {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.3s ease;
}

.roycss-hover-scale:hover {
  transform: scale(1.08);
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.2);
}`,
  },
  {
    id: "hover-underline-slide",
    name: "Underline Slide",
    category: "hover",
    description: "An animated underline that slides in from left on hover",
    tags: ["underline", "slide", "text", "hover"],
    previewType: "text",
    cssCode: `/* Underline Slide */
.roycss-underline-slide {
  position: relative;
  display: inline-block;
  text-decoration: none;
}

.roycss-underline-slide::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #10b981, #14b8a6);
  transition: width 0.3s ease;
}

.roycss-underline-slide:hover::after {
  width: 100%;
}`,
  },
  {
    id: "hover-glow-border",
    name: "Glow Border",
    category: "hover",
    description: "A glowing border effect that illuminates on hover",
    tags: ["glow", "border", "hover", "neon"],
    previewType: "box",
    cssCode: `/* Hover Glow Border */
.roycss-hover-glow-border {
  border: 2px solid transparent;
  background-clip: padding-box;
  position: relative;
  transition: all 0.3s ease;
}

.roycss-hover-glow-border::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  background: linear-gradient(135deg, #10b981, #14b8a6, #06b6d4);
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s ease;
  filter: blur(8px);
}

.roycss-hover-glow-border:hover::before {
  opacity: 1;
}

.roycss-hover-glow-border:hover {
  border-color: rgba(16, 185, 129, 0.5);
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.15);
}`,
  },
  {
    id: "hover-shadow-grow",
    name: "Shadow Grow",
    category: "hover",
    description: "Box shadow expands and intensifies on hover",
    tags: ["shadow", "depth", "hover", "elevation"],
    previewType: "box",
    cssCode: `/* Hover Shadow Grow */
.roycss-hover-shadow-grow {
  transition: transform 0.3s ease,
              box-shadow 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
}

.roycss-hover-shadow-grow:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12),
              0 4px 8px rgba(0, 0, 0, 0.06);
}`,
  },
  {
    id: "hover-color-shift",
    name: "Color Shift",
    category: "hover",
    description: "Smooth background color transition between states",
    tags: ["color", "transition", "hover", "gradient"],
    previewType: "box",
    cssCode: `/* Hover Color Shift */
.roycss-hover-color-shift {
  background: linear-gradient(135deg, #10b981, #059669);
  transition: all 0.4s ease;
  background-size: 200% 200%;
  background-position: 0% 50%;
}

.roycss-hover-color-shift:hover {
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  background-size: 200% 200%;
  background-position: 100% 50%;
}`,
  },
  {
    id: "hover-rotate-slight",
    name: "Tilt Rotate",
    category: "hover",
    description: "Subtle 3D tilt rotation on hover for depth",
    tags: ["rotate", "tilt", "3d", "hover"],
    previewType: "box",
    cssCode: `/* Hover Tilt Rotate */
.roycss-hover-tilt-rotate {
  transition: transform 0.3s ease;
  transform-style: preserve-3d;
  perspective: 1000px;
}

.roycss-hover-tilt-rotate:hover {
  transform: rotateY(8deg) rotateX(-5deg) scale(1.02);
}`,
  },

  // ─── TEXT EFFECTS ───────────────────────────────────────────
  {
    id: "text-gradient",
    name: "Gradient Text",
    category: "text",
    description: "Text filled with a vibrant multi-color gradient",
    tags: ["gradient", "text", "colorful", "typography"],
    previewType: "text",
    cssCode: `/* Gradient Text */
.roycss-text-gradient {
  background: linear-gradient(135deg, #10b981 0%, #14b8a6 40%, #06b6d4 70%, #8b5cf6 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  font-weight: 700;
}`,
  },
  {
    id: "text-glow",
    name: "Neon Glow Text",
    category: "text",
    description: "Text with a vivid neon glow effect, like a neon sign",
    tags: ["neon", "glow", "text", "light"],
    previewType: "text",
    cssCode: `/* Neon Glow Text */
.roycss-text-neon-glow {
  color: #10b981;
  text-shadow:
    0 0 7px rgba(16, 185, 129, 0.8),
    0 0 10px rgba(16, 185, 129, 0.6),
    0 0 21px rgba(16, 185, 129, 0.4),
    0 0 42px rgba(16, 185, 129, 0.2),
    0 0 82px rgba(16, 185, 129, 0.1);
}`,
  },
  {
    id: "text-stroke",
    name: "Text Stroke",
    category: "text",
    description: "Outlined text with a transparent fill for a modern look",
    tags: ["stroke", "outline", "text", "hollow"],
    previewType: "text",
    cssCode: `/* Text Stroke */
.roycss-text-stroke {
  -webkit-text-stroke: 2px currentColor;
  color: transparent;
  font-weight: 700;
}`,
  },
  {
    id: "text-typing-cursor",
    name: "Typing Cursor",
    category: "text",
    description: "A blinking cursor effect that follows text",
    tags: ["typing", "cursor", "blink", "text"],
    previewType: "text",
    cssCode: `/* Typing Cursor */
.roycss-typing-cursor {
  border-right: 3px solid #10b981;
  animation: roy-blink-cursor 1s step-end infinite;
  padding-right: 4px;
}

@keyframes roy-blink-cursor {
  0%, 100% { border-color: #10b981; }
  50% { border-color: transparent; }
}`,
  },
  {
    id: "text-glitch",
    name: "Glitch Text",
    category: "text",
    description: "A cyberpunk-inspired glitch effect with color channel splitting",
    tags: ["glitch", "cyberpunk", "distort", "text"],
    previewType: "text",
    cssCode: `/* Glitch Text */
.roycss-text-glitch {
  position: relative;
  font-weight: 700;
}

.roycss-text-glitch::before,
.roycss-text-glitch::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.roycss-text-glitch::before {
  animation: roy-glitch-1 2s infinite linear alternate-reverse;
  clip-path: polygon(0 0, 100% 0, 100% 35%, 0 35%);
  color: #ef4444;
}

.roycss-text-glitch::after {
  animation: roy-glitch-2 3s infinite linear alternate-reverse;
  clip-path: polygon(0 65%, 100% 65%, 100% 100%, 0 100%);
  color: #3b82f6;
}

@keyframes roy-glitch-1 {
  0% { transform: translate(0); }
  20% { transform: translate(-3px, 3px); }
  40% { transform: translate(-3px, -3px); }
  60% { transform: translate(3px, 3px); }
  80% { transform: translate(3px, -3px); }
  100% { transform: translate(0); }
}

@keyframes roy-glitch-2 {
  0% { transform: translate(0); }
  20% { transform: translate(3px, -3px); }
  40% { transform: translate(3px, 3px); }
  60% { transform: translate(-3px, -3px); }
  80% { transform: translate(-3px, 3px); }
  100% { transform: translate(0); }
}`,
  },
  {
    id: "text-shadow-depth",
    name: "3D Text Shadow",
    category: "text",
    description: "Multiple layered shadows creating a 3D extrusion effect",
    tags: ["3d", "shadow", "text", "depth", "extrude"],
    previewType: "text",
    cssCode: `/* 3D Text Shadow */
.roycss-text-3d-shadow {
  color: #f0fdf4;
  text-shadow:
    1px 1px 0 #065f46,
    2px 2px 0 #047857,
    3px 3px 0 #059669,
    4px 4px 0 #10b981,
    5px 5px 0 rgba(16, 185, 129, 0.4),
    6px 6px 10px rgba(0, 0, 0, 0.3);
  font-weight: 700;
}`,
  },

  // ─── BACKGROUNDS ────────────────────────────────────────────
  {
    id: "bg-animated-gradient",
    name: "Animated Gradient",
    category: "backgrounds",
    description: "A slowly morphing gradient background with shifting colors",
    tags: ["gradient", "animated", "background", "morph"],
    previewType: "background",
    cssCode: `/* Animated Gradient Background */
.roycss-bg-animated-gradient {
  background: linear-gradient(-45deg, #065f46, #10b981, #06b6d4, #8b5cf6);
  background-size: 400% 400%;
  animation: roy-gradient-shift 8s ease infinite;
}

@keyframes roy-gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}`,
  },
  {
    id: "bg-dot-pattern",
    name: "Dot Grid Pattern",
    category: "backgrounds",
    description: "A clean dot grid pattern for structured backgrounds",
    tags: ["dots", "grid", "pattern", "background"],
    previewType: "background",
    cssCode: `/* Dot Grid Pattern */
.roycss-bg-dot-pattern {
  background-color: #0f172a;
  background-image: radial-gradient(circle, #10b981 1px, transparent 1px);
  background-size: 24px 24px;
}`,
  },
  {
    id: "bg-mesh-gradient",
    name: "Mesh Gradient",
    category: "backgrounds",
    description: "A modern mesh gradient with multiple blurred color spots",
    tags: ["mesh", "gradient", "modern", "background"],
    previewType: "background",
    cssCode: `/* Mesh Gradient Background */
.roycss-bg-mesh-gradient {
  background-color: #0f172a;
  position: relative;
  overflow: hidden;
}

.roycss-bg-mesh-gradient::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(at 20% 30%, rgba(16, 185, 129, 0.3) 0, transparent 50%),
    radial-gradient(at 80% 20%, rgba(6, 182, 212, 0.25) 0, transparent 50%),
    radial-gradient(at 50% 80%, rgba(139, 92, 246, 0.2) 0, transparent 50%);
  filter: blur(60px);
}`,
  },
  {
    id: "bg-grid-lines",
    name: "Grid Lines",
    category: "backgrounds",
    description: "Subtle intersecting grid lines for technical layouts",
    tags: ["grid", "lines", "technical", "background"],
    previewType: "background",
    cssCode: `/* Grid Lines Background */
.roycss-bg-grid-lines {
  background-color: #0f172a;
  background-image:
    linear-gradient(rgba(16, 185, 129, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(16, 185, 129, 0.06) 1px, transparent 1px);
  background-size: 48px 48px;
}`,
  },
  {
    id: "bg-noise",
    name: "Noise Texture",
    category: "backgrounds",
    description: "A subtle noise/grain texture overlay for visual depth",
    tags: ["noise", "grain", "texture", "background"],
    previewType: "background",
    cssCode: `/* Noise Texture Background */
.roycss-bg-noise {
  position: relative;
}

.roycss-bg-noise::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.15'/%3E%3C/svg%3E");
  background-repeat: repeat;
  pointer-events: none;
  z-index: 1;
}`,
  },
  {
    id: "bg-aurora",
    name: "Aurora",
    category: "backgrounds",
    description: "An ethereal aurora borealis effect with flowing lights",
    tags: ["aurora", "northern lights", "flow", "background"],
    previewType: "background",
    cssCode: `/* Aurora Background */
.roycss-bg-aurora {
  background: linear-gradient(135deg, #0f172a 0%, #0c1e2e 100%);
  position: relative;
  overflow: hidden;
}

.roycss-bg-aurora::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: conic-gradient(
    from 0deg at 50% 50%,
    transparent 0deg,
    rgba(16, 185, 129, 0.15) 60deg,
    transparent 120deg,
    rgba(6, 182, 212, 0.1) 180deg,
    transparent 240deg,
    rgba(139, 92, 246, 0.1) 300deg,
    transparent 360deg
  );
  animation: roy-aurora 12s linear infinite;
}

@keyframes roy-aurora {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}`,
  },

  // ─── LOADERS ────────────────────────────────────────────────
  {
    id: "loader-spinner",
    name: "Ring Spinner",
    category: "loaders",
    description: "A clean circular spinner with a trailing arc",
    tags: ["spinner", "loader", "loading", "circle"],
    previewType: "loader",
    cssCode: `/* Ring Spinner */
.roycss-loader-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(16, 185, 129, 0.2);
  border-top-color: #10b981;
  border-radius: 50%;
  animation: roy-spin 0.8s linear infinite;
}

@keyframes roy-spin {
  to { transform: rotate(360deg); }
}`,
  },
  {
    id: "loader-dots",
    name: "Bouncing Dots",
    category: "loaders",
    description: "Three dots bouncing in sequence for a playful loading state",
    tags: ["dots", "bounce", "loader", "loading"],
    previewType: "loader",
    cssCode: `/* Bouncing Dots Loader */
.roycss-loader-dots {
  display: flex;
  gap: 6px;
  align-items: center;
}

.roycss-loader-dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #10b981;
  animation: roy-bounce-dots 1.4s ease-in-out infinite;
}

.roycss-loader-dots span:nth-child(2) { animation-delay: 0.16s; }
.roycss-loader-dots span:nth-child(3) { animation-delay: 0.32s; }

@keyframes roy-bounce-dots {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}`,
  },
  {
    id: "loader-bars",
    name: "Equalizer Bars",
    category: "loaders",
    description: "Audio equalizer-style bars that animate at different speeds",
    tags: ["bars", "equalizer", "loader", "loading", "audio"],
    previewType: "loader",
    cssCode: `/* Equalizer Bars Loader */
.roycss-loader-bars {
  display: flex;
  gap: 3px;
  align-items: flex-end;
  height: 32px;
}

.roycss-loader-bars span {
  width: 4px;
  border-radius: 2px;
  background: #10b981;
  animation: roy-eq-bar 1.2s ease-in-out infinite;
}

.roycss-loader-bars span:nth-child(1) { animation-delay: 0s; }
.roycss-loader-bars span:nth-child(2) { animation-delay: 0.1s; }
.roycss-loader-bars span:nth-child(3) { animation-delay: 0.2s; }
.roycss-loader-bars span:nth-child(4) { animation-delay: 0.3s; }
.roycss-loader-bars span:nth-child(5) { animation-delay: 0.4s; }

@keyframes roy-eq-bar {
  0%, 100% { height: 8px; }
  50% { height: 28px; }
}`,
  },
  {
    id: "loader-orbit",
    name: "Orbit",
    category: "loaders",
    description: "A satellite orbiting around a center point",
    tags: ["orbit", "satellite", "loader", "loading", "rotate"],
    previewType: "loader",
    cssCode: `/* Orbit Loader */
.roycss-loader-orbit {
  width: 40px;
  height: 40px;
  position: relative;
}

.roycss-loader-orbit::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: #10b981;
  animation: roy-spin 1s linear infinite;
}

.roycss-loader-orbit::after {
  content: '';
  position: absolute;
  top: -3px;
  left: 50%;
  width: 8px;
  height: 8px;
  margin-left: -4px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
  animation: roy-orbit-move 1s linear infinite;
}

@keyframes roy-orbit-move {
  0% { transform: rotate(0deg) translateX(20px) rotate(0deg); }
  100% { transform: rotate(360deg) translateX(20px) rotate(-360deg); }
}`,
  },
  {
    id: "loader-pulse-ring",
    name: "Pulse Ring",
    category: "loaders",
    description: "Expanding concentric rings that fade out",
    tags: ["pulse", "ring", "expand", "loader"],
    previewType: "loader",
    cssCode: `/* Pulse Ring Loader */
.roycss-loader-pulse-ring {
  width: 40px;
  height: 40px;
  position: relative;
}

.roycss-loader-pulse-ring::before,
.roycss-loader-pulse-ring::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid #10b981;
  animation: roy-pulse-ring 1.5s ease-out infinite;
}

.roycss-loader-pulse-ring::after {
  animation-delay: 0.5s;
}

@keyframes roy-pulse-ring {
  0% {
    transform: scale(0.5);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}`,
  },

  // ─── 3D & TRANSFORMS ───────────────────────────────────────
  {
    id: "card-flip",
    name: "Card Flip",
    category: "3d-transforms",
    description: "A full 3D card flip revealing content on the back",
    tags: ["flip", "card", "3d", "transform", "perspective"],
    previewType: "card",
    cssCode: `/* Card Flip */
.roycss-card-flip {
  perspective: 1000px;
  width: 200px;
  height: 120px;
}

.roycss-card-flip-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

.roycss-card-flip:hover .roycss-card-flip-inner {
  transform: rotateY(180deg);
}

.roycss-card-flip-front,
.roycss-card-flip-back {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.roycss-card-flip-back {
  transform: rotateY(180deg);
}`,
  },
  {
    id: "perspective-tilt",
    name: "Perspective Tilt",
    category: "3d-transforms",
    description: "Dynamic perspective shift creating depth on interaction",
    tags: ["perspective", "tilt", "3d", "depth"],
    previewType: "box",
    cssCode: `/* Perspective Tilt */
.roycss-perspective-tilt {
  transform-style: preserve-3d;
  transform: perspective(800px) rotateX(5deg) rotateY(-5deg);
  transition: transform 0.4s ease;
  box-shadow: 8px 8px 20px rgba(0, 0, 0, 0.2);
}

.roycss-perspective-tilt:hover {
  transform: perspective(800px) rotateX(-5deg) rotateY(5deg);
}`,
  },
  {
    id: "cube-rotate",
    name: "Cube Rotate",
    category: "3d-transforms",
    description: "A 3D cube that continuously rotates showing all faces",
    tags: ["cube", "rotate", "3d", "transform"],
    previewType: "box",
    cssCode: `/* Cube Rotate */
.roycss-cube-rotate {
  width: 60px;
  height: 60px;
  transform-style: preserve-3d;
  animation: roy-cube-rotate 6s linear infinite;
}

@keyframes roy-cube-rotate {
  0% { transform: rotateX(0deg) rotateY(0deg); }
  100% { transform: rotateX(360deg) rotateY(360deg); }
}

.roycss-cube-face {
  position: absolute;
  width: 60px;
  height: 60px;
  border: 2px solid rgba(16, 185, 129, 0.5);
  background: rgba(16, 185, 129, 0.08);
  border-radius: 4px;
}`,
  },
  {
    id: "depth-shadow",
    name: "Depth Shadow Layers",
    category: "3d-transforms",
    description: "Layered shadows creating a 3D depth extrusion effect",
    tags: ["shadow", "depth", "layers", "3d", "extrude"],
    previewType: "box",
    cssCode: `/* Depth Shadow Layers */
.roycss-depth-shadow {
  box-shadow:
    1px 1px 0 #065f46,
    2px 2px 0 #059669,
    3px 3px 0 #047857,
    4px 4px 0 #10b981,
    5px 5px 0 rgba(16, 185, 129, 0.6),
    6px 6px 0 rgba(16, 185, 129, 0.4),
    7px 7px 0 rgba(16, 185, 129, 0.2),
    8px 8px 20px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.roycss-depth-shadow:hover {
  transform: translate(-2px, -2px);
  box-shadow:
    3px 3px 0 #065f46,
    4px 4px 0 #059669,
    5px 5px 0 #047857,
    6px 6px 0 #10b981,
    7px 7px 0 rgba(16, 185, 129, 0.6),
    8px 8px 0 rgba(16, 185, 129, 0.4),
    9px 9px 0 rgba(16, 185, 129, 0.2),
    10px 10px 30px rgba(0, 0, 0, 0.2);
}`,
  },

  // ─── BUTTON EFFECTS ────────────────────────────────────────
  {
    id: "btn-shine-sweep",
    name: "Shine Sweep",
    category: "buttons",
    description: "A sweeping shine/highlight that glides across the button",
    tags: ["shine", "sweep", "button", "glide"],
    previewType: "button",
    cssCode: `/* Shine Sweep Button */
.roycss-btn-shine {
  position: relative;
  overflow: hidden;
}

.roycss-btn-shine::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -60%;
  width: 40%;
  height: 200%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transform: skewX(-20deg);
  transition: left 0.6s ease;
}

.roycss-btn-shine:hover::after {
  left: 120%;
}`,
  },
  {
    id: "btn-fill-slide",
    name: "Fill Slide",
    category: "buttons",
    description: "Background slides in from one side on hover",
    tags: ["fill", "slide", "button", "background"],
    previewType: "button",
    cssCode: `/* Fill Slide Button */
.roycss-btn-fill-slide {
  position: relative;
  overflow: hidden;
  z-index: 1;
  border: 2px solid #10b981;
  color: #10b981;
  background: transparent;
  transition: color 0.4s ease;
}

.roycss-btn-fill-slide::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 0%;
  background: #10b981;
  z-index: -1;
  transition: height 0.4s ease;
}

.roycss-btn-fill-slide:hover {
  color: #fff;
}

.roycss-btn-fill-slide:hover::before {
  height: 100%;
}`,
  },
  {
    id: "btn-ripple",
    name: "Ripple Click",
    category: "buttons",
    description: "Material Design inspired ripple effect emanating from click point",
    tags: ["ripple", "material", "click", "button"],
    previewType: "button",
    cssCode: `/* Ripple Button */
.roycss-btn-ripple {
  position: relative;
  overflow: hidden;
}

.roycss-btn-ripple .ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: scale(0);
  animation: roy-ripple-anim 0.6s linear;
  pointer-events: none;
}

@keyframes roy-ripple-anim {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

/* JavaScript needed: create a span.ripple on click,
   position it at click coordinates, set width/height to
   the largest dimension of the button */`,
  },
  {
    id: "btn-border-draw",
    name: "Border Draw",
    category: "buttons",
    description: "Animated border that draws itself around the button",
    tags: ["border", "draw", "animate", "button"],
    previewType: "button",
    cssCode: `/* Border Draw Button */
.roycss-btn-border-draw {
  position: relative;
  background: transparent;
  color: #10b981;
  z-index: 1;
}

.roycss-btn-border-draw::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 2px solid #10b981;
  border-radius: inherit;
  clip-path: polygon(
    0 0, 0 0, 0 0, 0 0
  );
  transition: clip-path 0.4s ease;
  z-index: -1;
}

.roycss-btn-border-draw:hover::before {
  clip-path: polygon(
    0 0, 100% 0, 100% 100%, 0 100%
  );
  background: rgba(16, 185, 129, 0.08);
}`,
  },

  // ─── CARD EFFECTS ──────────────────────────────────────────
  {
    id: "card-glassmorphism",
    name: "Glassmorphism",
    category: "cards",
    description: "Frosted glass effect with blur and transparency",
    tags: ["glass", "frosted", "blur", "card", "modern"],
    previewType: "card",
    cssCode: `/* Glassmorphism Card */
.roycss-card-glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}`,
  },
  {
    id: "card-neon-border",
    name: "Neon Border",
    category: "cards",
    description: "A glowing neon border that pulses around the card",
    tags: ["neon", "glow", "border", "card", "pulse"],
    previewType: "card",
    cssCode: `/* Neon Border Card */
.roycss-card-neon {
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 16px;
  animation: roy-neon-border 2s ease-in-out infinite alternate;
}

@keyframes roy-neon-border {
  from {
    box-shadow: 0 0 5px rgba(16, 185, 129, 0.1),
                inset 0 0 5px rgba(16, 185, 129, 0.05);
  }
  to {
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.3),
                0 0 40px rgba(16, 185, 129, 0.1),
                inset 0 0 20px rgba(16, 185, 129, 0.05);
  }
}`,
  },
  {
    id: "card-spotlight",
    name: "Spotlight Hover",
    category: "cards",
    description: "A light source that follows your cursor across the card",
    tags: ["spotlight", "cursor", "light", "card", "interactive"],
    previewType: "card",
    cssCode: `/* Spotlight Hover Card */
.roycss-card-spotlight {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.roycss-card-spotlight::before {
  content: '';
  position: absolute;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.roycss-card-spotlight:hover::before {
  opacity: 1;
}

/* JavaScript needed: update the top/left of ::before
   to follow the mouse position on mousemove */`,
  },
  {
    id: "card-gradient-border",
    name: "Gradient Border",
    category: "cards",
    description: "A smooth animated gradient running around the card border",
    tags: ["gradient", "border", "animate", "card"],
    previewType: "card",
    cssCode: `/* Gradient Border Card */
.roycss-card-gradient-border {
  position: relative;
  background: #0f172a;
  border-radius: 16px;
  padding: 2px;
}

.roycss-card-gradient-border::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 2px;
  background: linear-gradient(
    var(--angle, 0deg),
    #10b981, #06b6d4, #8b5cf6, #f59e0b, #10b981
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: roy-rotate-border 4s linear infinite;
}

@keyframes roy-rotate-border {
  to { --angle: 360deg; }
}

/* Note: requires @property declaration:
@property --angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
} */`,
  },
];

export const categoryOrder: EffectCategory[] = [
  "animations",
  "hover",
  "text",
  "backgrounds",
  "loaders",
  "3d-transforms",
  "buttons",
  "cards",
];