'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Minus, Plus, ShoppingCart, ArrowRight, X } from 'lucide-react'
import type { BarProduct } from '@/lib/database.types'
import { cn } from '@/lib/utils'
import { formatChf } from '@/lib/bar'
import type { Customer } from '@/components/bar/types'
import type { OrderItem } from './bar-page'

interface OrderMenuProps {
  customer: Customer
  products: BarProduct[]
  onConfirm: (items: OrderItem[]) => void
  onCancel: () => void
}

export function OrderMenu({ customer, products, onConfirm, onCancel }: OrderMenuProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  const items: OrderItem[] = useMemo(() => {
    return Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => {
        const product = products.find(p => p.id === productId)
        return {
          productId,
          name: product?.name || 'Unbekannt',
          price: Number(product?.price || 0),
          quantity,
        }
      })
  }, [quantities, products])

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [items])

  const hasEnoughBalance = subtotal <= customer.balance

  const updateQuantity = (productId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[productId] || 0
      const next = Math.max(0, current + delta)
      if (next === 0) {
        const { [productId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [productId]: next }
    })
  }

  const setQuantity = (productId: string, value: number) => {
    const qty = Math.max(0, Math.floor(value))
    setQuantities(prev => {
      if (qty === 0) {
        const { [productId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [productId]: qty }
    })
  }

  const grouped = useMemo(() => {
    const groups: Record<string, BarProduct[]> = {}
    for (const product of products) {
      if (!groups[product.category]) groups[product.category] = []
      groups[product.category].push(product)
    }
    return groups
  }, [products])

  const categoryLabels: Record<string, string> = {
    drink: 'Getränke',
    shot: 'Shots',
    snack: 'Snacks',
    other: 'Sonstiges',
  }

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto px-4 pt-4 pb-24">
      {/* Customer header */}
      <div className="mb-4 p-4 bg-neutral-900/60 border border-white/10 rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Kunde</p>
            <h2 className="text-2xl font-display font-bold">{customer.firstName}</h2>
          </div>
          <div className="text-right">
            <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Guthaben</p>
            <p className={cn(
              'text-2xl font-display font-bold',
              hasEnoughBalance ? 'text-white' : 'text-red-400'
            )}>
              {formatChf(customer.balance)}
            </p>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        {Object.entries(grouped).map(([category, categoryProducts]) => (
          <div key={category}>
            <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-3 sticky top-0 bg-black/95 py-1">
              {categoryLabels[category] || category}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {categoryProducts.map(product => {
                const qty = quantities[product.id] || 0
                return (
                  <motion.div
                    key={product.id}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      'relative p-4 rounded-2xl border transition-colors select-none',
                      qty > 0
                        ? 'bg-red-500/10 border-red-500/40'
                        : 'bg-neutral-900/40 border-white/10 hover:border-white/20'
                    )}
                  >
                    <div className="mb-3">
                      <p className="font-medium text-white leading-tight">{product.name}</p>
                      <p className="text-red-400 font-display font-semibold mt-1">
                        {formatChf(Number(product.price))}
                      </p>
                    </div>

                    {qty === 0 ? (
                      <button
                        onClick={() => updateQuantity(product.id, 1)}
                        className="w-full py-2 bg-white/5 hover:bg-red-500 hover:text-white text-white/80 rounded-xl font-medium transition-colors"
                      >
                        Hinzufügen
                      </button>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => updateQuantity(product.id, -1)}
                          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <input
                          type="number"
                          min={0}
                          value={qty}
                          onChange={e => setQuantity(product.id, parseInt(e.target.value) || 0)}
                          className="w-12 text-center bg-transparent font-display font-bold text-lg focus:outline-none"
                        />
                        <button
                          onClick={() => updateQuantity(product.id, 1)}
                          className="p-2 rounded-xl bg-red-500 hover:bg-red-600 transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-black/95 border-t border-white/10 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button
            onClick={onCancel}
            className="p-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/50 text-sm flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                {items.reduce((sum, i) => sum + i.quantity, 0)} Artikel
              </span>
              <span className="text-xl font-display font-bold">
                {formatChf(subtotal)}
              </span>
            </div>
            {!hasEnoughBalance && (
              <p className="text-red-400 text-xs">Guthaben reicht nicht aus</p>
            )}
          </div>

          <button
            onClick={() => onConfirm(items)}
            disabled={items.length === 0 || !hasEnoughBalance}
            className={cn(
              'flex items-center gap-2 px-6 py-4 rounded-xl font-semibold transition-colors',
              items.length === 0 || !hasEnoughBalance
                ? 'bg-white/10 text-white/40 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600 text-white'
            )}
          >
            Bestätigen
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
