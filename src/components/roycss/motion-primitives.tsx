"use client";

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  type CSSProperties,
} from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import { type LucideIcon } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   1. SCROLL REVEAL — fade + slide in when element enters viewport
   ═══════════════════════════════════════════════════════════════ */
export function ScrollReveal({
  children,
  delay = 0,
  y = 24,
  className = "",
  once = true,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   2. STAGGER CONTAINER + ITEM — for grid/list reveal animations
   ═══════════════════════════════════════════════════════════════ */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export function StaggerGroup({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      variants={staggerContainer}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   3. TEXT REVEAL — word-by-word fade up animation (animos style)
   ═══════════════════════════════════════════════════════════════ */
export function TextReveal({
  text,
  className = "",
  delay = 0,
  stagger = 0.08,
  once = true,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  once?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once, margin: "-40px" });
  const words = text.split(" ");

  return (
    <span ref={ref} className={`inline-block ${className}`}>
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden align-bottom"
          style={{ paddingBottom: "0.1em" }}
        >
          <motion.span
            className="inline-block"
            initial={{ y: "110%", opacity: 0 }}
            animate={isInView ? { y: "0%", opacity: 1 } : { y: "110%", opacity: 0 }}
            transition={{
              duration: 0.7,
              delay: delay + i * stagger,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {word}
            {i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   4. MAGNETIC BUTTON — element pulled toward cursor on hover
   ═══════════════════════════════════════════════════════════════ */
export function MagneticButton({
  children,
  className = "",
  strength = 0.4,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 15 });
  const springY = useSpring(y, { stiffness: 200, damping: 15 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      x.set(dx * strength);
      y.set(dy * strength);
    },
    [strength, x, y]
  );

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   5. TILT CARD — 3D tilt that follows mouse position
   ═══════════════════════════════════════════════════════════════ */
export function TiltCard({
  children,
  className = "",
  maxTilt = 12,
  glare = true,
}: {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  const [isHovering, setIsHovering] = useState(false);

  const springRotateX = useSpring(rotateX, { stiffness: 200, damping: 20 });
  const springRotateY = useSpring(rotateY, { stiffness: 200, damping: 20 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      rotateY.set((x - 0.5) * maxTilt * 2);
      rotateX.set(-(y - 0.5) * maxTilt * 2);
      glareX.set(x * 100);
      glareY.set(y * 100);
    },
    [maxTilt, rotateX, rotateY, glareX, glareY]
  );

  const handleMouseLeave = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
    setIsHovering(false);
  }, [rotateX, rotateY]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformStyle: "preserve-3d",
        transformPerspective: 1000,
      }}
      className={`relative ${className}`}
    >
      {children}
      {glare && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden"
          style={{
            background: `radial-gradient(circle at ${glareX.get()}% ${glareY.get()}%, rgba(16, 185, 129, 0.18), transparent 50%)`,
            opacity: isHovering ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
        />
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   6. ANIMATED COUNTER — count up from 0 to target on scroll into view
   ═══════════════════════════════════════════════════════════════ */
export function AnimatedCounter({
  value,
  duration = 2,
  suffix = "",
  prefix = "",
  className = "",
}: {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started) {
            setStarted(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;

    const start = performance.now();
    const endVal = value;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    let rafId: number;
    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = ease(progress);
      const current = Math.round(endVal * eased);
      setDisplay(current);
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setDisplay(endVal);
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [started, value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   7. MARQUEE — infinite horizontal scroll (tailwindcss.com style)
   ═══════════════════════════════════════════════════════════════ */
export function Marquee({
  children,
  speed = 30,
  direction = "left",
  className = "",
  pauseOnHover = true,
}: {
  children: ReactNode;
  speed?: number;
  direction?: "left" | "right";
  className?: string;
  pauseOnHover?: boolean;
}) {
  return (
    <div
      className={`roycss-marquee-wrapper relative flex overflow-hidden ${className}`}
      data-pause-on-hover={pauseOnHover ? "true" : "false"}
    >
      <div
        className="roycss-marquee-track flex shrink-0 items-center gap-4 pr-4"
        style={
          {
            "--marquee-duration": `${speed}s`,
            animationDirection: direction === "right" ? "reverse" : "normal",
          } as CSSProperties
        }
      >
        {children}
      </div>
      <div
        aria-hidden="true"
        className="roycss-marquee-track flex shrink-0 items-center gap-4 pr-4"
        style={
          {
            "--marquee-duration": `${speed}s`,
            animationDirection: direction === "right" ? "reverse" : "normal",
          } as CSSProperties
        }
      >
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   8. CURSOR GLOW — spotlight that follows the mouse across the page
   ═══════════════════════════════════════════════════════════════ */
export function CursorGlow({ color = "rgba(16, 185, 129, 0.12)" }: { color?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(-500);
  const y = useMotionValue(-500);
  const springX = useSpring(x, { stiffness: 120, damping: 25, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 120, damping: 25, mass: 0.5 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [x, y]);

  return (
    <motion.div
      ref={ref}
      className="pointer-events-none fixed inset-0 z-30 hidden md:block"
      style={{
        background: useTransform(
          [springX, springY],
          ([lx, ly]) =>
            `radial-gradient(360px circle at ${lx}px ${ly}px, ${color}, transparent 70%)`
        ),
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════
   9. PARALLAX — element moves at different speed on scroll
   ═══════════════════════════════════════════════════════════════ */
export function Parallax({
  children,
  offset = 80,
  className = "",
}: {
  children?: ReactNode;
  offset?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);

  return (
    <motion.div ref={ref} style={{ y, position: "relative" }} className={className}>
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   10. GRADIENT TEXT ANIMATED — shifting gradient on text
   ═══════════════════════════════════════════════════════════════ */
export function AnimatedGradientText({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`roycss-animated-gradient-text ${className}`}>{children}</span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   11. FLOATING ELEMENT — gentle float animation
   ═══════════════════════════════════════════════════════════════ */
export function Floating({
  children,
  className = "",
  duration = 4,
  delay = 0,
  distance = 10,
}: {
  children: ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
  distance?: number;
}) {
  return (
    <motion.div
      animate={{
        y: [0, -distance, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   12. SHINE BORDER — animated gradient border that rotates
   ═══════════════════════════════════════════════════════════════ */
export function ShineBorder({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`roycss-shine-border-wrap relative ${className}`}>
      <div className="roycss-shine-border" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   13. STAT COUNTER ITEM — icon + animated counter + label
   ═══════════════════════════════════════════════════════════════ */
export function StatCounter({
  icon: Icon,
  value,
  label,
  suffix = "",
  prefix = "",
}: {
  icon: LucideIcon;
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="flex flex-col items-center gap-1.5 p-4 rounded-2xl glass hover:border-primary/30 transition-colors group"
    >
      <Icon className="size-5 text-primary group-hover:scale-110 transition-transform" />
      <div className="font-display text-2xl sm:text-3xl font-bold text-gradient">
        <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   14. SECTION HEADING — animated heading with reveal
   ═══════════════════════════════════════════════════════════════ */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={`text-center max-w-2xl mx-auto ${className}`}>
      {eyebrow && (
        <ScrollReveal>
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium text-primary mb-4">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            {eyebrow}
          </div>
        </ScrollReveal>
      )}
      <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
        <TextReveal text={title} />
      </h2>
      {subtitle && (
        <ScrollReveal delay={0.2}>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">{subtitle}</p>
        </ScrollReveal>
      )}
    </div>
  );
}