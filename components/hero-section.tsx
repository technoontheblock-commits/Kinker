'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { useLanguage } from './language-provider'

// ============================================================
// FEATURE FLAGS — Set to false to disable any effect
// ============================================================
const FEATURE_FLAGS = {
  neonGlowPulse: true,   // Idea 1: Red neon glow pulsing around text
  textScramble: true,    // Idea 3: Characters decode from random symbols
  strobeFlash: true,     // Idea 8: White flash on initial page load
} as const

// ============================================================
// IDEA 3: Text Scramble / Decode Effect
// ============================================================
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/~`'

function useTextScramble(targetText: string, enabled: boolean, delayMs = 500) {
  const [display, setDisplay] = useState(targetText)
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setDisplay(targetText)
      setIsDone(true)
      return
    }

    setDisplay(targetText)
    setIsDone(false)

    const timeout = setTimeout(() => {
      let iteration = 0
      const maxIterations = targetText.length * 8 // Total scramble cycles

      const interval = setInterval(() => {
        setDisplay(
          targetText
            .split('')
            .map((char, index) => {
              // Reveal characters left-to-right based on iteration
              if (char === ' ') return ' '
              if (index < iteration / 8) return targetText[index]
              return CHARS[Math.floor(Math.random() * CHARS.length)]
            })
            .join('')
        )

        iteration += 1
        if (iteration >= maxIterations) {
          clearInterval(interval)
          setDisplay(targetText)
          setIsDone(true)
        }
      }, 30)

      return () => clearInterval(interval)
    }, delayMs)

    return () => clearTimeout(timeout)
  }, [targetText, enabled, delayMs])

  return { display, isDone }
}

// ============================================================
// COMPONENT
// ============================================================
export function HeroSection() {
  const { t } = useLanguage()

  // Strobe flash state — only fires once per session
  const [strobeActive, setStrobeActive] = useState(false)

  useEffect(() => {
    if (FEATURE_FLAGS.strobeFlash) {
      // Small delay so the flash is noticeable after paint
      const timer = setTimeout(() => setStrobeActive(true), 50)
      return () => clearTimeout(timer)
    }
  }, [])

  const { display: scrambledText, isDone: scrambleDone } = useTextScramble(
    'KINKER',
    FEATURE_FLAGS.textScramble,
    600
  )

  const scrollToEvents = () => {
    const eventsSection = document.getElementById('events')
    if (eventsSection) {
      eventsSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Build title classes dynamically based on feature flags
  const titleClasses = [
    'block',
    'text-white',
    'glitch',
    FEATURE_FLAGS.neonGlowPulse && scrambleDone ? 'neon-glow' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* ============================================================
          IDEA 8: Strobe Flash Overlay
          ============================================================ */}
      {FEATURE_FLAGS.strobeFlash && strobeActive && (
        <div className="fixed inset-0 bg-white z-[100] strobe-overlay" />
      )}

      {/* Static Background Image - Club Interior */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110"
          style={{
            backgroundImage: `url('/images/hero-bg.jpg')`,
          }}
        />
        {/* Dark overlay for better text readability */}
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
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tighter font-display mb-6">
            <span className={titleClasses} data-text="KINKER">
              {scrambledText}
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
