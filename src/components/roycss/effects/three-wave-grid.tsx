'use client'

/**
 * ThreeWaveGrid — Three.js 3D undulating wave grid.
 *
 * A subdivided plane of vertices is displaced each frame by a sum of sine
 * waves to form an organic, flowing surface. The wave origin is lerped
 * toward the cursor position so moving the pointer steers the swell.
 *
 * Honors `prefers-reduced-motion`: when reduced, renders a single static
 * frame and skips the animation loop.
 */

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface ThreeWaveGridProps {
  className?: string
  height?: number | string
}

const PLANE_SIZE = 40
const PLANE_SEGMENTS = 60
const WAVE_AMPLITUDE = 2.2

export function ThreeWaveGrid({ className, height = 360 }: ThreeWaveGridProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    let width = container.clientWidth
    let heightPx = container.clientHeight

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#020617')

    // Camera — perspective from above, angled down.
    const camera = new THREE.PerspectiveCamera(
      45,
      width / Math.max(1, heightPx),
      0.1,
      200
    )
    camera.position.set(0, 22, 28)
    camera.lookAt(0, 0, 0)

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(width, heightPx)
    container.appendChild(renderer.domElement)
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'

    // Geometry — high subdivision for smooth waves.
    const geometry = new THREE.PlaneGeometry(
      PLANE_SIZE,
      PLANE_SIZE,
      PLANE_SEGMENTS,
      PLANE_SEGMENTS
    )
    // Rotate so the plane lies on the XZ ground plane, waves go up on Y.
    geometry.rotateX(-Math.PI / 2)

    // Store the original XZ positions for displacement math.
    const positionAttr = geometry.attributes.position as THREE.BufferAttribute
    const baseX = new Float32Array(positionAttr.count)
    const baseZ = new Float32Array(positionAttr.count)
    for (let i = 0; i < positionAttr.count; i++) {
      baseX[i] = positionAttr.getX(i)
      baseZ[i] = positionAttr.getZ(i)
    }

    // Material — emerald, flatShaded for crisp facets.
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#10b981'),
      flatShading: true,
      wireframe: false,
      metalness: 0.15,
      roughness: 0.55,
      side: THREE.DoubleSide,
    })

    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    // Lights — emerald + teal point lights + ambient.
    const ambient = new THREE.AmbientLight(0x223344, 1.0)
    scene.add(ambient)

    const emeraldLight = new THREE.PointLight('#10b981', 200, 80, 2)
    emeraldLight.position.set(-15, 12, 10)
    scene.add(emeraldLight)

    const tealLight = new THREE.PointLight('#14b8a6', 200, 80, 2)
    tealLight.position.set(15, 12, -10)
    scene.add(tealLight)

    // Cursor-driven wave origin.
    const cursorTarget = new THREE.Vector2(0, 0)
    const waveOrigin = new THREE.Vector2(0, 0)

    const updateGeometry = (time: number) => {
      // Lerp wave origin toward cursor.
      waveOrigin.lerp(cursorTarget, 0.04)

      const ox = waveOrigin.x
      const oz = waveOrigin.y

      for (let i = 0; i < positionAttr.count; i++) {
        const x = baseX[i]
        const z = baseZ[i]
        const dx = x - ox
        const dz = z - oz
        const dist = Math.sqrt(dx * dx + dz * dz)

        // Multiple sine waves layered for organic surface.
        const wave =
          Math.sin(dist * 0.5 - time * 1.8) * 0.55 +
          Math.sin(x * 0.35 + time * 1.2) * 0.35 +
          Math.sin(z * 0.45 + time * 0.9) * 0.3

        // Local "cursor bulge" near the wave origin.
        const bulge = Math.exp(-dist * 0.08) * 1.2

        positionAttr.setY(i, wave * WAVE_AMPLITUDE + bulge)
      }
      positionAttr.needsUpdate = true
      geometry.computeVertexNormals()
    }

    const handlePointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1
      // Map normalized cursor into plane XZ space.
      cursorTarget.set(nx * (PLANE_SIZE / 2), ny * (PLANE_SIZE / 2))
    }

    const handlePointerLeave = () => {
      cursorTarget.set(0, 0)
    }

    const handleResize = () => {
      width = container.clientWidth
      heightPx = container.clientHeight
      if (width === 0 || heightPx === 0) return
      camera.aspect = width / heightPx
      camera.updateProjectionMatrix()
      renderer.setSize(width, heightPx)
    }

    const clock = new THREE.Clock()

    const renderFrame = (time: number) => {
      updateGeometry(time)
      // Gentle rotation around Y for parallax depth.
      mesh.rotation.y = Math.sin(time * 0.15) * 0.12
      renderer.render(scene, camera)
    }

    let animationFrame = 0
    const animate = () => {
      const t = clock.getElapsedTime()
      renderFrame(t)
      animationFrame = requestAnimationFrame(animate)
    }

    // Initial frame (always render so something is visible).
    renderFrame(0)

    if (!reducedMotion) {
      animationFrame = requestAnimationFrame(animate)
      renderer.domElement.addEventListener('pointermove', handlePointerMove)
      renderer.domElement.addEventListener('pointerleave', handlePointerLeave)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', handleResize)
      renderer.domElement.removeEventListener('pointermove', handlePointerMove)
      renderer.domElement.removeEventListener('pointerleave', handlePointerLeave)

      geometry.dispose()
      material.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: '100%',
        height: typeof height === 'number' ? `${height}px` : height,
        background: '#020617',
        overflow: 'hidden',
      }}
      aria-hidden="true"
    />
  )
}

export default ThreeWaveGrid
