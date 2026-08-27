"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export interface FloatingOrbsProps {
  /** Optional className applied to the wrapper div */
  className?: string;
  /** Height of the canvas wrapper in pixels (default 400) */
  height?: number;
}

/**
 * RoyCSS brand palette — emerald / teal / amber / rose (NO indigo/blue).
 * Each entry is a [hex color, emissive hex] pair (we reuse one color for both
 * so the bloom-like glow reads cleanly).
 */
const ORB_PALETTE: readonly number[] = [
  0x10b981, // emerald-500
  0x14b8a6, // teal-500
  0xf59e0b, // amber-500
  0xf43f5e, // rose-500
  0x22c55e, // green-500
  0x84cc16, // lime-500 (warm green)
];

const ORB_COUNT = 11;
const BOUNDS = 6.0; // half-width of the invisible drift cube
const ORB_RADIUS_MIN = 0.28;
const ORB_RADIUS_MAX = 0.55;
const DRIFT_SPEED_MIN = 0.18;
const DRIFT_SPEED_MAX = 0.42;

interface OrbData {
  mesh: THREE.Mesh;
  material: THREE.MeshStandardMaterial;
  velocity: THREE.Vector3;
  baseColor: THREE.Color;
  /** phase offset for color cycling */
  phase: number;
  light: THREE.PointLight;
}

/**
 * FloatingOrbs
 *
 * A cluster of 8-12 emissive `THREE.SphereGeometry` orbs drifting through a
 * bounded 3D volume. Each orb carries its own `THREE.PointLight` so it
 * illuminates its neighbours as it moves, and bounces off invisible bounds
 * (±6 on every axis). Colors cycle slowly through RoyCSS emerald / teal /
 * amber / rose — strictly no indigo or blue. The camera orbits the cluster
 * to reveal depth. A subtle additive "ghost" sphere is layered on each orb
 * to fake an inexpensive bloom-like halo.
 *
 * Honors `prefers-reduced-motion`: renders a single static frame and
 * cleans up all geometries, materials, lights, the renderer, and the RAF.
 */
export function FloatingOrbs({ className, height = 400 }: FloatingOrbsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // --- Scene -----------------------------------------------------------
    const scene = new THREE.Scene();

    // --- Camera ----------------------------------------------------------
    const aspect =
      container.clientWidth / Math.max(container.clientHeight, 1);
    const camera = new THREE.PerspectiveCamera(58, aspect, 0.1, 100);
    camera.position.set(0, 0, 11);

    // --- Renderer --------------------------------------------------------
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x04060a, 1);

    // --- Lights ----------------------------------------------------------
    const ambient = new THREE.AmbientLight(0x16201c, 0.55);
    scene.add(ambient);

    // --- Orbs ------------------------------------------------------------
    const orbs: OrbData[] = [];
    const orbGroup = new THREE.Group();
    scene.add(orbGroup);

    // Shared geometry — each orb scales it rather than allocating its own.
    const sharedGeometry = new THREE.SphereGeometry(1, 32, 32);

    for (let i = 0; i < ORB_COUNT; i++) {
      const paletteIndex = i % ORB_PALETTE.length;
      const colorHex = ORB_PALETTE[paletteIndex];
      const color = new THREE.Color(colorHex);
      const material = new THREE.MeshStandardMaterial({
        color: color.clone(),
        emissive: color.clone(),
        emissiveIntensity: 1.2,
        roughness: 0.32,
        metalness: 0.2,
      });
      const mesh = new THREE.Mesh(sharedGeometry, material);
      const radius =
        ORB_RADIUS_MIN +
        Math.random() * (ORB_RADIUS_MAX - ORB_RADIUS_MIN);
      mesh.scale.setScalar(radius);

      // Random initial position inside the drift cube.
      mesh.position.set(
        (Math.random() - 0.5) * BOUNDS * 1.4,
        (Math.random() - 0.5) * BOUNDS * 1.4,
        (Math.random() - 0.5) * BOUNDS * 1.4,
      );
      orbGroup.add(mesh);

      // Random velocity (per second) for the drift.
      const speed =
        DRIFT_SPEED_MIN +
        Math.random() * (DRIFT_SPEED_MAX - DRIFT_SPEED_MIN);
      const dir = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5,
      ).normalize();
      const velocity = dir.multiplyScalar(speed);

      // Point light at the orb position; intensity scaled with the radius.
      const light = new THREE.PointLight(colorHex, 1.1 * radius, 6.5, 1.6);
      light.position.copy(mesh.position);
      scene.add(light);

      orbs.push({
        mesh,
        material,
        velocity,
        baseColor: color,
        phase: Math.random() * Math.PI * 2,
        light,
      });
    }

    // --- Halo layer (fake bloom) -----------------------------------------
    // Each orb gets a larger, lower-opacity additive sphere to suggest a
    // bloom halo. Stored as a parallel array for cheap disposal.
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const halos: THREE.Mesh[] = [];
    for (const orb of orbs) {
      const halo = new THREE.Mesh(sharedGeometry, haloMaterial);
      const scale = orb.mesh.scale.x * 1.7;
      halo.scale.setScalar(scale);
      halo.position.copy(orb.mesh.position);
      scene.add(halo);
      halos.push(halo);
    }

    // --- Resize handling -------------------------------------------------
    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    // --- Animation loop --------------------------------------------------
    // We track elapsed time and delta ourselves to avoid Three.js Clock's
    // shared oldTime state when both getElapsedTime and getDelta are called.
    const startTime = performance.now() / 1000;
    let lastTime = startTime;
    let frameId: number | null = null;

    const animate = () => {
      const now = performance.now() / 1000;
      const time = now - startTime;
      const delta = Math.min(0.05, Math.max(0.0001, now - lastTime));
      lastTime = now;

      for (const orb of orbs) {
        // Drift.
        orb.mesh.position.x += orb.velocity.x * delta;
        orb.mesh.position.y += orb.velocity.y * delta;
        orb.mesh.position.z += orb.velocity.z * delta;

        // Bounce off invisible bounds.
        const p = orb.mesh.position;
        const v = orb.velocity;
        if (p.x > BOUNDS) {
          p.x = BOUNDS;
          v.x = -Math.abs(v.x);
        } else if (p.x < -BOUNDS) {
          p.x = -BOUNDS;
          v.x = Math.abs(v.x);
        }
        if (p.y > BOUNDS) {
          p.y = BOUNDS;
          v.y = -Math.abs(v.y);
        } else if (p.y < -BOUNDS) {
          p.y = -BOUNDS;
          v.y = Math.abs(v.y);
        }
        if (p.z > BOUNDS) {
          p.z = BOUNDS;
          v.z = -Math.abs(v.z);
        } else if (p.z < -BOUNDS) {
          p.z = -BOUNDS;
          v.z = Math.abs(v.z);
        }

        // Color cycling — sample the palette so colors shift slowly over time.
        const cycle =
          (Math.sin(time * 0.25 + orb.phase) + 1) / 2; // 0..1
        const idxA = Math.floor(
          (cycle * ORB_PALETTE.length) % ORB_PALETTE.length,
        );
        const idxB = (idxA + 1) % ORB_PALETTE.length;
        const colorA = new THREE.Color(ORB_PALETTE[idxA]);
        const colorB = new THREE.Color(ORB_PALETTE[idxB]);
        const blend = cycle * ORB_PALETTE.length - idxA;
        const mixed = colorA.clone().lerp(colorB, blend);
        orb.material.color.copy(mixed);
        orb.material.emissive.copy(mixed);
        orb.material.emissiveIntensity = 1.0 + Math.sin(time * 1.2 + orb.phase) * 0.4;

        // Sync light + halo position/color.
        orb.light.position.copy(p);
        orb.light.color.copy(mixed);
      }

      // Sync halo positions to their orbs.
      for (let i = 0; i < halos.length; i++) {
        halos[i].position.copy(orbs[i].mesh.position);
      }

      // Slow camera orbit around the cluster.
      const orbitRadius = 11;
      camera.position.x = Math.sin(time * 0.12) * orbitRadius;
      camera.position.z = Math.cos(time * 0.12) * orbitRadius;
      camera.position.y = Math.sin(time * 0.07) * 1.5;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    if (prefersReducedMotion) {
      renderer.render(scene, camera);
    } else {
      frameId = requestAnimationFrame(animate);
    }

    // --- Cleanup ---------------------------------------------------------
    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      resizeObserver.disconnect();

      orbs.forEach((orb) => {
        orb.material.dispose();
        orb.light.dispose();
        scene.remove(orb.mesh);
        scene.remove(orb.light);
        orbGroup.remove(orb.mesh);
      });
      halos.forEach((halo) => {
        scene.remove(halo);
      });
      haloMaterial.dispose();
      sharedGeometry.dispose();

      ambient.dispose();
      scene.remove(ambient);
      scene.remove(orbGroup);

      renderer.dispose();
      scene.clear();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-2xl ${className ?? ""}`}
      style={{ height }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="block h-full w-full"
      />
    </div>
  );
}

export default FloatingOrbs;
