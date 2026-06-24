'use client'

import { Wallet, ArrowUpRight, ArrowDownRight, Minus, CreditCard } from 'lucide-react'
import { formatChf } from '@/lib/bar'

interface WalletViewProps {
  wallet: {
    id: string
    balance: number
    currency: string
    qr_token: string
  } | null
  transactions: {
    id: string
    amount: number
    type: 'top_up' | 'payment' | 'tip' | 'refund' | 'cancel'
    status: 'pending' | 'completed' | 'failed' | 'cancelled'
    description: string | null
    reference: string | null
    created_at: string
  }[]
}

const typeLabels: Record<string, string> = {
  top_up: 'Aufladung',
  payment: 'Bezahlung',
  tip: 'Trinkgeld',
  refund: 'Rückbuchung',
  cancel: 'Storno',
}

export function WalletView({ wallet, transactions }: WalletViewProps) {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-display font-bold mb-6">Wallet</h1>

      {!wallet ? (
        <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-8 text-center">
          <Wallet className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <p className="text-white/60">Kein Wallet gefunden.</p>
        </div>
      ) : (
        <>
          {/* Balance card */}
          <div className="bg-gradient-to-br from-red-500/20 to-neutral-900 border border-white/10 rounded-2xl p-6 md:p-8 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <Wallet className="w-5 h-5 text-red-500" />
              </div>
              <span className="text-white/60 font-medium">Aktuelles Guthaben</span>
            </div>
            <p className="text-5xl md:text-6xl font-display font-bold">
              {formatChf(wallet.balance)}
            </p>
            <p className="text-white/40 text-sm mt-2">Währung: {wallet.currency}</p>
          </div>

          {/* Transactions */}
          <div className="bg-neutral-900/60 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-red-500" />
                Letzte Transaktionen
              </h2>
            </div>

            {transactions.length === 0 ? (
              <div className="p-8 text-center text-white/50">
                Noch keine Transaktionen vorhanden.
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {transactions.map(tx => {
                  const isNegative = tx.type === 'payment' || tx.type === 'tip'
                  const isPositive = tx.type === 'top_up' || tx.type === 'refund'
                  const Icon = isPositive ? ArrowUpRight : isNegative ? ArrowDownRight : Minus
                  const colorClass = isPositive
                    ? 'text-green-400'
                    : isNegative
                    ? 'text-red-400'
                    : 'text-white/60'

                  return (
                    <li key={tx.id} className="px-6 py-4 flex items-start gap-4 hover:bg-white/5 transition-colors">
                      <div className={`mt-1 ${colorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-medium truncate">{typeLabels[tx.type] || tx.type}</p>
                          <p className={`font-display font-bold whitespace-nowrap ${colorClass}`}>
                            {isPositive ? '+' : isNegative ? '-' : ''}
                            {formatChf(tx.amount)}
                          </p>
                        </div>
                        <p className="text-sm text-white/50 truncate">
                          {tx.description || tx.reference || '–'}
                        </p>
                        <p className="text-xs text-white/30 mt-1">
                          {new Date(tx.created_at).toLocaleString('de-CH', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {tx.status !== 'completed' && (
                            <span className="ml-2 capitalize">({tx.status})</span>
                          )}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
