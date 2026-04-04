'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  MessageSquare, 
  ChevronRight,
  Folder,
  Loader2,
  Plus
} from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  color: string
  subcategories: Subcategory[]
  total_posts: number
  subcategory_count: number
}

interface Subcategory {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  post_count: number
}

export default function ForumPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

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
      }
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
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Forum</h1>
              <p className="text-white/60">Community-Diskussionen und Austausch</p>
            </div>
            {user?.role === 'admin' && (
              <Link
                href="/admin/forum"
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Kategorien verwalten
              </Link>
            )}
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-white/40 mb-6">
          <span className="text-white">Forum</span>
        </div>

        {/* Categories */}
        <div className="space-y-6">
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
                transition={{ delay: index * 0.1 }}
                className="bg-zinc-900 rounded-xl border border-white/10 overflow-hidden"
              >
                {/* Category Header */}
                <div 
                  className="px-6 py-4 border-b border-white/10"
                  style={{ borderLeftWidth: '4px', borderLeftColor: category.color }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <Folder className="w-5 h-5" style={{ color: category.color }} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">{category.name}</h2>
                        <p className="text-white/50 text-sm">{category.description}</p>
                      </div>
                    </div>
                    <div className="text-right text-sm text-white/40">
                      <div>{category.subcategory_count} Unterkategorien</div>
                      <div>{category.total_posts} Posts</div>
                    </div>
                  </div>
                </div>

                {/* Subcategories */}
                <div className="divide-y divide-white/5">
                  {category.subcategories?.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/forum/subcategory/${sub.id}`}
                      className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
                          <MessageSquare className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-white group-hover:text-red-500 transition-colors">
                            {sub.name}
                          </h3>
                          <p className="text-white/40 text-sm">{sub.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-white/40">
                          {sub.post_count} Posts
                        </span>
                        <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-red-500 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900 rounded-xl p-6 border border-white/10">
            <div className="text-3xl font-bold text-white mb-1">
              {categories.reduce((sum, c) => sum + c.total_posts, 0)}
            </div>
            <div className="text-white/50 text-sm">Gesamt Posts</div>
          </div>
          <div className="bg-zinc-900 rounded-xl p-6 border border-white/10">
            <div className="text-3xl font-bold text-white mb-1">
              {categories.reduce((sum, c) => sum + c.subcategory_count, 0)}
            </div>
            <div className="text-white/50 text-sm">Unterkategorien</div>
          </div>
          <div className="bg-zinc-900 rounded-xl p-6 border border-white/10">
            <div className="text-3xl font-bold text-white mb-1">
              {categories.length}
            </div>
            <div className="text-white/50 text-sm">Hauptkategorien</div>
          </div>
        </div>
      </div>
    </div>
  )
}
