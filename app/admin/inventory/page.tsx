'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package,
  ScanLine,
  Search,
  Loader2,
  AlertCircle,
  Check,
  X,
  ArrowRightLeft,
  Plus,
  Minus,
  History,
  Warehouse,
  Wine,
  Pencil,
} from 'lucide-react'
import { BarcodeScanner } from '@/components/inventory/barcode-scanner'
import { cn } from '@/lib/utils'
import type { BarProduct, BarEvent, EventBar, BarInventoryTransaction } from '@/lib/database.types'

type Tab = 'scanner' | 'stock' | 'transactions'
type InventoryAction = 'delivery' | 'transfer_to_bar'

const typeLabels: Record<string, string> = {
  delivery: 'Einbuchen',
  transfer_out: 'Transfer aus Lager',
  transfer_in: 'Transfer zu Bar',
  sale: 'Verkauf',
  correction: 'Korrektur',
}

const typeColors: Record<string, string> = {
  delivery: 'text-green-400 bg-green-500/20',
  transfer_out: 'text-yellow-400 bg-yellow-500/20',
  transfer_in: 'text-blue-400 bg-blue-500/20',
  sale: 'text-red-400 bg-red-500/20',
  correction: 'text-purple-400 bg-purple-500/20',
}

interface StockItem {
  product: BarProduct
  warehouse: number
  bars: { bar: EventBar; quantity: number }[]
  total: number
}

interface EventWithBars extends BarEvent {
  event_bars: EventBar[]
}

interface TransactionWithRelations extends BarInventoryTransaction {
  product?: BarProduct
  bar?: EventBar | null
  event?: BarEvent | null
}

const categoryLabels: Record<string, string> = {
  drink: 'Getränk',
  shot: 'Shot',
  snack: 'Snack',
  other: 'Sonstiges',
}

export default function InventoryAdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('scanner')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [stock, setStock] = useState<StockItem[]>([])
  const [events, setEvents] = useState<EventWithBars[]>([])
  const [transactions, setTransactions] = useState<TransactionWithRelations[]>([])
  const [transactionFilter, setTransactionFilter] = useState({ type: '', barId: '' })

  const [action, setAction] = useState<InventoryAction>('delivery')
  const [selectedBarId, setSelectedBarId] = useState<string>('')
  const [isScanning, setIsScanning] = useState(false)
  const [manualBarcode, setManualBarcode] = useState('')
  const [scannedProduct, setScannedProduct] = useState<BarProduct | null>(null)
  const [scannedStock, setScannedStock] = useState<{ warehouse: number; bars: Record<string, number>; total: number } | null>(null)
  const [quantity, setQuantity] = useState<string>('1')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [correctionProduct, setCorrectionProduct] = useState<StockItem | null>(null)
  const [correctionBarId, setCorrectionBarId] = useState<string>('warehouse')
  const [correctionQuantity, setCorrectionQuantity] = useState('')
  const [correctionNotes, setCorrectionNotes] = useState('')
  const [correctionSubmitting, setCorrectionSubmitting] = useState(false)

  const manualInputRef = useRef<HTMLInputElement>(null)

  const loadStock = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/inventory/stock')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Laden')
      setStock(data.stock || [])
    } catch (err: any) {
      setError(err.message)
    }
  }, [])

  const loadEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/bar-reports')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Laden')
      setEvents(data.events || [])
    } catch (err: any) {
      setError(err.message)
    }
  }, [])

  const loadTransactions = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (transactionFilter.type) params.set('type', transactionFilter.type)
      if (transactionFilter.barId) params.set('barId', transactionFilter.barId)
      const res = await fetch(`/api/admin/inventory/transactions?${params.toString()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Laden')
      setTransactions(data.transactions || [])
    } catch (err: any) {
      setError(err.message)
    }
  }, [transactionFilter])

  useEffect(() => {
    async function init() {
      setLoading(true)
      await Promise.all([loadStock(), loadEvents(), loadTransactions()])
      setLoading(false)
    }
    init()
  }, [loadStock, loadEvents, loadTransactions])

  const allBars = useMemo(() => {
    return events.flatMap(e => e.event_bars || []).filter(b => b.active)
  }, [events])

  const activeEvents = useMemo(() => events.filter(e => e.status === 'active' || e.status === 'upcoming'), [events])

  const handleBarcode = useCallback(async (barcode: string) => {
    setError(null)
    setScannedProduct(null)
    setScannedStock(null)
    setSuccessMessage(null)
    try {
      const res = await fetch(`/api/admin/inventory/products?barcode=${encodeURIComponent(barcode)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Produkt nicht gefunden')
      setScannedProduct(data.product)
      setScannedStock(data.stock)
      setQuantity('1')
      if (manualInputRef.current) manualInputRef.current.value = ''
    } catch (err: any) {
      setError(err.message)
    }
  }, [])

  const handleManualSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const value = e.currentTarget.value.trim()
      if (value) handleBarcode(value)
    }
  }

  const resetScanner = useCallback(() => {
    setScannedProduct(null)
    setScannedStock(null)
    setQuantity('1')
    setNotes('')
    setSuccessMessage(null)
    setManualBarcode('')
    if (manualInputRef.current) manualInputRef.current.value = ''
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scannedProduct) return
    const qty = parseInt(quantity, 10)
    if (!Number.isInteger(qty) || qty <= 0) {
      setError('Menge muss eine positive Ganzzahl sein')
      return
    }
    if (action === 'transfer_to_bar' && !selectedBarId) {
      setError('Bitte eine Bar auswählen')
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: scannedProduct.id,
          type: action,
          quantity: qty,
          barId: action === 'transfer_to_bar' ? selectedBarId : undefined,
          notes: notes.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Buchen')
      setSuccessMessage(`${scannedProduct.name} × ${qty} erfolgreich gebucht`)
      await loadStock()
      await loadTransactions()
      setTimeout(() => resetScanner(), 1200)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!correctionProduct) return
    const qty = parseInt(correctionQuantity, 10)
    if (!Number.isInteger(qty) || qty === 0) {
      setError('Korrektur muss eine von 0 verschiedene Ganzzahl sein')
      return
    }
    setCorrectionSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: correctionProduct.product.id,
          type: 'correction',
          quantity: qty,
          barId: correctionBarId === 'warehouse' ? null : correctionBarId,
          notes: correctionNotes.trim() || `Korrektur ${qty > 0 ? '+' : '-'}${Math.abs(qty)}`,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Buchen')
      await loadStock()
      await loadTransactions()
      setCorrectionProduct(null)
      setCorrectionBarId('warehouse')
      setCorrectionQuantity('')
      setCorrectionNotes('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCorrectionSubmitting(false)
    }
  }

  const filteredStock = useMemo(() => {
    // currently no additional filter beyond the search string below
    return stock
  }, [stock])

  const [stockSearch, setStockSearch] = useState('')
  const displayedStock = useMemo(() => {
    const term = stockSearch.toLowerCase()
    return filteredStock.filter(s =>
      s.product.name.toLowerCase().includes(term) ||
      (s.product.barcode && s.product.barcode.toLowerCase().includes(term))
    )
  }, [filteredStock, stockSearch])

  const renderScanner = () => (
    <div className="max-w-md mx-auto space-y-6">
      <div className="bg-neutral-900/50 border border-white/10 rounded-xl p-4">
        <label className="block text-white/70 text-sm mb-3">Aktion</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setAction('delivery')}
            className={cn(
              'px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2',
              action === 'delivery'
                ? 'bg-red-500 text-white'
                : 'bg-black/50 text-white/70 hover:bg-white/5'
            )}
          >
            <Plus className="w-4 h-4" /> Einbuchen
          </button>
          <button
            type="button"
            onClick={() => setAction('transfer_to_bar')}
            className={cn(
              'px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2',
              action === 'transfer_to_bar'
                ? 'bg-red-500 text-white'
                : 'bg-black/50 text-white/70 hover:bg-white/5'
            )}
          >
            <ArrowRightLeft className="w-4 h-4" /> Zu Bar
          </button>
        </div>
      </div>

      {action === 'transfer_to_bar' && (
        <div className="bg-neutral-900/50 border border-white/10 rounded-xl p-4">
          <label className="block text-white/70 text-sm mb-3">Bar</label>
          <select
            value={selectedBarId}
            onChange={e => setSelectedBarId(e.target.value)}
            className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
          >
            <option value="">Bar wählen...</option>
            {activeEvents.map(event => (
              <optgroup key={event.id} label={event.name}>
                {(event.event_bars || []).filter(b => b.active).map(bar => (
                  <option key={bar.id} value={bar.id}>{bar.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      )}

      <div className="bg-neutral-900/50 border border-white/10 rounded-xl p-4">
        <label className="block text-white/70 text-sm mb-3">Barcode</label>
        <BarcodeScanner
          onScan={handleBarcode}
          isScanning={isScanning}
          setIsScanning={setIsScanning}
        />
        <div className="mt-3">
          <input
            ref={manualInputRef}
            type="text"
            placeholder="Barcode manuell eingeben..."
            defaultValue={manualBarcode}
            onKeyDown={handleManualSubmit}
            className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500 transition-colors font-mono"
          />
        </div>
      </div>

      <AnimatePresence>
        {scannedProduct && scannedStock && (
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onSubmit={handleSubmit}
            className="bg-neutral-900/50 border border-white/10 rounded-xl p-4 space-y-4"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                <Wine className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-white font-semibold">{scannedProduct.name}</h3>
                <p className="text-white/60 text-sm">{categoryLabels[scannedProduct.category]}</p>
                <p className="text-white/40 text-xs font-mono mt-1">{scannedProduct.barcode}</p>
                <div className="flex gap-3 mt-2 text-sm">
                  <span className="text-white/70">Lager: <span className={cn(scannedStock.warehouse < 0 && 'text-red-400')}>{scannedStock.warehouse}</span></span>
                  <span className="text-white/70">Total: <span className={cn(scannedStock.total < 0 && 'text-red-400')}>{scannedStock.total}</span></span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">Menge</label>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">Bemerkung (optional)</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500 transition-colors"
                placeholder="z. B. Lieferant XY"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {action === 'delivery' ? 'Ins Lager einbuchen' : 'Zu Bar ausbuchen'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl text-sm flex items-center gap-2"
          >
            <Check className="w-4 h-4" /> {successMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  const renderStock = () => (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="text"
          placeholder="Produkt oder Barcode suchen..."
          value={stockSearch}
          onChange={e => setStockSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-neutral-900/50 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-red-500 transition-colors"
        />
      </div>

      <div className="bg-neutral-900/50 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black/30">
              <tr>
                <th className="text-left px-6 py-4 text-white/60 text-sm font-medium">Produkt</th>
                <th className="text-left px-6 py-4 text-white/60 text-sm font-medium">Barcode</th>
                <th className="text-left px-6 py-4 text-white/60 text-sm font-medium">Lager</th>
                <th className="text-left px-6 py-4 text-white/60 text-sm font-medium">Bars</th>
                <th className="text-left px-6 py-4 text-white/60 text-sm font-medium">Total</th>
                <th className="text-right px-6 py-4 text-white/60 text-sm font-medium">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {displayedStock.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-white/40">
                    Keine Produkte gefunden
                  </td>
                </tr>
              ) : (
                displayedStock.map(item => (
                  <tr key={item.product.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-white font-medium">
                      {item.product.name}
                      <p className="text-white/50 text-xs font-normal">{categoryLabels[item.product.category]}</p>
                    </td>
                    <td className="px-6 py-4 text-white/70 font-mono text-xs">{item.product.barcode || '—'}</td>
                    <td className={cn('px-6 py-4 font-medium', item.warehouse < 0 && 'text-red-400')}>
                      {item.warehouse}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {item.bars.length === 0 ? (
                          <span className="text-white/40 text-sm">—</span>
                        ) : (
                          item.bars.map(({ bar, quantity }) => (
                            <span
                              key={bar.id}
                              className={cn(
                                'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs',
                                quantity < 0 ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/70'
                              )}
                            >
                              {bar.name}: {quantity}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className={cn('px-6 py-4 font-medium', item.total < 0 && 'text-red-400')}>
                      {item.total}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setCorrectionProduct(item)
                          setCorrectionBarId('warehouse')
                          setCorrectionQuantity('')
                          setCorrectionNotes('')
                        }}
                        className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {correctionProduct && (
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
              className="bg-neutral-900 rounded-2xl p-6 md:p-8 w-full max-w-md border border-white/10"
            >
              <h2 className="text-2xl font-display font-bold text-white mb-2">
                Korrektur
              </h2>
              <p className="text-white/60 text-sm mb-6">{correctionProduct.product.name}</p>
              <form onSubmit={handleCorrectionSubmit} className="space-y-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">Ort</label>
                  <select
                    value={correctionBarId}
                    onChange={e => setCorrectionBarId(e.target.value)}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
                  >
                    <option value="warehouse">Lager</option>
                    {correctionProduct.bars.map(({ bar }) => (
                      <option key={bar.id} value={bar.id}>{bar.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Menge (positiv = rein, negativ = raus)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    autoFocus
                    value={correctionQuantity}
                    onChange={e => setCorrectionQuantity(e.target.value)}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
                    placeholder="z. B. -5 oder 10"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Bemerkung</label>
                  <input
                    type="text"
                    value={correctionNotes}
                    onChange={e => setCorrectionNotes(e.target.value)}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500 transition-colors"
                    placeholder="Grund für Korrektur"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCorrectionProduct(null)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={correctionSubmitting}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {correctionSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Buchen
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  const renderTransactions = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={transactionFilter.type}
          onChange={e => setTransactionFilter(f => ({ ...f, type: e.target.value }))}
          className="px-4 py-3 bg-neutral-900/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500 transition-colors"
        >
          <option value="">Alle Typen</option>
          <option value="delivery">Einbuchen</option>
          <option value="transfer_out">Transfer aus Lager</option>
          <option value="transfer_in">Transfer zu Bar</option>
          <option value="sale">Verkauf</option>
          <option value="correction">Korrektur</option>
        </select>
        <select
          value={transactionFilter.barId}
          onChange={e => setTransactionFilter(f => ({ ...f, barId: e.target.value }))}
          className="px-4 py-3 bg-neutral-900/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500 transition-colors"
        >
          <option value="">Alle Orte</option>
          <option value="null">Lager</option>
          {allBars.map(bar => (
            <option key={bar.id} value={bar.id}>{bar.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-neutral-900/50 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black/30">
              <tr>
                <th className="text-left px-6 py-4 text-white/60 text-sm font-medium">Zeit</th>
                <th className="text-left px-6 py-4 text-white/60 text-sm font-medium">Produkt</th>
                <th className="text-left px-6 py-4 text-white/60 text-sm font-medium">Typ</th>
                <th className="text-left px-6 py-4 text-white/60 text-sm font-medium">Menge</th>
                <th className="text-left px-6 py-4 text-white/60 text-sm font-medium">Ort</th>
                <th className="text-left px-6 py-4 text-white/60 text-sm font-medium">Bemerkung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-white/40">
                    Keine Bewegungen gefunden
                  </td>
                </tr>
              ) : (
                transactions.map(t => (
                  <tr key={t.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-white/70 text-sm">
                      {new Date(t.created_at).toLocaleString('de-CH')}
                    </td>
                    <td className="px-6 py-4 text-white font-medium">
                      {t.product?.name || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn('inline-flex items-center px-2 py-1 rounded-md text-xs font-medium', typeColors[t.type] || 'bg-white/10 text-white/70')}>
                        {typeLabels[t.type] || t.type}
                      </span>
                    </td>
                    <td className={cn('px-6 py-4 font-medium', t.quantity_change < 0 ? 'text-red-400' : 'text-green-400')}>
                      {t.quantity_change > 0 ? `+${t.quantity_change}` : t.quantity_change}
                    </td>
                    <td className="px-6 py-4 text-white/70 text-sm">
                      {t.bar ? t.bar.name : 'Lager'}
                    </td>
                    <td className="px-6 py-4 text-white/50 text-sm">
                      {t.notes || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white">Inventar</h1>
          <p className="text-white/50 mt-1">
            Getränke einbuchen, zu Bars transferieren und Bestände verfolgen
          </p>
        </motion.div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'scanner', label: 'Scanner', icon: ScanLine },
            { id: 'stock', label: 'Bestand', icon: Warehouse },
            { id: 'transactions', label: 'Bewegungen', icon: History },
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  'flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'bg-red-500 text-white'
                    : 'bg-neutral-900/50 text-white/70 hover:bg-white/5 border border-white/10'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-500/20 border border-red-500/40 rounded-xl text-red-200 flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
              </span>
              <button onClick={() => setError(null)} className="text-red-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'scanner' && renderScanner()}
          {activeTab === 'stock' && renderStock()}
          {activeTab === 'transactions' && renderTransactions()}
        </motion.div>
      </div>
    </div>
  )
}
