"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export interface NeonTunnelProps {
  /** Optional className applied to the wrapper div */
  className?: string;
  /** Height of the canvas wrapper in pixels (default 400) */
  height?: number;
}

/**
 * RoyCSS brand-aligned tunnel palette (emerald / teal / amber — NO indigo/blue).
 */
const TUNNEL_PALETTE: readonly number[] = [
  0x10b981, // emerald-500
  0x14b8a6, // teal-500
  0x22c55e, // green-500
  0x06b6d4, // cyan-500 (kept teal-leaning, not blue)
  0xf59e0b, // amber-500 (warm accent)
];

const RING_COUNT = 28;
const RING_SPACING = 3.2;
const RING_RADIUS = 2.4;
const TUBE_SEGMENTS = 24;
const TUBE_THICKNESS = 0.06;
const CAMERA_SPEED = 0.12;
const RECYCLE_THRESHOLD = 4.5; // recycle ring when camera is this far past it

interface RingData {
  mesh: THREE.Mesh;
  material: THREE.MeshStandardMaterial;
  baseZ: number;
  phase: number;
  paletteIndex: number;
}

/**
 * NeonTunnel
 *
 * A 3D neon tunnel the camera flies through. The tunnel is built from a row
 * of `THREE.TorusGeometry` rings; each ring uses an emissive emerald/teal
 * material whose intensity pulses with time. When the camera passes a ring,
 * the ring is recycled to the far end of the tunnel so the flight feels
 * endless. A dim ambient + point light keep depth readable without washing
 * out the neon walls.
 *
 * Honors `prefers-reduced-motion`: when reduced, renders a single static
 * frame (no camera movement, no pulsing). All geometries, materials, the
 * renderer, and the RAF are cleaned up on unmount.
 */
export function NeonTunnel({ className, height = 400 }: NeonTunnelProps) {
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
    scene.fog = new THREE.FogExp2(0x050a0d, 0.045);

    // --- Camera ----------------------------------------------------------
    const aspect =
      container.clientWidth / Math.max(container.clientHeight, 1);
    const camera = new THREE.PerspectiveCamera(72, aspect, 0.1, 200);
    camera.position.set(0, 0, 0);

    // --- Renderer --------------------------------------------------------
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x050a0d, 1);

    // --- Lights ----------------------------------------------------------
    const ambient = new THREE.AmbientLight(0x0a3a2a, 0.7);
    scene.add(ambient);

    const headlight = new THREE.PointLight(0x10b981, 1.4, 14, 1.6);
    headlight.position.set(0, 0, 1.2);
    scene.add(headlight);

    // --- Tunnel rings ----------------------------------------------------
    const ringGroup = new THREE.Group();
    scene.add(ringGroup);

    const rings: RingData[] = [];
    for (let i = 0; i < RING_COUNT; i++) {
      const geometry = new THREE.TorusGeometry(
        RING_RADIUS,
        TUBE_THICKNESS,
        16,
        TUBE_SEGMENTS,
      );
      const paletteIndex = i % TUNNEL_PALETTE.length;
      const color = TUNNEL_PALETTE[paletteIndex];
      const material = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.6,
        roughness: 0.35,
        metalness: 0.55,
      });
      const mesh = new THREE.Mesh(geometry, material);
      const z = -i * RING_SPACING;
      mesh.position.set(0, 0, z);
      mesh.rotation.x = Math.PI / 2; // face the camera
      // Slight wobble so rings aren't perfectly coplanar
      mesh.rotation.z = (i * 0.137) % (Math.PI * 2);
      ringGroup.add(mesh);
      rings.push({
        mesh,
        material,
        baseZ: z,
        phase: i * 0.5,
        paletteIndex,
      });
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
    const clock = new THREE.Clock();
    let frameId: number | null = null;
    let cameraZ = 0;

    const animate = () => {
      const time = clock.getElapsedTime();

      // Camera flies forward (z decreases in Three.js convention).
      if (!prefersReducedMotion) {
        cameraZ -= CAMERA_SPEED;
        camera.position.z = cameraZ;
      }

      // Pulse each ring's emissive intensity with a phase offset.
      for (const ring of rings) {
        const pulse = 1.1 + Math.sin(time * 1.4 + ring.phase) * 0.55;
        ring.material.emissiveIntensity = pulse;

        // Subtle radius breathing for extra depth perception.
        const breath = 1 + Math.sin(time * 0.6 + ring.phase) * 0.015;
        ring.mesh.scale.set(breath, breath, 1);

        // Recycle rings that the camera has flown past.
        if (ring.mesh.position.z - cameraZ > RECYCLE_THRESHOLD) {
          // Move it to the far end of the tunnel (most-negative z).
          const minZ = rings.reduce(
            (min, r) => Math.min(min, r.mesh.position.z),
            Infinity,
          );
          ring.mesh.position.z = minZ - RING_SPACING;
          ring.baseZ = ring.mesh.position.z;
        }
      }

      // Slowly rotate the headlight so it feels like a scanning beam.
      headlight.position.x = Math.sin(time * 0.4) * 0.5;
      headlight.position.y = Math.cos(time * 0.33) * 0.5;

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    if (prefersReducedMotion) {
      // Static frame only — still pulse a single ring so the scene is alive.
      rings.forEach((ring, i) => {
        ring.material.emissiveIntensity = 1.4 + Math.sin(i * 0.5) * 0.3;
      });
      renderer.render(scene, camera);
    } else {
      frameId = requestAnimationFrame(animate);
    }

    // --- Cleanup ---------------------------------------------------------
    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      resizeObserver.disconnect();

      rings.forEach((ring) => {
        ring.mesh.geometry.dispose();
        ring.material.dispose();
        ringGroup.remove(ring.mesh);
      });
      headlight.dispose();
      scene.remove(headlight);
      ambient.dispose();
      scene.remove(ambient);
      scene.remove(ringGroup);
      if (scene.fog && "dispose" in scene.fog) {
        // FogExp2 has no dispose() in current three typings; guard it.
        (scene.fog as { dispose?: () => void }).dispose?.();
      }

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

export default NeonTunnel;
