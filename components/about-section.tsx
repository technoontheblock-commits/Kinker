'use client'

import { motion } from 'framer-motion'
import { Heart, Shield, Users, Volume2 } from 'lucide-react'
import { clubInfo } from '@/lib/data'
import { useLanguage } from './language-provider'

const iconMap: { [key: string]: React.ReactNode } = {
  'SAFE SPACE': <Shield className="w-8 h-8" />,
  'NO DISCRIMINATION': <Heart className="w-8 h-8" />,
  'RESPECT & CONSENT': <Users className="w-8 h-8" />,
  'UNDERGROUND CULTURE': <Volume2 className="w-8 h-8" />,
}

export function AboutSection() {
  const { t, language } = useLanguage()

  return (
    <section className="py-24 lg:py-32 bg-neutral-950 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 50px,
            rgba(255,255,255,0.1) 50px,
            rgba(255,255,255,0.1) 51px
          )`,
        }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Main Content */}
        <div className="max-w-4xl mx-auto text-center mb-16 lg:mb-24">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="text-red-500 font-semibold tracking-widest uppercase text-sm mb-4 block"
          >
            {t.home.about.subtitle}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter font-display text-white mb-8"
          >
            MORE THAN
            <br />
            <span className="text-red-500">A CLUB</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-white/70 leading-relaxed"
          >
            {t.home.about.description}
          </motion.p>
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {clubInfo.values.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group p-6 lg:p-8 bg-black/50 border border-white/10 rounded-lg hover:border-red-500/50 transition-colors duration-300"
            >
              <div className="text-red-500 mb-4 group-hover:scale-110 transition-transform duration-300">
                {iconMap[value.title]}
              </div>
              <h3 className="text-xl font-bold text-white mb-2 font-display">
                {value.title}
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                {value.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Quote */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 lg:mt-24 text-center"
        >
          <blockquote className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-white/90 italic">
            &ldquo;The dancefloor is our temple. The music is our prayer.&rdquo;
          </blockquote>
        </motion.div>
      </div>
    </section>
  )
}
