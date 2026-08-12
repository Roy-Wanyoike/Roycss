"use client";

import { motion } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════
   RoyCSS Animated Logo Component
   A pure-CSS animated logo demonstrating the library's own effects:
   - Gradient shift animation
   - Floating sparkles
   - Glow pulse
   - Code bracket morphing
   ═══════════════════════════════════════════════════════════════ */

type LogoSize = "sm" | "md" | "lg" | "xl";

interface RoyCSSLogoProps {
  size?: LogoSize;
  showText?: boolean;
  animated?: boolean;
  className?: string;
  /** When true, hides the wordmark below the `sm` breakpoint (mobile).
   *  Used in space-constrained surfaces like the top navbar so the logo
   *  icon never gets squeezed off-screen on 320px viewports. */
  hideTextOnMobile?: boolean;
}

const sizeMap: Record<LogoSize, { box: string; text: string; spark: string }> = {
  sm: { box: "size-7", text: "text-sm", spark: "size-1.5" },
  md: { box: "size-9", text: "text-lg", spark: "size-2" },
  lg: { box: "size-14", text: "text-2xl", spark: "size-2.5" },
  xl: { box: "size-20", text: "text-4xl", spark: "size-3.5" },
};

export function RoyCSSLogo({
  size = "md",
  showText = true,
  animated = true,
  className = "",
  hideTextOnMobile = false,
}: RoyCSSLogoProps) {
  const s = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Logo Mark */}
      <motion.div
        initial={animated ? { opacity: 0, scale: 0.8, rotate: -10 } : false}
        animate={animated ? { opacity: 1, scale: 1, rotate: 0 } : false}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={`relative ${s.box} shrink-0`}
      >
        {/* Glow backdrop */}
        {animated && (
          <motion.div
            animate={{
              opacity: [0.4, 0.7, 0.4],
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 rounded-xl bg-primary/40 blur-md"
          />
        )}

        {/* Main logo box with animated gradient */}
        <div className="relative size-full rounded-xl overflow-hidden">
          {/* Animated gradient background */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, #10b981, #14b8a6, #06b6d4, #8b5cf6, #10b981)",
              backgroundSize: "300% 300%",
              animation: animated
                ? "roy-logo-gradient 5s ease infinite"
                : "none",
            }}
          />

          {/* Inner glass overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20" />

          {/* Top highlight */}
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/25 to-transparent" />

          {/* Code brackets + sparkle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              viewBox="0 0 40 40"
              className="w-2/3 h-2/3"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Left bracket */}
              <motion.path
                d="M14 12 L8 20 L14 28"
                initial={animated ? { pathLength: 0, opacity: 0 } : false}
                animate={animated ? { pathLength: 1, opacity: 1 } : false}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              />
              {/* Right bracket */}
              <motion.path
                d="M26 12 L32 20 L26 28"
                initial={animated ? { pathLength: 0, opacity: 0 } : false}
                animate={animated ? { pathLength: 1, opacity: 1 } : false}
                transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
              />
            </svg>

            {/* Center sparkle */}
            <motion.div
              animate={
                animated
                  ? {
                      scale: [1, 1.3, 1],
                      rotate: [0, 90, 180],
                      opacity: [0.7, 1, 0.7],
                    }
                  : {}
              }
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute"
            >
              <SparkleIcon className="w-1/4 h-1/4 text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
            </motion.div>
          </div>
        </div>

        {/* Floating mini sparkles around the logo */}
        {animated && (
          <>
            <FloatingSparkle
              className={`absolute -top-1 -right-1 ${s.spark} text-amber-300`}
              delay={0}
              duration={3}
            />
            <FloatingSparkle
              className={`absolute -bottom-1 -left-1 ${s.spark} text-cyan-300`}
              delay={1}
              duration={3.5}
            />
          </>
        )}
      </motion.div>

      {/* Wordmark */}
      {showText && (
        <span
          className={`${hideTextOnMobile ? "hidden sm:inline" : ""} font-display font-bold ${s.text} text-foreground tracking-tight`}
        >
          Roy
          <span className="roycss-logo-text">CSS</span>
        </span>
      )}
    </div>
  );
}

/* ─── Floating Sparkle ──────────────────────────────────────── */
function FloatingSparkle({
  className = "",
  delay = 0,
  duration = 3,
}: {
  className?: string;
  delay?: number;
  duration?: number;
}) {
  return (
    <motion.div
      animate={{
        y: [0, -4, 0],
        opacity: [0.3, 1, 0.3],
        scale: [0.8, 1.1, 0.8],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={className}
    >
      <SparkleIcon className="size-full" />
    </motion.div>
  );
}

/* ─── Sparkle Icon (4-point star) ───────────────────────────── */
function SparkleIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2 C12.5 7, 14 8.5, 19 9 C14 9.5, 12.5 11, 12 16 C11.5 11, 10 9.5, 5 9 C10 8.5, 11.5 7, 12 2 Z" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Hero Logo — large display version for hero section
   Animated gradient mark with rotating ring
   ═══════════════════════════════════════════════════════════════ */
export function RoyCSSHeroLogo({ className = "" }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className={`relative ${className}`}
    >
      {/* Rotating gradient ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute -inset-3 rounded-3xl opacity-60 blur-sm"
        style={{
          background:
            "conic-gradient(from 0deg, #10b981, #06b6d4, #8b5cf6, #f59e0b, #10b981)",
        }}
      />

      {/* Logo mark container */}
      <motion.div
        animate={{
          y: [0, -8, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative size-20 sm:size-24 rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* Animated gradient mark with brackets */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #065f46, #10b981, #06b6d4, #8b5cf6)",
            backgroundSize: "300% 300%",
            animation: "roy-logo-gradient 6s ease infinite",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/30" />
        <div className="absolute top-0 inset-x-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent" />

        {/* Large brackets + sparkle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            viewBox="0 0 40 40"
            className="w-1/2 h-1/2"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <motion.path
              d="M14 12 L8 20 L14 28"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            />
            <motion.path
              d="M26 12 L32 20 L26 28"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.55 }}
            />
          </svg>
          <motion.div
            animate={{
              scale: [1, 1.4, 1],
              rotate: [0, 90, 180],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute"
          >
            <SparkleIcon className="w-5 h-5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]" />
          </motion.div>
        </div>
      </motion.div>

      {/* Orbiting sparkles */}
      <OrbitSparkle distance={70} duration={6} delay={0} color="text-amber-300" size="size-2" />
      <OrbitSparkle distance={75} duration={8} delay={2} color="text-cyan-300" size="size-1.5" />
      <OrbitSparkle distance={65} duration={7} delay={4} color="text-violet-300" size="size-2" />
    </motion.div>
  );
}

/* ─── Orbiting Sparkle ──────────────────────────────────────── */
function OrbitSparkle({
  distance,
  duration,
  delay,
  color,
  size,
}: {
  distance: number;
  duration: number;
  delay: number;
  color: string;
  size: string;
}) {
  return (
    <motion.div
      className="absolute top-1/2 left-1/2 pointer-events-none"
      animate={{ rotate: 360 }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
      style={{
        width: distance * 2,
        height: distance * 2,
        marginLeft: -distance,
        marginTop: -distance,
      }}
    >
      <motion.div
        className={`absolute top-0 left-1/2 -translate-x-1/2 ${color} ${size}`}
        animate={{
          scale: [0.7, 1.2, 0.7],
          opacity: [0.4, 1, 0.4],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <SparkleIcon className="size-full" />
      </motion.div>
    </motion.div>
  );
}
