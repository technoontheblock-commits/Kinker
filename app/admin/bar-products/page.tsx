'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Pencil, Trash2, Wine, Package, Check, X, Loader2,
  Tags, GripVertical, ArrowUp, ArrowDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BarProduct, BarProductCategory } from '@/lib/database.types'

interface ProductFormData {
  name: string
  price: string
  category: string
  sort_order: string
  barcode: string
  supplier: string
  manufacturer: string
  active: boolean
}

const emptyForm: ProductFormData = {
  name: '',
  price: '',
  category: '',
  sort_order: '0',
  barcode: '',
  supplier: '',
  manufacturer: '',
  active: true,
}

export default function BarProductsAdminPage() {
  const [products, setProducts] = useState<BarProduct[]>([])
  const [categories, setCategories] = useState<BarProductCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<BarProduct | null>(null)
  const [form, setForm] = useState<ProductFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '' })
  const [savingCategory, setSavingCategory] = useState(false)
  const [categoryError, setCategoryError] = useState<string | null>(null)

  const activeCategories = useMemo(() => categories.filter(c => c.active), [categories])
  const categoryLabelMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const c of categories) {
      map[c.slug] = c.name
    }
    return map
  }, [categories])

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

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/bar-product-categories')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Laden')
      setCategories(data.categories || [])
    } catch (err: any) {
      setError(err.message)
    }
  }

  useEffect(() => {
    Promise.all([fetchProducts(), fetchCategories()])
  }, [])

  const filteredProducts = useMemo(() => {
    const term = search.toLowerCase()
    return products.filter(p =>
      p.name.toLowerCase().includes(term) ||
      (p.barcode && p.barcode.toLowerCase().includes(term)) ||
      (categoryLabelMap[p.category]?.toLowerCase() || p.category).includes(term)
    )
  }, [products, search, categoryLabelMap])

  const openAdd = () => {
    setEditingProduct(null)
    setForm({
      ...emptyForm,
      category: activeCategories[0]?.slug || '',
    })
    setModalOpen(true)
  }

  const openEdit = (product: BarProduct) => {
    setEditingProduct(product)
    setForm({
      name: product.name,
      price: Number(product.price).toFixed(2),
      category: product.category,
      sort_order: product.sort_order.toString(),
      barcode: product.barcode || '',
      supplier: product.supplier || '',
      manufacturer: product.manufacturer || '',
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
        barcode: form.barcode.trim(),
        supplier: form.supplier.trim(),
        manufacturer: form.manufacturer.trim(),
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

  const openCategoryModal = () => {
    setCategoryForm({ name: '', slug: '' })
    setCategoryError(null)
    setCategoryModalOpen(true)
  }

  const closeCategoryModal = () => {
    setCategoryModalOpen(false)
    setCategoryForm({ name: '', slug: '' })
    setCategoryError(null)
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingCategory(true)
    setCategoryError(null)

    try {
      const name = categoryForm.name.trim()
      if (!name) {
        throw new Error('Name ist erforderlich')
      }

      const slug = categoryForm.slug.trim() || undefined
      const res = await fetch('/api/bar-product-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, sort_order: activeCategories.length }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Speichern')

      await fetchCategories()
      setCategoryForm({ name: '', slug: '' })
    } catch (err: any) {
      setCategoryError(err.message)
    } finally {
      setSavingCategory(false)
    }
  }

  const handleDeleteCategory = async (category: BarProductCategory) => {
    if (!window.confirm(`Kategorie „${category.name}" wirklich entfernen? Produkte dieser Kategorie werden zu „Sonstiges" verschoben.`)) return

    try {
      const res = await fetch(`/api/bar-product-categories/${category.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Löschen')

      await Promise.all([fetchCategories(), fetchProducts()])
    } catch (err: any) {
      setCategoryError(err.message)
    }
  }

  const moveCategory = (index: number, direction: -1 | 1) => {
    const newCategories = [...activeCategories]
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= newCategories.length) return

    const temp = newCategories[index]
    newCategories[index] = newCategories[targetIndex]
    newCategories[targetIndex] = temp

    // Update sort_order locally
    const updated = newCategories.map((c, i) => ({ ...c, sort_order: i }))
    setCategories(prev => prev.map(c => {
      const found = updated.find(u => u.id === c.id)
      return found ? { ...c, sort_order: found.sort_order } : c
    }))
  }

  const saveCategoryOrder = async () => {
    setSavingCategory(true)
    setCategoryError(null)

    try {
      const res = await fetch('/api/bar-product-categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: activeCategories.map((c, i) => ({
            id: c.id,
            sort_order: i,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Sortieren')
      await fetchCategories()
    } catch (err: any) {
      setCategoryError(err.message)
    } finally {
      setSavingCategory(false)
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
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={openCategoryModal}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-medium transition-colors"
            >
              <Tags className="w-5 h-5" />
              Kategorien bearbeiten
            </button>
            <button
              onClick={openAdd}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Produkt hinzufügen
            </button>
          </div>
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
          {activeCategories.slice(0, 2).map((category, index) => (
            <div key={category.id} className="bg-neutral-900/50 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <Wine className={cn(
                  'w-5 h-5',
                  index === 0 ? 'text-yellow-500' : 'text-blue-500'
                )} />
                <span className="text-white/50 text-sm">{category.name}</span>
              </div>
              <p className="text-2xl font-display font-bold">
                {products.filter(p => p.category === category.slug).length}
              </p>
            </div>
          ))}
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
                  <th className="text-left px-6 py-4 text-white/60 text-sm font-medium">Barcode</th>
                  <th className="text-left px-6 py-4 text-white/60 text-sm font-medium">Sortierung</th>
                  <th className="text-left px-6 py-4 text-white/60 text-sm font-medium">Status</th>
                  <th className="text-right px-6 py-4 text-white/60 text-sm font-medium">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-white/40">
                      Keine Produkte gefunden
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(product => (
                    <tr key={product.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-white font-medium">{product.name}</td>
                      <td className="px-6 py-4 text-white/70">
                        {categoryLabelMap[product.category] || product.category}
                      </td>
                      <td className="px-6 py-4 text-white/70">
                        {formatPrice(Number(product.price))}
                      </td>
                      <td className="px-6 py-4 text-white/70 font-mono text-xs">
                        {product.barcode || '—'}
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

      {/* Product Modal */}
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
                    required
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
                  >
                    <option value="" disabled>Kategorie wählen</option>
                    {activeCategories.map(category => (
                      <option key={category.id} value={category.slug}>{category.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-2">Barcode</label>
                  <input
                    type="text"
                    value={form.barcode}
                    onChange={e => setForm({ ...form, barcode: e.target.value })}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500 transition-colors font-mono"
                    placeholder="z. B. 7612345678900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Lieferant</label>
                    <input
                      type="text"
                      value={form.supplier}
                      onChange={e => setForm({ ...form, supplier: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500 transition-colors"
                      placeholder="z. B. Getränke AG"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Hersteller</label>
                    <input
                      type="text"
                      value={form.manufacturer}
                      onChange={e => setForm({ ...form, manufacturer: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500 transition-colors"
                      placeholder="z. B. Feldschlösschen"
                    />
                  </div>
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

      {/* Categories Modal */}
      <AnimatePresence>
        {categoryModalOpen && (
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
              className="bg-neutral-900 rounded-2xl p-6 md:p-8 w-full max-w-lg border border-white/10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold text-white">
                  Kategorien bearbeiten
                </h2>
                <button
                  onClick={closeCategoryModal}
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {categoryError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-200 text-sm">
                  {categoryError}
                </div>
              )}

              <form onSubmit={handleAddCategory} className="mb-6">
                <label className="block text-white/70 text-sm mb-2">Neue Kategorie</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    placeholder="Name z. B. Cocktails"
                    className="flex-1 px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500 transition-colors"
                  />
                  <input
                    type="text"
                    value={categoryForm.slug}
                    onChange={e => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                    placeholder="Slug (optional)"
                    className="flex-1 px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500 transition-colors font-mono text-sm"
                  />
                  <button
                    type="submit"
                    disabled={savingCategory}
                    className="px-4 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
                  >
                    {savingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5" />}
                  </button>
                </div>
              </form>

              <div className="space-y-2 mb-6">
                {activeCategories.map((category, index) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-3 p-3 bg-black/30 border border-white/10 rounded-xl"
                  >
                    <GripVertical className="w-5 h-5 text-white/30" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium">{category.name}</p>
                      <p className="text-white/40 text-xs font-mono">{category.slug}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveCategory(index, -1)}
                        disabled={index === 0}
                        className="p-2 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 rounded-lg transition-colors"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveCategory(index, 1)}
                        disabled={index === activeCategories.length - 1}
                        className="p-2 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 rounded-lg transition-colors"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category)}
                        className="p-2 text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeCategoryModal}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
                >
                  Schliessen
                </button>
                <button
                  onClick={saveCategoryOrder}
                  disabled={savingCategory}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {savingCategory && <Loader2 className="w-4 h-4 animate-spin" />}
                  Sortierung speichern
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
