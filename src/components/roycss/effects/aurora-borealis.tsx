'use client'

/**
 * AuroraBorealis — Canvas 2D northern-lights ribbons.
 *
 * 4-6 flowing "ribbons" of light, each composed of layered sine waves with
 * different frequencies, amplitudes, and phases. Ribbons use a vertical
 * gradient (emerald → teal → purple) and are blended additively via
 * `globalCompositeOperation = 'screen'` over a near-black backdrop. Hue
 * slowly drifts over time.
 *
 * Honors `prefers-reduced-motion`: when reduced, renders a single static
 * frame and skips the animation loop.
 */

import { useEffect, useRef } from 'react'

interface AuroraBorealisProps {
  className?: string
  height?: number | string
}

interface Ribbon {
  baseY: number
  thickness: number
  freq1: number
  freq2: number
  amp1: number
  amp2: number
  phase: number
  speed: number
  hueStart: number
  hueEnd: number
  alpha: number
}

const RIBBON_COUNT = 5

export function AuroraBorealis({ className, height = 360 }: AuroraBorealisProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    let animationFrame = 0
    let width = 0
    let heightPx = 0
    let ribbons: Ribbon[] = []
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const makeRibbon = (index: number, total: number): Ribbon => {
      const slice = heightPx / (total + 1)
      const baseY = slice * (index + 1) + (Math.random() - 0.5) * slice * 0.4
      // Palette: emerald (155) → teal (175) → purple (300). NO indigo/blue.
      const palettes: Array<[number, number]> = [
        [155, 175], // emerald → teal
        [165, 195], // teal → cyan-green
        [145, 285], // emerald → purple
        [175, 305], // teal → magenta-purple
        [135, 250], // green → violet
      ]
      const [hueStart, hueEnd] = palettes[index % palettes.length]
      return {
        baseY,
        thickness: 80 + Math.random() * 70,
        freq1: 0.004 + Math.random() * 0.004,
        freq2: 0.008 + Math.random() * 0.006,
        amp1: 30 + Math.random() * 25,
        amp2: 12 + Math.random() * 14,
        phase: Math.random() * Math.PI * 2,
        speed: 0.0006 + Math.random() * 0.0008,
        hueStart,
        hueEnd,
        alpha: 0.5 + Math.random() * 0.25,
      }
    }

    const initRibbons = () => {
      ribbons = Array.from({ length: RIBBON_COUNT }, (_, i) =>
        makeRibbon(i, RIBBON_COUNT)
      )
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = Math.max(1, rect.width)
      heightPx = Math.max(1, rect.height)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(heightPx * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      initRibbons()
    }

    const drawBackground = () => {
      // Near-black with slight transparency for subtle trail blending.
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = '#020617'
      ctx.fillRect(0, 0, width, heightPx)
    }

    const drawRibbon = (ribbon: Ribbon, time: number, hueShift: number) => {
      const segments = 64
      const stepX = width / segments

      // Build the top edge points.
      const topPoints: Array<[number, number]> = []
      for (let i = 0; i <= segments; i++) {
        const x = i * stepX
        const wave =
          Math.sin(x * ribbon.freq1 + time + ribbon.phase) * ribbon.amp1 +
          Math.sin(x * ribbon.freq2 - time * 0.7 + ribbon.phase * 1.5) *
            ribbon.amp2
        topPoints.push([x, ribbon.baseY + wave])
      }

      // Vertical gradient (emerald → teal → purple) shifted over time.
      const grad = ctx.createLinearGradient(0, 0, width, 0)
      const h1 = (ribbon.hueStart + hueShift) % 360
      const h2 = (ribbon.hueEnd + hueShift) % 360
      grad.addColorStop(0, `hsla(${h1}, 85%, 60%, 0)`)
      grad.addColorStop(0.15, `hsla(${h1}, 90%, 60%, ${ribbon.alpha})`)
      grad.addColorStop(0.5, `hsla(${(h1 + h2) / 2}, 90%, 60%, ${ribbon.alpha})`)
      grad.addColorStop(0.85, `hsla(${h2}, 90%, 60%, ${ribbon.alpha})`)
      grad.addColorStop(1, `hsla(${h2}, 85%, 60%, 0)`)

      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.moveTo(topPoints[0][0], topPoints[0][1])
      for (let i = 1; i < topPoints.length; i++) {
        ctx.lineTo(topPoints[i][0], topPoints[i][1])
      }
      // Bottom edge (reverse), offset by thickness.
      for (let i = topPoints.length - 1; i >= 0; i--) {
        ctx.lineTo(topPoints[i][0], topPoints[i][1] + ribbon.thickness)
      }
      ctx.closePath()
      ctx.fill()

      // Bright glow along the top edge.
      ctx.strokeStyle = `hsla(${h1}, 100%, 75%, ${ribbon.alpha * 0.6})`
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(topPoints[0][0], topPoints[0][1])
      for (let i = 1; i < topPoints.length; i++) {
        ctx.lineTo(topPoints[i][0], topPoints[i][1])
      }
      ctx.stroke()
    }

    const render = (time: number) => {
      drawBackground()
      ctx.globalCompositeOperation = 'screen'
      const hueShift = (time * 8) % 360
      for (const ribbon of ribbons) {
        drawRibbon(ribbon, time, hueShift)
      }
      ctx.globalCompositeOperation = 'source-over'
    }

    const animate = () => {
      render(performance.now() * 0.001)
      animationFrame = requestAnimationFrame(animate)
    }

    const handleResize = () => {
      resize()
      if (reducedMotion) render(0)
    }

    resize()

    if (reducedMotion) {
      render(0)
    } else {
      animationFrame = requestAnimationFrame(animate)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        display: 'block',
        width: '100%',
        height: typeof height === 'number' ? `${height}px` : height,
        background: '#020617',
      }}
      aria-hidden="true"
    />
  )
}

export default AuroraBorealis
