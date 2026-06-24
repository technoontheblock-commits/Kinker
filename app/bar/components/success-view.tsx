'use client'

import { motion } from 'framer-motion'
import { Check, RefreshCw } from 'lucide-react'
import { formatChf } from '@/lib/bar'
import type { PayResult } from './bar-page'

interface SuccessViewProps {
  payResult: PayResult
  onDone: () => void
}

export function SuccessView({ payResult, onDone }: SuccessViewProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-28 h-28 bg-green-500/20 rounded-full flex items-center justify-center mb-6"
      >
        <Check className="w-14 h-14 text-green-500" />
      </motion.div>

      <h2 className="text-4xl md:text-5xl font-display font-bold mb-2">Bezahlt</h2>
      <p className="text-white/60 text-lg mb-8">{payResult.order_number}</p>

      <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-8">
        <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-5">
          <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Bezahlt</p>
          <p className="text-2xl font-display font-bold">{formatChf(payResult.total)}</p>
        </div>
        <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-5">
          <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Restguthaben</p>
          <p className="text-2xl font-display font-bold text-green-400">
            {formatChf(payResult.remaining_balance)}
          </p>
        </div>
      </div>

      {payResult.tip > 0 && (
        <p className="text-white/50 mb-8">
          Inkl. {formatChf(payResult.tip)} Trinkgeld
        </p>
      )}

      <button
        onClick={onDone}
        className="flex items-center gap-2 px-8 py-4 bg-red-500 hover:bg-red-600 rounded-xl font-semibold transition-colors"
      >
        <RefreshCw className="w-5 h-5" />
        Nächster Kunde
      </button>
    </div>
  )
}
