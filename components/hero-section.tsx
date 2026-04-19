'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { useLanguage } from './language-provider'

// ============================================================
// FEATURE FLAGS — Set to false to disable any effect
// ============================================================
const FEATURE_FLAGS = {
  neonGlowPulse: true,      // Red neon glow pulsing around text
  hoverLetterSpacing: true, // Letters spread apart on hover
  hoverGlowIntensify: true, // Neon glow gets stronger on hover
  hover3DTilt: true,        // Text tilts toward mouse position
} as const

// ============================================================
// 3D TILT LOGIC
// ============================================================
function useMouseTilt(ref: React.RefObject<HTMLElement | null>) {
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 })

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current || !FEATURE_FLAGS.hover3DTilt) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    // Range: -8deg to +8deg
    setTilt({
      rotateY: (x - 0.5) * 16,
      rotateX: (0.5 - y) * 16,
    })
  }, [ref])

  const handleMouseLeave = useCallback(() => {
    setTilt({ rotateX: 0, rotateY: 0 })
  }, [])

  return { tilt, handleMouseMove, handleMouseLeave }
}

// ============================================================
// COMPONENT
// ============================================================
export function HeroSection() {
  const { t } = useLanguage()
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const { tilt, handleMouseMove, handleMouseLeave } = useMouseTilt(titleRef)

  const scrollToEvents = () => {
    const eventsSection = document.getElementById('events')
    if (eventsSection) {
      eventsSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Dynamic class assembly
  const titleWrapperClasses = [
    'block',
    'text-white',
    'cursor-default',
    'transition-all',
    'duration-500',
    'ease-out',
    'will-change-transform',
    FEATURE_FLAGS.hoverLetterSpacing && isHovered ? 'tracking-[0.15em]' : 'tracking-tighter',
    FEATURE_FLAGS.neonGlowPulse ? 'neon-glow' : '',
    FEATURE_FLAGS.hoverGlowIntensify && isHovered ? 'hover-glow-intense' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Static Background Image - Club Interior */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110"
          style={{
            backgroundImage: `url('/images/hero-bg.jpg')`,
          }}
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black" />
      </div>

      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        >
          <h1
            ref={titleRef}
            className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold font-display mb-6 inline-block"
            style={{
              perspective: '1000px',
              transformStyle: 'preserve-3d',
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={(e) => {
              handleMouseLeave()
              setIsHovered(false)
            }}
            onMouseEnter={() => setIsHovered(true)}
          >
            <span
              className={titleWrapperClasses}
              style={{
                display: 'inline-block',
                transform: FEATURE_FLAGS.hover3DTilt
                  ? `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale(${isHovered ? 1.05 : 1})`
                  : undefined,
                transformStyle: 'preserve-3d',
              }}
            >
              KINKER
            </span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
          className="text-lg sm:text-xl md:text-2xl text-white/70 font-medium tracking-widest uppercase mb-12"
        >
          No Racism. No Hate. Just Music.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button
            variant="glitch"
            size="lg"
            onClick={scrollToEvents}
            className="text-base px-8 py-6"
          >
            {t.home.hero.viewEvents}
          </Button>
          <Button
            variant="outline"
            size="lg"
            asChild
            className="text-base px-8 py-6 border-white/30 text-white hover:bg-white hover:text-black"
          >
            <Link href="/club">{t.home.hero.aboutClub}</Link>
          </Button>
        </motion.div>
      </div>

      {/* Red Accent Lines */}
      <div className="absolute top-0 left-0 w-1 h-32 bg-red-500 z-20" />
      <div className="absolute bottom-0 right-0 w-1 h-32 bg-red-500 z-20" />
    </section>
  )
}
