'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Loader2, 
  Send,
  Info,
  ChevronRight
} from 'lucide-react'

interface Category {
  id: string
  name: string
  subcategories: Subcategory[]
}

interface Subcategory {
  id: string
  name: string
  description: string
}

function CreatePostContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedSubcategory = searchParams.get('subcategory')
  
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    subcategory_id: preselectedSubcategory || ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    checkAuth()
    loadCategories()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/session')
      const data = await res.json()
      if (data.user) {
        setUser(data.user)
      } else {
        router.push('/login?redirect=/forum/create')
      }
    } catch (error) {
      console.error('Error checking auth:', error)
    }
  }

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/forum/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Titel ist erforderlich'
    } else if (formData.title.length < 5) {
      newErrors.title = 'Titel muss mindestens 5 Zeichen lang sein'
    } else if (formData.title.length > 100) {
      newErrors.title = 'Titel darf maximal 100 Zeichen lang sein'
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Inhalt ist erforderlich'
    } else if (formData.content.length < 10) {
      newErrors.content = 'Inhalt muss mindestens 10 Zeichen lang sein'
    }

    if (!formData.subcategory_id) {
      newErrors.subcategory = 'Bitte wähle eine Unterkategorie'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          content: formData.content.trim(),
          subcategory_id: formData.subcategory_id
        })
      })

      if (res.ok) {
        const data = await res.json()
        router.push(`/forum/post/${data.post.id}`)
      } else {
        const error = await res.json()
        setErrors({ submit: error.error || 'Ein Fehler ist aufgetreten' })
      }
    } catch (error) {
      setErrors({ submit: 'Ein Fehler ist aufgetreten' })
    } finally {
      setSubmitting(false)
    }
  }

  // Get selected subcategory info
  const selectedSubcategory = categories
    .flatMap(c => c.subcategories)
    .find(s => s.id === formData.subcategory_id)

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-white/40 mb-6">
          <Link href="/forum" className="hover:text-white transition-colors">Forum</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">Neuer Post</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 rounded-xl p-8 border border-white/10"
        >
          <h1 className="text-2xl font-bold text-white mb-6">Neuen Post erstellen</h1>

          {errors.submit && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
              <Info className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-red-400">{errors.submit}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Subcategory Selection */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                Unterkategorie
              </label>
              
              {!formData.subcategory_id ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {categories.map((category) => (
                    <div key={category.id} className="border border-white/10 rounded-lg overflow-hidden">
                      <div className="px-4 py-3 bg-zinc-800/50 border-b border-white/10">
                        <span className="font-medium text-white">{category.name}</span>
                      </div>
                      <div className="divide-y divide-white/5">
                        {category.subcategories?.map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, subcategory_id: sub.id })}
                            className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors"
                          >
                            <div className="text-white/90">{sub.name}</div>
                            <div className="text-sm text-white/40">{sub.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-zinc-800/50 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">{selectedSubcategory?.name}</div>
                    <div className="text-sm text-white/50">{selectedSubcategory?.description}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, subcategory_id: '' })}
                    className="text-sm text-red-500 hover:text-red-400"
                  >
                    Ändern
                  </button>
                </div>
              )}
              {errors.subcategory && (
                <p className="mt-2 text-sm text-red-500">{errors.subcategory}</p>
              )}
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-white mb-2">
                Titel
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Gib deinem Post einen aussagekräftigen Titel"
                className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-red-500"
              />
              {errors.title && (
                <p className="mt-2 text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-white mb-2">
                Inhalt
              </label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Beschreibe dein Thema..."
                rows={10}
                className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-red-500 resize-none"
              />
              {errors.content && (
                <p className="mt-2 text-sm text-red-500">{errors.content}</p>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
              <Link
                href="/forum"
                className="px-6 py-3 text-white/70 hover:text-white transition-colors"
              >
                Abbrechen
              </Link>
              <button
                type="submit"
                disabled={submitting || !formData.subcategory_id}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Post erstellen
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

export default function CreatePostPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    }>
      <CreatePostContent />
    </Suspense>
  )
}
