"use client";

import { useEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";

export interface ThreeTubesCursorProps {
  /** Optional className applied to the wrapper div */
  className?: string;
  /** Optional initial tube colors (defaults to RoyCSS brand: emerald / teal / purple) */
  colors?: string[];
  /** Height of the canvas wrapper in pixels (default 400) */
  height?: number;
  /** Optional overlay content rendered above the canvas */
  children?: ReactNode;
}

/**
 * RoyCSS brand-aligned default palette (emerald / teal / purple — NO indigo/blue).
 */
const DEFAULT_TUBE_COLORS: readonly string[] = [
  "#10b981", // emerald-500
  "#14b8a6", // teal-500
  "#a855f7", // purple-500
];

/**
 * Vibrant cycling palette used when the user clicks to randomize.
 */
const TUBE_PALETTE: readonly string[] = [
  "#10b981", // emerald
  "#14b8a6", // teal
  "#a855f7", // purple
  "#ec4899", // pink
  "#f97316", // orange
  "#facc15", // yellow
  "#22c55e", // green
  "#ef4444", // red
  "#06b6d4", // cyan
  "#d946ef", // fuchsia
];

const LIGHT_PALETTE: readonly string[] = [
  "#83f36e", // lime green
  "#fe8a2e", // warm orange
  "#ff008a", // hot magenta
  "#60aed5", // sky
  "#facc15", // gold
  "#a855f7", // purple
];

const TUBE_COUNT = 4;
const CONTROL_POINTS = 20;
const TUBULAR_SEGMENTS = 80;
const RADIAL_SEGMENTS = 8;
const TUBE_RADIUS = 0.22;
const LIGHT_COUNT = 4;

interface TubeData {
  mesh: THREE.Mesh;
  material: THREE.MeshStandardMaterial;
  basePoints: THREE.Vector3[];
  phase: number;
  frequency: number;
  amplitude: number;
}

interface LightData {
  light: THREE.PointLight;
  basePosition: THREE.Vector3;
}

/**
 * Generate ~20 control points arranged along a flowing, organic helix-like path.
 * Each tube gets a slightly different seed so the tubes weave around each other.
 */
function createBaseCurvePoints(seed: number): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < CONTROL_POINTS; i++) {
    const t = i / (CONTROL_POINTS - 1);
    const angle = t * Math.PI * 4 + seed * 1.7;
    const radius = 3.2 + Math.sin(t * Math.PI * 2 + seed) * 1.3;
    points.push(
      new THREE.Vector3(
        Math.cos(angle) * radius,
        (t - 0.5) * 8.5,
        Math.sin(angle) * radius,
      ),
    );
  }
  return points;
}

/**
 * Fisher–Yates shuffle returning a new array (input is not mutated).
 */
function shuffleArray<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * ThreeTubesCursor
 *
 * A premium Three.js-powered background effect: animated 3D tubes that
 * follow the cursor, lit by colored point lights. Click the canvas to
 * randomize the tube + light colors. Honors prefers-reduced-motion.
 *
 * Inspired by the threejs-components TubesCursor concept (CC BY-NC-SA 4.0,
 * Kevin Levron) — this is an independent from-scratch implementation.
 */
export function ThreeTubesCursor({
  className,
  colors,
  height = 400,
  children,
}: ThreeTubesCursorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Respect prefers-reduced-motion: render a single static frame.
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // --- Scene -----------------------------------------------------------
    const scene = new THREE.Scene();

    // --- Camera ----------------------------------------------------------
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      100,
    );
    camera.position.set(0, 0, 10);

    // --- Renderer --------------------------------------------------------
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);

    // --- Tube group ------------------------------------------------------
    const group = new THREE.Group();
    scene.add(group);

    const initialTubeColors =
      (colors && colors.length > 0 ? colors : DEFAULT_TUBE_COLORS).slice(
        0,
        TUBE_COUNT,
      );
    const cycledTubeColors = shuffleArray(TUBE_PALETTE);
    const tubeColorList = (
      initialTubeColors.length >= TUBE_COUNT
        ? initialTubeColors
        : [
            ...initialTubeColors,
            ...cycledTubeColors.slice(0, TUBE_COUNT - initialTubeColors.length),
          ]
    ).slice(0, TUBE_COUNT);

    const tubes: TubeData[] = [];
    for (let i = 0; i < TUBE_COUNT; i++) {
      const basePoints = createBaseCurvePoints(i);
      const curve = new THREE.CatmullRomCurve3(basePoints);
      const geometry = new THREE.TubeGeometry(
        curve,
        TUBULAR_SEGMENTS,
        TUBE_RADIUS,
        RADIAL_SEGMENTS,
        false,
      );
      const hexColor = tubeColorList[i] ?? DEFAULT_TUBE_COLORS[0] ?? "#10b981";
      const color = new THREE.Color(hexColor);
      const material = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.55,
        metalness: 0.35,
        roughness: 0.3,
      });
      const mesh = new THREE.Mesh(geometry, material);
      group.add(mesh);

      tubes.push({
        mesh,
        material,
        basePoints,
        phase: i * 0.73,
        frequency: 0.7 + i * 0.18,
        amplitude: 0.45 + i * 0.08,
      });
    }

    // --- Lights ----------------------------------------------------------
    const lights: LightData[] = [];
    const lightBasePositions: ReadonlyArray<readonly [number, number, number]> = [
      [5, 5, 5],
      [-5, -3, 5],
      [0, 6, -5],
      [-4, 2, 6],
    ];
    const lightColors = shuffleArray(LIGHT_PALETTE).slice(0, LIGHT_COUNT);
    for (let i = 0; i < LIGHT_COUNT; i++) {
      const hex = lightColors[i] ?? LIGHT_PALETTE[0] ?? "#ffffff";
      const light = new THREE.PointLight(hex, 220, 60, 2);
      const pos = lightBasePositions[i] ?? [0, 0, 0];
      light.position.set(pos[0], pos[1], pos[2]);
      scene.add(light);
      lights.push({
        light,
        basePosition: light.position.clone(),
      });
    }

    const ambient = new THREE.AmbientLight(0xffffff, 0.18);
    scene.add(ambient);

    // --- Cursor tracking -------------------------------------------------
    const targetNDC = new THREE.Vector2(0, 0);
    const currentNDC = new THREE.Vector2(0, 0);

    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
      const y =
        -(((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1);
      targetNDC.set(x, y);
    };

    const onClick = () => {
      const newTubeColors = shuffleArray(TUBE_PALETTE).slice(0, TUBE_COUNT);
      const newLightColors = shuffleArray(LIGHT_PALETTE).slice(0, LIGHT_COUNT);
      tubes.forEach((tube, idx) => {
        const hex = newTubeColors[idx] ?? DEFAULT_TUBE_COLORS[0] ?? "#10b981";
        const c = new THREE.Color(hex);
        tube.material.color.copy(c);
        tube.material.emissive.copy(c);
      });
      lights.forEach((entry, idx) => {
        const hex = newLightColors[idx] ?? LIGHT_PALETTE[0] ?? "#ffffff";
        entry.light.color.set(hex);
      });
    };

    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("click", onClick);

    // --- Resize handling -------------------------------------------------
    const handleResize = () => {
      const w = container.clientWidth;
      const h = Math.max(container.clientHeight, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // --- Tube rebuild (wave undulation) ----------------------------------
    const rebuildTube = (tube: TubeData, time: number) => {
      const len = tube.basePoints.length;
      const points: THREE.Vector3[] = new Array(len);
      for (let i = 0; i < len; i++) {
        const p = tube.basePoints[i];
        const t = i / (len - 1);
        const wave =
          Math.sin(time * tube.frequency + t * Math.PI * 2 + tube.phase) *
          tube.amplitude;
        const wave2 =
          Math.cos(time * tube.frequency * 0.7 + t * Math.PI * 3 + tube.phase) *
          tube.amplitude *
          0.5;
        points[i] = new THREE.Vector3(p.x + wave, p.y, p.z + wave2);
      }
      const curve = new THREE.CatmullRomCurve3(points);
      const nextGeometry = new THREE.TubeGeometry(
        curve,
        TUBULAR_SEGMENTS,
        TUBE_RADIUS,
        RADIAL_SEGMENTS,
        false,
      );
      tube.mesh.geometry.dispose();
      tube.mesh.geometry = nextGeometry;
    };

    // --- Animation loop --------------------------------------------------
    const clock = new THREE.Clock();
    let frameId: number | null = null;

    const animate = () => {
      const time = clock.getElapsedTime();

      // Smooth cursor follow (lerp factor 0.05 per spec)
      currentNDC.lerp(targetNDC, 0.05);
      group.rotation.y = currentNDC.x * 0.6;
      group.rotation.x = -currentNDC.y * 0.4;
      group.position.x = currentNDC.x * 0.6;
      group.position.y = currentNDC.y * 0.6;

      // Slow auto-rotation of the whole group
      group.rotation.z = time * 0.04;

      // Lights drift subtly for dynamic highlights
      lights.forEach((entry, idx) => {
        const offset = idx * 1.3;
        entry.light.position.x =
          entry.basePosition.x + Math.sin(time * 0.5 + offset) * 0.8;
        entry.light.position.z =
          entry.basePosition.z + Math.cos(time * 0.45 + offset) * 0.8;
      });

      // Undulate tubes (regenerate geometry from animated curve)
      for (let i = 0; i < tubes.length; i++) {
        rebuildTube(tubes[i], time);
      }

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    if (prefersReducedMotion) {
      // Static frame only — no animation loop, no cursor reactivity.
      for (let i = 0; i < tubes.length; i++) {
        rebuildTube(tubes[i], 0);
      }
      renderer.render(scene, camera);
    } else {
      frameId = requestAnimationFrame(animate);
    }

    // --- Cleanup ---------------------------------------------------------
    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("click", onClick);
      resizeObserver.disconnect();

      tubes.forEach((tube) => {
        tube.mesh.geometry.dispose();
        tube.material.dispose();
        group.remove(tube.mesh);
      });
      lights.forEach((entry) => {
        entry.light.dispose();
        scene.remove(entry.light);
      });
      ambient.dispose();
      scene.remove(ambient);
      scene.remove(group);

      renderer.dispose();
      scene.clear();
    };
    // We intentionally only run this effect once on mount; `colors` is read
    // for initial setup and click-cycling refreshes the palette afterwards.
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-2xl ${className ?? ""}`}
      style={{ height }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      />
      {children}
    </div>
  );
}
