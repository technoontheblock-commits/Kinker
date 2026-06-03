'use client'

import { Suspense } from 'react'
import { motion } from 'framer-motion'
import { Check, Mail, ArrowRight } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function SuccessContent() {
  const searchParams = useSearchParams()
  const cardNumber = searchParams.get('card')
  const viewUrl = searchParams.get('url')

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-400 rounded-full flex items-center justify-center mx-auto mb-8"
          >
            <Check className="w-10 h-10 text-white" />
          </motion.div>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Vielen Dank!
          </h1>
          <p className="text-white/60 text-lg mb-8">
            Deine Bonuscard wurde erfolgreich erstellt.
          </p>

          <div className="bg-neutral-900 rounded-2xl p-6 border border-white/10 mb-8">
            <p className="text-white/40 text-sm mb-2">Kartennummer</p>
            <p className="text-white font-mono text-lg">{cardNumber || '---'}</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-neutral-900/50 rounded-xl p-4 border border-white/5">
              <Mail className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-white/80 text-sm text-left">
                Wir haben dir eine E-Mail mit deiner digitalen Karte geschickt.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-neutral-900/50 rounded-xl p-4 border border-white/5">
              <ArrowRight className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-white/80 text-sm text-left">
                Die Karte wird nach Zahlungseingang aktiviert.
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            {viewUrl && (
              <Link
                href={decodeURIComponent(viewUrl)}
                className="block w-full py-4 bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold rounded-xl transition-all"
              >
                Karte anzeigen
              </Link>
            )}
            <Link
              href="/"
              className="block w-full py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition-all"
            >
              Zurück zur Startseite
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function BonusCardSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black pt-20 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
