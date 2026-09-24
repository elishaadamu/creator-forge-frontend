import { useEffect, useRef, useCallback } from 'react'

/**
 * ShippedLiveCanvas
 * High-performance 60fps canvas celebration that triggers an animated
 * starburst, expanding shockwave rings, and confetti burst precisely when
 * the energy beam reaches "★ SHIPPED & LIVE".
 * 
 * Dynamically anchors to #shippedLiveBadge for 100% pixel-perfect coordinates.
 * Utilizes ResizeObserver and transform scaling for crisp Retina displays without
 * layout thrashing or timer drift.
 */
export default function ShippedLiveCanvas({
  cycleDuration = 6000, // Synced exactly with SVG animateMotion duration (6.0s)
  originXPercent = 0.77,
  originYPercent = 0.82,
  autoTrigger = true,
  className = ''
}) {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const animFrameRef = useRef(null)
  const startTimeRef = useRef(0)
  const hasBurstedCycleRef = useRef(false)
  const sizeRef = useRef({ width: 0, height: 0 })

  // Color palette: vibrant lime, emerald green, warm amber gold, and pure white sparkles
  const COLORS = [
    '#84CC16', // Lime 500
    '#A3E635', // Lime 400
    '#BEF264', // Lime 300
    '#10B981', // Emerald 500
    '#34D399', // Emerald 400
    '#6EE7B7', // Emerald 300
    '#F59E0B', // Amber Gold
    '#FBBF24', // Yellow Gold
    '#FFFFFF'  // Pure White Sparkle
  ]

  // Spawn a celebratory particle explosion originating directly from the badge
  const triggerBurst = useCallback((customX, customY, particleCount = 42) => {
    const canvas = canvasRef.current
    if (!canvas) return

    let originX
    let originY

    if (customX !== undefined && customY !== undefined) {
      originX = customX
      originY = customY
    } else {
      // Look up badge element for exact pixel coordinates relative to canvas
      const badge = document.getElementById('shippedLiveBadge') || document.getElementById('shippedLiveRect')
      const cRect = canvas.getBoundingClientRect()
      if (badge && cRect.width > 0) {
        const bRect = badge.getBoundingClientRect()
        originX = bRect.left + bRect.width / 2 - cRect.left
        originY = bRect.top + bRect.height / 2 - cRect.top
      } else {
        originX = sizeRef.current.width * originXPercent
        originY = sizeRef.current.height * originYPercent
      }
    }

    // 1. Primary expanding shockwave ring
    particlesRef.current.push({
      type: 'ring',
      x: originX,
      y: originY,
      radius: 6,
      maxRadius: 58,
      color: '#10B981',
      lineWidth: 3,
      alpha: 1,
      fadeSpeed: 0.032
    })

    // Secondary smaller neon lime shockwave ring
    particlesRef.current.push({
      type: 'ring',
      x: originX,
      y: originY,
      radius: 4,
      maxRadius: 36,
      color: '#A3E635',
      lineWidth: 2,
      alpha: 0.95,
      fadeSpeed: 0.045
    })

    // 2. Confetti gems, 4-point radiant stars, and twinkling sparks
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 5.8 + 2.2
      const vx = Math.cos(angle) * speed
      const vy = Math.sin(angle) * speed - (Math.random() * 2.2 + 0.6) // Upward drift bias

      const typeRandom = Math.random()
      let type = 'gem'
      if (typeRandom < 0.35) type = 'star'
      else if (typeRandom < 0.65) type = 'spark'

      particlesRef.current.push({
        type,
        x: originX + (Math.random() - 0.5) * 10,
        y: originY + (Math.random() - 0.5) * 6,
        vx,
        vy,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: type === 'star' ? Math.random() * 7 + 4 : Math.random() * 4.5 + 2.5,
        width: Math.random() * 6 + 3.5,
        height: Math.random() * 3.5 + 2.5,
        rotation: Math.random() * 360,
        spinSpeed: (Math.random() - 0.5) * 10,
        gravity: 0.11,
        drag: 0.965,
        alpha: 1,
        fadeSpeed: Math.random() * 0.018 + 0.014
      })
    }
  }, [originXPercent, originYPercent])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // ResizeObserver cleanly updates buffer on container resize without forced reflow in render loop
    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return

      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      sizeRef.current = { width: rect.width, height: rect.height }
    }

    handleResize()

    const resizeObserver = new ResizeObserver(() => {
      handleResize()
    })
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement)
    }

    startTimeRef.current = performance.now()
    hasBurstedCycleRef.current = false

    const render = (now) => {
      const { width, height } = sizeRef.current

      if (width > 0 && height > 0) {
        // Clear frame smoothly without re-querying DOM
        ctx.clearRect(0, 0, width, height)

        // Precision auto-cycle triggered by modulo sync with SVG animateMotion
        if (autoTrigger) {
          const elapsed = now - startTimeRef.current
          const cycleProgress = (elapsed % cycleDuration) / cycleDuration

          // Trigger when energy beam arrives at the end of the wire (~98-99% mark)
          if (cycleProgress >= 0.97 && !hasBurstedCycleRef.current) {
            triggerBurst()
            hasBurstedCycleRef.current = true
          } else if (cycleProgress < 0.5 && hasBurstedCycleRef.current) {
            // Reset trigger flag for the next wave
            hasBurstedCycleRef.current = false
          }
        }

        // Draw and update all active particles
        const activeParticles = []

        for (let i = 0; i < particlesRef.current.length; i++) {
          const p = particlesRef.current[i]
          p.alpha -= p.fadeSpeed

          if (p.alpha <= 0) continue

          ctx.save()
          ctx.globalAlpha = Math.max(0, p.alpha)

          if (p.type === 'ring') {
            p.radius += (p.maxRadius - p.radius) * 0.12
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
            ctx.strokeStyle = p.color
            ctx.lineWidth = p.lineWidth * p.alpha
            ctx.stroke()
          } else {
            // Physics update
            p.vx *= p.drag
            p.vy *= p.drag
            p.vy += p.gravity
            p.x += p.vx
            p.y += p.vy
            p.rotation += p.spinSpeed

            ctx.translate(p.x, p.y)
            ctx.rotate((p.rotation * Math.PI) / 180)

            if (p.type === 'gem') {
              ctx.fillStyle = p.color
              ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height)
            } else if (p.type === 'star') {
              // 4-pointed radiant star
              ctx.fillStyle = p.color
              ctx.beginPath()
              const s = p.size
              ctx.moveTo(0, -s)
              ctx.quadraticCurveTo(0, 0, s, 0)
              ctx.quadraticCurveTo(0, 0, 0, s)
              ctx.quadraticCurveTo(0, 0, -s, 0)
              ctx.quadraticCurveTo(0, 0, 0, -s)
              ctx.fill()
            } else if (p.type === 'spark') {
              ctx.fillStyle = p.color
              ctx.beginPath()
              ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
              ctx.fill()
            }
          }

          ctx.restore()
          activeParticles.push(p)
        }

        particlesRef.current = activeParticles
      }

      animFrameRef.current = requestAnimationFrame(render)
    }

    animFrameRef.current = requestAnimationFrame(render)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      resizeObserver.disconnect()
    }
  }, [cycleDuration, triggerBurst, autoTrigger])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none z-20 ${className}`}
    />
  )
}
