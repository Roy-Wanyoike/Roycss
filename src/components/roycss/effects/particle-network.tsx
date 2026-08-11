'use client'

/**
 * ParticleNetwork — Canvas 2D particle network background.
 *
 * Particles float around the canvas, draw connecting lines when within a
 * threshold distance, and are repelled by the cursor. Designed with an
 * emerald/teal palette (OKLCH-friendly) — NO indigo/blue primaries.
 *
 * Honors `prefers-reduced-motion`: when reduced, renders a single static
 * frame with no movement and no cursor repulsion.
 */

import { useEffect, useRef } from 'react'

interface ParticleNetworkProps {
  className?: string
  height?: number | string
  particleCount?: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

const CONNECT_DISTANCE = 120
const CURSOR_REPEL_DISTANCE = 100
const CURSOR_REPEL_FORCE = 0.6

// Emerald / teal palette in OKLCH-friendly hex (no indigo/blue primary).
const PARTICLE_COLOR = '#10b981' // emerald-500
const LINE_COLOR_RGB = '16, 185, 129' // emerald-500 as r,g,b for rgba()
const CURSOR_COLOR_RGB = '20, 184, 166' // teal-500 as r,g,b for rgba()
const BG_COLOR = '#020617' // very dark slate (near-black)

export function ParticleNetwork({
  className,
  height = 360,
  particleCount = 100,
}: ParticleNetworkProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrame = 0
    let width = 0
    let heightPx = 0
    let particles: Particle[] = []
    const cursor = { x: -9999, y: -9999, active: false }

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = Math.max(1, rect.width)
      heightPx = Math.max(1, rect.height)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(heightPx * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const makeParticle = (): Particle => {
      const radius = 1 + Math.random() * 2
      return {
        x: Math.random() * width,
        y: Math.random() * heightPx,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius,
      }
    }

    const initParticles = () => {
      const count = Math.max(20, Math.min(particleCount, 200))
      particles = Array.from({ length: count }, makeParticle)
    }

    const drawStatic = () => {
      ctx.fillStyle = BG_COLOR
      ctx.fillRect(0, 0, width, heightPx)

      // Lines
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i]
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const dist = Math.hypot(dx, dy)
          if (dist < CONNECT_DISTANCE) {
            const opacity = (1 - dist / CONNECT_DISTANCE) * 0.4
            ctx.strokeStyle = `rgba(${LINE_COLOR_RGB}, ${opacity})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        }
      }

      // Particles
      for (const p of particles) {
        ctx.fillStyle = PARTICLE_COLOR
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const step = () => {
      ctx.fillStyle = BG_COLOR
      ctx.fillRect(0, 0, width, heightPx)

      // Update particles
      for (const p of particles) {
        // Cursor repulsion
        if (cursor.active) {
          const dx = p.x - cursor.x
          const dy = p.y - cursor.y
          const dist = Math.hypot(dx, dy)
          if (dist < CURSOR_REPEL_DISTANCE && dist > 0.01) {
            const force = (1 - dist / CURSOR_REPEL_DISTANCE) * CURSOR_REPEL_FORCE
            p.vx += (dx / dist) * force
            p.vy += (dy / dist) * force
          }
        }

        p.x += p.vx
        p.y += p.vy

        // Friction to prevent runaway speeds
        p.vx *= 0.98
        p.vy *= 0.98

        // Bounds: wrap around
        if (p.x < -10) p.x = width + 10
        if (p.x > width + 10) p.x = -10
        if (p.y < -10) p.y = heightPx + 10
        if (p.y > heightPx + 10) p.y = -10
      }

      // Draw connecting lines
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i]
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const dist = Math.hypot(dx, dy)
          if (dist < CONNECT_DISTANCE) {
            const opacity = (1 - dist / CONNECT_DISTANCE) * 0.5
            ctx.strokeStyle = `rgba(${LINE_COLOR_RGB}, ${opacity})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        }
      }

      // Draw cursor connection lines (highlighted teal)
      if (cursor.active) {
        for (const p of particles) {
          const dx = p.x - cursor.x
          const dy = p.y - cursor.y
          const dist = Math.hypot(dx, dy)
          if (dist < CURSOR_REPEL_DISTANCE) {
            const opacity = (1 - dist / CURSOR_REPEL_DISTANCE) * 0.8
            ctx.strokeStyle = `rgba(${CURSOR_COLOR_RGB}, ${opacity})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(cursor.x, cursor.y)
            ctx.stroke()
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        ctx.fillStyle = PARTICLE_COLOR
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()
      }

      animationFrame = requestAnimationFrame(step)
    }

    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      cursor.x = event.clientX - rect.left
      cursor.y = event.clientY - rect.top
      cursor.active = true
    }

    const handlePointerLeave = () => {
      cursor.active = false
      cursor.x = -9999
      cursor.y = -9999
    }

    const handleResize = () => {
      resize()
      initParticles()
      if (reducedMotion) drawStatic()
    }

    resize()
    initParticles()

    if (reducedMotion) {
      drawStatic()
    } else {
      animationFrame = requestAnimationFrame(step)
      canvas.addEventListener('pointermove', handlePointerMove)
      canvas.addEventListener('pointerleave', handlePointerLeave)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', handleResize)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [particleCount])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        display: 'block',
        width: '100%',
        height: typeof height === 'number' ? `${height}px` : height,
        background: BG_COLOR,
      }}
      aria-hidden="true"
    />
  )
}

export default ParticleNetwork
