/**
 * Realistic consumer page used by the plugin unit tests (scanner realism,
 * Vite marking transform, Next.js source scanning).
 */

export interface HeroProps {
  featured: boolean;
  tone: "light" | "dark";
}

export function Hero({ featured, tone }: HeroProps) {
  const cardClass = [
    "roycss-card-3d",
    featured && "roycss-shine-border-wrap",
    tone === "dark" ? "roycss-glass-dark" : "roycss-glass-light",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={cardClass}>
      <h2
        className={`roycss-animated-gradient-text ${featured ? "roycss-pulse-glow" : ""}`}
      >
        RoyCSS in your bundler
      </h2>
      <button type="button" className="roycss-bounce-in r-btn r-btn-primary">
        Get started
      </button>
      {/* Legacy HTML mixed into JSX keeps the scanner honest. */}
      <div className="roycss-marquee-wrapper" data-pause-on-hover="true">
        <span className="r-hidden">fallback</span>
      </div>
    </section>
  );
}
