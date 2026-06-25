'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Wallet, CreditCard, Smartphone, ArrowRight } from 'lucide-react'

export function WalletPromoSection() {
  return (
    <section className="py-20 lg:py-28 bg-black relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="max-w-5xl mx-auto"
        >
          <div className="bg-gradient-to-br from-red-500/20 via-neutral-900 to-neutral-900 border border-white/10 rounded-3xl p-8 md:p-12 lg:p-16 overflow-hidden relative">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center">
              <div>
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-red-500 font-semibold tracking-widest uppercase text-sm mb-4 block"
                >
                  Neu bei KINKER
                </motion.span>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter font-display text-white mb-6"
                >
                  Cashless.
                  <br />
                  <span className="text-red-500">Schneller. Einfacher.</span>
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-white/70 text-lg leading-relaxed mb-8"
                >
                  Lade dein Wallet vor dem Event bequem online auf und bezahle
                  an der Bar blitzschnell per QR-Code, ganz ohne Bargeld und
                  ohne Wartezeit. Falls du dein Handy nicht dabei hast, kannst
                  du Guthaben auch an der Abendkasse mit Bargeld oder Karte
                  aufladen.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <Link
                    href="/dashboard/wallet"
                    className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors font-semibold"
                  >
                    <Wallet className="w-5 h-5" />
                    Guthaben aufladen
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/membership"
                    className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors font-semibold"
                  >
                    <Smartphone className="w-5 h-5" />
                    Member werden
                  </Link>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-black/50 border border-white/10 rounded-2xl p-6 hover:border-red-500/50 transition-colors"
                >
                  <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mb-4">
                    <CreditCard className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Online aufladen</h3>
                  <p className="text-white/60 text-sm">
                    Wähle deinen Betrag und lade dein Wallet per Karte auf,
                    sicher über SumUp.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="bg-black/50 border border-white/10 rounded-2xl p-6 hover:border-red-500/50 transition-colors"
                >
                  <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mb-4">
                    <Smartphone className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Per QR bezahlen</h3>
                  <p className="text-white/60 text-sm">
                    Zeig einfach deinen Wallet QR Code an der Bar vor, fertig.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="bg-black/50 border border-white/10 rounded-2xl p-6 hover:border-red-500/50 transition-colors sm:col-span-2"
                >
                  <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mb-4">
                    <Wallet className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Immer den Überblick</h3>
                  <p className="text-white/60 text-sm">
                    Behalt dein Guthaben und alle Transaktionen jederzeit in
                    deinem Dashboard im Blick.
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
