'use client'

import { motion } from 'framer-motion'
import { Clock, Shield, Heart, Users, Volume2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { clubInfo } from '@/lib/data'

const iconMap: { [key: string]: React.ReactNode } = {
  'SAFE SPACE': <Shield className="w-10 h-10" />,
  'NO DISCRIMINATION': <Heart className="w-10 h-10" />,
  'RESPECT & CONSENT': <Users className="w-10 h-10" />,
  'UNDERGROUND CULTURE': <Volume2 className="w-10 h-10" />,
}

export default function ClubPage() {
  return (
    <div className="min-h-screen bg-black pt-24 lg:pt-32">
      {/* Header */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <span className="text-red-500 font-semibold tracking-widest uppercase text-sm mb-4 block">
            About Us
          </span>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter font-display text-white mb-6">
            THE CLUB
          </h1>
          <p className="text-lg md:text-xl text-white/70 leading-relaxed">
            KINKER is more than a nightclub — it&apos;s a cultural institution dedicated to 
            preserving and promoting underground techno culture in Basel. Our mission is 
            to create a space where music, community, and freedom intersect.
          </p>
        </motion.div>
      </section>

      {/* Opening Hours */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="bg-neutral-900/50 rounded-2xl p-8 lg:p-12 border border-white/10"
        >
          <div className="flex items-center gap-4 mb-8">
            <Clock className="w-8 h-8 text-red-500" />
            <h2 className="text-3xl font-bold text-white font-display">Opening Hours</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-black/50 rounded-lg border border-white/5">
              <h3 className="text-red-500 font-semibold mb-2">Friday</h3>
              <p className="text-2xl font-bold text-white">{clubInfo.openingHours.friday}</p>
              <p className="text-white/50 text-sm mt-2">Weekend Kick-off</p>
            </div>
            <div className="p-6 bg-black/50 rounded-lg border border-white/5">
              <h3 className="text-red-500 font-semibold mb-2">Saturday</h3>
              <p className="text-2xl font-bold text-white">{clubInfo.openingHours.saturday}</p>
              <p className="text-white/50 text-sm mt-2">Main Event Night</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Values */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold text-white mb-12 font-display text-center"
        >
          Our Values
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {clubInfo.values.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group p-8 bg-neutral-900/30 rounded-xl border border-white/10 hover:border-red-500/50 transition-all duration-300 hover:bg-neutral-900/50"
            >
              <div className="text-red-500 mb-6 group-hover:scale-110 transition-transform duration-300">
                {iconMap[value.title]}
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 font-display">
                {value.title}
              </h3>
              <p className="text-white/60 leading-relaxed">
                {value.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Entry Rules */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-4 mb-8">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <h2 className="text-3xl font-bold text-white font-display">Entry Rules</h2>
            </div>
            <ul className="space-y-4">
              {clubInfo.entryRules.map((rule, index) => (
                <motion.li
                  key={rule}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-white/80 text-lg">{rule}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-red-500/10 blur-2xl rounded-full" />
            <div className="relative bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <h3 className="text-2xl font-bold text-white mb-4 font-display">
                Important Notice
              </h3>
              <p className="text-white/70 leading-relaxed mb-6">
                We reserve the right to refuse entry to anyone who does not respect our 
                values or follows our rules. Our door selection is in place to maintain 
                the atmosphere and safety of our space. Dress appropriately for an 
                underground techno club.
              </p>
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">
                  <strong>Zero Tolerance Policy:</strong> Any form of discrimination, 
                  harassment, or aggressive behavior will result in immediate removal 
                  from the venue.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold text-white mb-12 font-display"
        >
          Frequently Asked Questions
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {clubInfo.faq.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="p-6 bg-neutral-900/30 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
            >
              <h3 className="text-lg font-bold text-white mb-2">{item.question}</h3>
              <p className="text-white/60 leading-relaxed">{item.answer}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}
