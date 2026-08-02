'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { X, Search, Check, Loader2, Minus, Plus } from 'lucide-react'

interface BarProductMinimal {
  id: string
  name: string
  category: string
  active: boolean
  sort_order: number
}

interface BarStockRecord {
  id: string
  event_id: string
  bar_id: string
  product_id: string
  initial_stock: number | null
  initial_submitted_at: string | null
  initial_submitted_by: string | null
  final_stock: number | null
  final_submitted_at: string | null
  final_submitted_by: string | null
}

interface StockModalProps {
  open: boolean
  eventId: string | null
  barId: string | null
  barName: string
  type: 'initial' | 'final'
  onClose: () => void
}

export default function StockModal({
  open,
  eventId,
  barId,
  barName,
  type,
  onClose,
}: StockModalProps) {
  const [products, setProducts] = useState<BarProductMinimal[]>([])
  const [records, setRecords] = useState<BarStockRecord[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setProducts([])
    setRecords([])
    setValues({})
    setSearch('')
    setError(null)
  }, [])

  useEffect(() => {
    if (!open || !eventId || !barId) {
      reset()
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`/api/admin/bar-events/${eventId}/stock?barId=${barId}`)
      .then(async res => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Fehler beim Laden')
        if (cancelled) return
        setProducts(data.products || [])
        setRecords(data.stocks || [])
        const initialValues: Record<string, string> = {}
        for (const product of data.products || []) {
          const record = (data.stocks || []).find((s: BarStockRecord) => s.product_id === product.id)
          const value = type === 'initial' ? record?.initial_stock : record?.final_stock
          initialValues[product.id] = value != null ? String(value) : '0'
        }
        setValues(initialValues)
      })
      .catch(err => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, eventId, barId, type, reset])

  const submittedRecord = records.find(
    r =>
      r.bar_id === barId &&
      (type === 'initial' ? r.initial_submitted_at != null : r.final_submitted_at != null)
  )
  const submittedAt =
    type === 'initial'
      ? submittedRecord?.initial_submitted_at ?? null
      : submittedRecord?.final_submitted_at ?? null
  const isSubmitted = submittedAt != null

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  const submit = async () => {
    if (!eventId || !barId) return
    setSaving(true)
    setError(null)

    try {
      const stocks: Record<string, number> = {}
      for (const product of products) {
        const raw = values[product.id]
        const value = raw === '' ? 0 : parseInt(raw, 10)
        if (Number.isNaN(value) || value < 0) {
          throw new Error(`Ungültige Flaschenanzahl bei ${product.name}`)
        }
        stocks[product.id] = value
      }

      const res = await fetch(`/api/admin/bar-events/${eventId}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barId, type, stocks }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Speichern')

      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-neutral-900 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-white/10"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div>
              <h2 className="text-2xl font-display font-bold text-white">
                {type === 'initial' ? 'Anfangsstock' : 'Endstock'}
              </h2>
              <p className="text-white/60 text-sm">{barName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            {isSubmitted && submittedAt && (
              <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg text-sm flex items-center gap-2">
                <Check className="w-4 h-4" />
                Bereits erfasst am {new Date(submittedAt).toLocaleString('de-CH')}. Eine Änderung ist nicht mehr möglich.
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center gap-2 text-white/60 py-12">
                <Loader2 className="w-5 h-5 animate-spin" />
                Lade Produkte...
              </div>
            ) : (
              <div>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="Getränk suchen..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    disabled={isSubmitted}
                    className="w-full pl-10 pr-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500 transition-colors disabled:opacity-50"
                  />
                </div>

                {filteredProducts.length === 0 ? (
                  <p className="text-white/50 text-sm">Keine Produkte gefunden.</p>
                ) : (
                  <table className="w-full text-left">
                    <thead className="bg-black/50 text-white/60 text-sm">
                      <tr>
                        <th className="px-4 py-3 font-medium">Produkt</th>
                        <th className="px-4 py-3 font-medium text-right w-32">Flaschen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredProducts.map(product => (
                        <tr key={product.id} className="hover:bg-white/5">
                          <td className="px-4 py-3 text-white">{product.name}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center bg-black border border-white/10 rounded-lg overflow-hidden">
                              <button
                                type="button"
                                onClick={() => {
                                  const current = parseInt(values[product.id] || '0', 10)
                                  if (current > 0) {
                                    setValues(prev => ({ ...prev, [product.id]: String(current - 1) }))
                                  }
                                }}
                                disabled={isSubmitted}
                                className="px-2.5 py-2 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-40 transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={values[product.id] ?? '0'}
                                onChange={e => {
                                  const val = e.target.value
                                  if (val === '' || /^\d*$/.test(val)) {
                                    setValues(prev => ({ ...prev, [product.id]: val }))
                                  }
                                }}
                                disabled={isSubmitted}
                                className="w-12 px-1 py-2 bg-transparent text-white text-center focus:outline-none disabled:opacity-50"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const current = parseInt(values[product.id] || '0', 10)
                                  setValues(prev => ({ ...prev, [product.id]: String(current + 1) }))
                                }}
                                disabled={isSubmitted}
                                className="px-2.5 py-2 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-40 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
            >
              {isSubmitted ? 'Schliessen' : 'Abbrechen'}
            </button>
            {!isSubmitted && (
              <button
                type="button"
                onClick={submit}
                disabled={saving || loading}
                className="px-5 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Speichern
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
