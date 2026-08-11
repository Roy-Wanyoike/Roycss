"use client";

import { ThreeTubesCursor } from "@/components/roycss/effects/three-tubes-cursor";

/**
 * ThreeTubesDemo
 *
 * Preview wrapper that renders the ThreeTubesCursor effect with an overlay
 * heading + description. Importable from the homepage to showcase the
 * premium Three.js visual effect.
 */
export function ThreeTubesDemo() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-12">
      <ThreeTubesCursor height={500} className="shadow-2xl ring-1 ring-border/60">
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Three.js · WebGL
          </span>
          <h2 className="text-balance bg-gradient-to-br from-white via-emerald-100 to-purple-200 bg-clip-text text-3xl font-bold tracking-tight text-transparent drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] sm:text-4xl md:text-5xl">
            Three.js Tubes Cursor
          </h2>
          <p className="max-w-xl text-pretty px-6 text-sm text-white/80 drop-shadow-[0_1px_6px_rgba(0,0,0,0.7)] sm:text-base">
            Animated 3D tubes follow your cursor with dynamic lighting. Click
            to randomize colors.
          </p>
        </div>
      </ThreeTubesCursor>
    </section>
  );
}
