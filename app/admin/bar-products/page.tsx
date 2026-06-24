'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Pencil, Trash2, Wine, Package, Check, X, Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BarProduct } from '@/lib/database.types'

const categoryLabels: Record<string, string> = {
  drink: 'Getränk',
  shot: 'Shot',
  snack: 'Snack',
  other: 'Sonstiges',
}

const categoryOptions = [
  { value: 'drink', label: 'Getränk' },
  { value: 'shot', label: 'Shot' },
  { value: 'snack', label: 'Snack' },
  { value: 'other', label: 'Sonstiges' },
]

interface ProductFormData {
  name: string
  price: string
  category: 'drink' | 'shot' | 'snack' | 'other'
  sort_order: string
  active: boolean
}

const emptyForm: ProductFormData = {
  name: '',
  price: '',
  category: 'drink',
  sort_order: '0',
  active: true,
}

export default function BarProductsAdminPage() {
  const [products, setProducts] = useState<BarProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<BarProduct | null>(null)
  const [form, setForm] = useState<ProductFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/bar-products')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Laden')
      setProducts(data.products || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const filteredProducts = useMemo(() => {
    const term = search.toLowerCase()
    return products.filter(p =>
      p.name.toLowerCase().includes(term) ||
      categoryLabels[p.category]?.toLowerCase().includes(term)
    )
  }, [products, search])

  const openAdd = () => {
    setEditingProduct(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (product: BarProduct) => {
    setEditingProduct(product)
    setForm({
      name: product.name,
      price: Number(product.price).toFixed(2),
      category: product.category,
      sort_order: product.sort_order.toString(),
      active: product.active,
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingProduct(null)
    setForm(emptyForm)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const payload = {
        name: form.name.trim(),
        price: parseFloat(form.price),
        category: form.category,
        sort_order: parseInt(form.sort_order || '0', 10),
        active: form.active,
      }

      const url = editingProduct
        ? `/api/bar-products/${editingProduct.id}`
        : '/api/bar-products'

      const res = await fetch(url, {
        method: editingProduct ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Speichern')

      await fetchProducts()
      closeModal()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (product: BarProduct) => {
    try {
      const res = await fetch(`/api/bar-products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !product.active }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Fehler')
      }
      await fetchProducts()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDelete = async (product: BarProduct) => {
    if (!window.confirm(`„${product.name}" wirklich löschen?`)) return

    try {
      const res = await fetch(`/api/bar-products/${product.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Fehler beim Löschen')
      }
      await fetchProducts()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
    }).format(Number(price))
  }

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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white">
              Bar Produkte
            </h1>
            <p className="text-white/50 mt-1">
              Produkte verwalten, die an der Bar verkauft werden
            </p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Produkt hinzufügen
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-neutral-900/50 border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-5 h-5 text-red-500" />
              <span className="text-white/50 text-sm">Total</span>
            </div>
            <p className="text-2xl font-display font-bold">{products.length}</p>
          </div>
          <div className="bg-neutral-900/50 border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Wine className="w-5 h-5 text-green-500" />
              <span className="text-white/50 text-sm">Aktiv</span>
            </div>
            <p className="text-2xl font-display font-bold">
              {products.filter(p => p.active).length}
            </p>
          </div>
          <div className="bg-neutral-900/50 border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Wine className="w-5 h-5 text-yellow-500" />
              <span className="text-white/50 text-sm">Getränke</span>
            </div>
            <p className="text-2xl font-display font-bold">
              {products.filter(p => p.category === 'drink').length}
            </p>
          </div>
          <div className="bg-neutral-900/50 border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Wine className="w-5 h-5 text-blue-500" />
              <span className="text-white/50 text-sm">Shots</span>
            </div>
            <p className="text-2xl font-display font-bold">
              {products.filter(p => p.category === 'shot').length}
            </p>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-6"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Produkte suchen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-neutral-900/50 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-red-500 transition-colors"
          />
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-500/20 border border-red-500/40 rounded-xl text-red-200 flex items-center justify-between"
            >
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-red-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-neutral-900/50 border border-white/10 rounded-xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/30">
                <tr>
                  <th className="text-left px-6 py-4 text-white/60 text-sm font-medium">Name</th>
                  <th className="text-left px-6 py-4 text-white/60 text-sm font-medium">Kategorie</th>
                  <th className="text-left px-6 py-4 text-white/60 text-sm font-medium">Preis</th>
                  <th className="text-left px-6 py-4 text-white/60 text-sm font-medium">Sortierung</th>
                  <th className="text-left px-6 py-4 text-white/60 text-sm font-medium">Status</th>
                  <th className="text-right px-6 py-4 text-white/60 text-sm font-medium">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-white/40">
                      Keine Produkte gefunden
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(product => (
                    <tr key={product.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-white font-medium">{product.name}</td>
                      <td className="px-6 py-4 text-white/70">
                        {categoryLabels[product.category] || product.category}
                      </td>
                      <td className="px-6 py-4 text-white/70">
                        {formatPrice(Number(product.price))}
                      </td>
                      <td className="px-6 py-4 text-white/70">{product.sort_order}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleActive(product)}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors',
                            product.active
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          )}
                        >
                          {product.active ? (
                            <>
                              <Check className="w-3 h-3" /> Aktiv
                            </>
                          ) : (
                            <>
                              <X className="w-3 h-3" /> Inaktiv
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(product)}
                            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="p-2 text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
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
              <h2 className="text-2xl font-display font-bold text-white mb-6">
                {editingProduct ? 'Produkt bearbeiten' : 'Neues Produkt'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-white/70 text-sm mb-2">Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500 transition-colors"
                    placeholder="z. B. Bier"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Preis (CHF)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={form.price}
                      onChange={e => setForm({ ...form, price: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500 transition-colors"
                      placeholder="5.00"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Sortierung</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={form.sort_order}
                      onChange={e => setForm({ ...form, sort_order: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500 transition-colors"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-2">Kategorie</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value as any })}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
                  >
                    {categoryOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={e => setForm({ ...form, active: e.target.checked })}
                    className="w-5 h-5 rounded border-white/10 bg-black/50 text-red-500 focus:ring-red-500"
                  />
                  <span className="text-white/80">Aktiv</span>
                </label>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingProduct ? 'Speichern' : 'Erstellen'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
