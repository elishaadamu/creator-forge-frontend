import { useEffect, useRef, useCallback } from 'react'

/**
 * ShippedLiveCanvas
 * High-performance 60fps canvas celebration that triggers an animated
 * confetti, starburst, and sparklers burst when the pipeline beam reaches
 * "★ SHIPPED & LIVE". Also responds to clicks and hovers.
 */
export default function ShippedLiveCanvas({
  cycleDuration = 6500, // Sync with SVG animateMotion duration
  originXPercent = 0.888, // Center X of ★ SHIPPED & LIVE in SVG (888 / 1000)
  originYPercent = 0.830, // Center Y of ★ SHIPPED & LIVE in SVG (415 / 500)
  autoTrigger = true,
  className = ''
}) {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const animFrameRef = useRef(null)
  const lastBurstTimeRef = useRef(0)

  // Color palette: vibrant light greens, emerald, gold, white, and mint
  const COLORS = [
    '#84CC16', // Lime 500
    '#A3E635', // Lime 400
    '#BEF264', // Lime 300
    '#10B981', // Emerald 500
    '#34D399', // Emerald 400
    '#6EE7B7', // Emerald 300
    '#F59E0B', // Amber Gold
    '#FBBF24', // Yellow Gold
    '#E2F952', // Neon Light Green
    '#FFFFFF'  // Pure White Star Sparkle
  ]

  // Spawn a celebratory particle burst from target coordinate
  const triggerBurst = useCallback((customX, customY, particleCount = 65) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const originX = customX !== undefined ? customX : rect.width * originXPercent
    const originY = customY !== undefined ? customY : rect.height * originYPercent

    // 1. Expanding shockwave ring
    particlesRef.current.push({
      type: 'ring',
      x: originX,
      y: originY,
      radius: 12,
      maxRadius: 75,
      color: '#10B981',
      lineWidth: 3.5,
      alpha: 1,
      fadeSpeed: 0.025
    })

    // Secondary smaller bright shockwave ring
    particlesRef.current.push({
      type: 'ring',
      x: originX,
      y: originY,
      radius: 6,
      maxRadius: 45,
      color: '#A3E635',
      lineWidth: 2,
      alpha: 0.9,
      fadeSpeed: 0.035
    })

    // 2. Confetti ribbons, stars, and sparkling dots
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2
      // Bias upward and outward
      const speed = Math.random() * 8.5 + 2.5
      const vx = Math.cos(angle) * speed * (0.8 + Math.random() * 0.4)
      const vy = Math.sin(angle) * speed - (Math.random() * 3.5 + 1.2) // Upward boost

      const typeRandom = Math.random()
      let type = 'confetti'
      if (typeRandom < 0.28) type = 'star'
      else if (typeRandom < 0.52) type = 'spark'
      else if (typeRandom < 0.68) type = 'dollar'

      particlesRef.current.push({
        type,
        x: originX + (Math.random() - 0.5) * 16,
        y: originY + (Math.random() - 0.5) * 12,
        vx,
        vy,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: type === 'star' ? Math.random() * 8 + 6 : Math.random() * 6 + 4,
        width: Math.random() * 8 + 5,
        height: Math.random() * 5 + 3,
        rotation: Math.random() * 360,
        spinSpeed: (Math.random() - 0.5) * 14,
        flipSpeed: Math.random() * 0.12 + 0.04,
        flipAngle: Math.random() * Math.PI,
        gravity: type === 'dollar' ? 0.07 : 0.14,
        drag: 0.972,
        alpha: 1,
        fadeSpeed: Math.random() * 0.012 + 0.010
      })
    }
  }, [originXPercent, originYPercent])

  // Canvas render and animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    // Handle high-DPI retina sharpness
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return

      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    let lastTimestamp = performance.now()

    const render = (now) => {
      const delta = now - lastTimestamp
      lastTimestamp = now

      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1

      // Clear with transparent frame
      ctx.clearRect(0, 0, rect.width, rect.height)

      // Auto cycle burst synced with beam duration
      if (autoTrigger && now - lastBurstTimeRef.current >= cycleDuration) {
        lastBurstTimeRef.current = now
        triggerBurst()
      }

      // Update and draw all active particles
      const activeParticles = []

      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i]
        p.alpha -= p.fadeSpeed

        if (p.alpha <= 0) continue

        ctx.save()
        ctx.globalAlpha = Math.max(0, p.alpha)

        if (p.type === 'ring') {
          p.radius += (p.maxRadius - p.radius) * 0.08
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
          ctx.strokeStyle = p.color
          ctx.lineWidth = p.lineWidth * (p.alpha)
          ctx.shadowColor = p.color
          ctx.shadowBlur = 10
          ctx.stroke()
        } else {
          // Physics update
          p.vx *= p.drag
          p.vy *= p.drag
          p.vy += p.gravity
          p.x += p.vx
          p.y += p.vy
          p.rotation += p.spinSpeed
          p.flipAngle += p.flipSpeed

          ctx.translate(p.x, p.y)
          ctx.rotate((p.rotation * Math.PI) / 180)

          if (p.type === 'confetti') {
            const scaleY = Math.cos(p.flipAngle)
            ctx.scale(1, scaleY)
            ctx.fillStyle = p.color
            ctx.shadowColor = p.color
            ctx.shadowBlur = 4
            ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height)
          } else if (p.type === 'star') {
            // Draw 4-pointed radiant star
            ctx.fillStyle = p.color
            ctx.shadowColor = p.color
            ctx.shadowBlur = 8
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
            ctx.shadowColor = p.color
            ctx.shadowBlur = 6
            ctx.beginPath()
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
            ctx.fill()
          } else if (p.type === 'dollar') {
            ctx.fillStyle = p.color
            ctx.font = 'bold 13px ui-monospace, monospace'
            ctx.shadowColor = p.color
            ctx.shadowBlur = 6
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText('$', 0, 0)
          }
        }

        ctx.restore()
        activeParticles.push(p)
      }

      particlesRef.current = activeParticles
      animFrameRef.current = requestAnimationFrame(render)
    }

    // Initial burst after 5.8 seconds (when the particle first reaches the node)
    const initialTimer = setTimeout(() => {
      triggerBurst()
      lastBurstTimeRef.current = performance.now()
    }, 5800)

    animFrameRef.current = requestAnimationFrame(render)

    return () => {
      clearTimeout(initialTimer)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [cycleDuration, triggerBurst, autoTrigger])

  return (
    <canvas
      ref={canvasRef}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        triggerBurst(e.clientX - rect.left, e.clientY - rect.top, 80)
      }}
      className={`absolute inset-0 w-full h-full pointer-events-auto cursor-pointer z-30 ${className}`}
      title="Click ★ SHIPPED & LIVE to trigger celebration confetti!"
    />
  )
}
