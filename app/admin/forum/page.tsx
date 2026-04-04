'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Folder,
  MessageSquare,
  GripVertical,
  X,
  Loader2,
  ChevronDown,
  ChevronRight,
  Settings
} from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  color: string
  sort_order: number
  is_active: boolean
  subcategories: Subcategory[]
}

interface Subcategory {
  id: string
  category_id: string
  name: string
  slug: string
  description: string
  icon: string
  sort_order: number
  is_active: boolean
  post_count?: number
}

export default function AdminForumPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  
  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState('')

  useEffect(() => {
    checkAuth()
    loadCategories()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/session')
      const data = await res.json()
      if (data.user?.role !== 'admin') {
        window.location.href = '/'
        return
      }
      setUser(data.user)
    } catch (error) {
      console.error('Error checking auth:', error)
    }
  }

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/forum/categories?stats=true')
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (id: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedCategories(newExpanded)
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Möchtest du diese Kategorie wirklich löschen? Alle Unterkategorien und Posts werden ebenfalls gelöscht!')) return

    try {
      const res = await fetch(`/api/forum/categories?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setCategories(categories.filter(c => c.id !== id))
      }
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  const handleDeleteSubcategory = async (id: string) => {
    if (!confirm('Möchtest du diese Unterkategorie wirklich löschen? Alle Posts werden ebenfalls gelöscht!')) return

    try {
      const res = await fetch(`/api/forum/subcategories?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        loadCategories()
      }
    } catch (error) {
      console.error('Error deleting subcategory:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin"
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Forum Verwaltung</h1>
              <p className="text-white/50">Kategorien und Unterkategorien managen</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditingCategory(null)
                setShowCategoryModal(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Hauptkategorie
            </button>
            <button
              onClick={() => {
                setEditingSubcategory(null)
                setSelectedCategoryId(categories[0]?.id || '')
                setShowSubcategoryModal(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Unterkategorie
            </button>
          </div>
        </div>

        {/* Categories List */}
        <div className="space-y-4">
          {categories.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900/50 rounded-xl border border-white/10">
              <Folder className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <p className="text-white/60">Noch keine Kategorien vorhanden</p>
            </div>
          ) : (
            categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-zinc-900 rounded-xl border border-white/10 overflow-hidden"
              >
                {/* Category Header */}
                <div 
                  className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-white/5 transition-colors"
                  style={{ borderLeftWidth: '4px', borderLeftColor: category.color }}
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex items-center gap-4">
                    <GripVertical className="w-5 h-5 text-zinc-600" />
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <Folder className="w-5 h-5" style={{ color: category.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{category.name}</h3>
                      <p className="text-sm text-white/50">{category.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-white/40">
                      {category.subcategories?.length || 0} Unterkategorien
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingCategory(category)
                        setShowCategoryModal(true)
                      }}
                      className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteCategory(category.id)
                      }}
                      className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {expandedCategories.has(category.id) ? (
                      <ChevronDown className="w-5 h-5 text-zinc-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-zinc-500" />
                    )}
                  </div>
                </div>

                {/* Subcategories */}
                <AnimatePresence>
                  {expandedCategories.has(category.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/10"
                    >
                      <div className="divide-y divide-white/5">
                        {category.subcategories?.map((sub) => (
                          <div 
                            key={sub.id}
                            className="flex items-center justify-between px-6 py-3 pl-16 hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <MessageSquare className="w-4 h-4 text-zinc-500" />
                              <div>
                                <span className="text-white">{sub.name}</span>
                                <span className="text-white/40 text-sm ml-2">
                                  {sub.post_count || 0} Posts
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingSubcategory(sub)
                                  setSelectedCategoryId(category.id)
                                  setShowSubcategoryModal(true)
                                }}
                                className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSubcategory(sub.id)}
                                className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            setEditingSubcategory(null)
                            setSelectedCategoryId(category.id)
                            setShowSubcategoryModal(true)
                          }}
                          className="flex items-center gap-2 w-full px-6 py-3 pl-16 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Unterkategorie hinzufügen
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>

        {/* Category Modal */}
        {showCategoryModal && (
          <CategoryModal
            category={editingCategory}
            onClose={() => {
              setShowCategoryModal(false)
              setEditingCategory(null)
            }}
            onSuccess={() => {
              setShowCategoryModal(false)
              setEditingCategory(null)
              loadCategories()
            }}
          />
        )}

        {/* Subcategory Modal */}
        {showSubcategoryModal && (
          <SubcategoryModal
            subcategory={editingSubcategory}
            categoryId={selectedCategoryId}
            categories={categories}
            onClose={() => {
              setShowSubcategoryModal(false)
              setEditingSubcategory(null)
            }}
            onSuccess={() => {
              setShowSubcategoryModal(false)
              setEditingSubcategory(null)
              loadCategories()
            }}
          />
        )}
      </div>
    </div>
  )
}

// Category Modal Component
function CategoryModal({ 
  category, 
  onClose, 
  onSuccess 
}: { 
  category: Category | null
  onClose: () => void
  onSuccess: () => void 
}) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    icon: category?.icon || 'Folder',
    color: category?.color || '#FF4D00',
    sort_order: category?.sort_order || 0
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = category ? '/api/forum/categories' : '/api/forum/categories'
      const method = category ? 'PUT' : 'POST'
      const body = category 
        ? { ...formData, id: category.id }
        : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error saving category:', error)
    } finally {
      setLoading(false)
    }
  }

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: category ? prev.slug : name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900 rounded-xl p-6 w-full max-w-lg border border-white/10"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {category ? 'Kategorie bearbeiten' : 'Neue Kategorie'}
          </h2>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">Beschreibung</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">Farbe</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-10 h-10 rounded bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="flex-1 px-4 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">Sortierung</label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-white/70 hover:text-white transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {loading ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// Subcategory Modal Component
function SubcategoryModal({ 
  subcategory, 
  categoryId,
  categories,
  onClose, 
  onSuccess 
}: { 
  subcategory: Subcategory | null
  categoryId: string
  categories: Category[]
  onClose: () => void
  onSuccess: () => void 
}) {
  const [formData, setFormData] = useState({
    category_id: subcategory?.category_id || categoryId,
    name: subcategory?.name || '',
    slug: subcategory?.slug || '',
    description: subcategory?.description || '',
    icon: subcategory?.icon || 'MessageSquare',
    sort_order: subcategory?.sort_order || 0
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = '/api/forum/subcategories'
      const method = subcategory ? 'PUT' : 'POST'
      const body = subcategory 
        ? { ...formData, id: subcategory.id }
        : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error saving subcategory:', error)
    } finally {
      setLoading(false)
    }
  }

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: subcategory ? prev.slug : name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900 rounded-xl p-6 w-full max-w-lg border border-white/10"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {subcategory ? 'Unterkategorie bearbeiten' : 'Neue Unterkategorie'}
          </h2>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1">Hauptkategorie</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500"
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">Beschreibung</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">Sortierung</label>
            <input
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-white/70 hover:text-white transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {loading ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
