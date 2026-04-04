'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  MessageSquare, 
  Plus,
  ArrowLeft,
  Pin,
  Lock,
  Eye,
  Clock,
  Loader2,
  Trash2,
  ChevronRight
} from 'lucide-react'
import { formatDistanceToNow } from '@/lib/utils'

interface Post {
  id: string
  title: string
  content: string
  is_pinned: boolean
  is_locked: boolean
  view_count: number
  created_at: string
  user_id: string
  user: {
    name: string
    email: string
    avatar_url: string | null
  }
  comment_count: number
}

interface Subcategory {
  id: string
  name: string
  slug: string
  description: string
  category: {
    name: string
    slug: string
    color: string
  }
}

export default function SubcategoryPage() {
  const params = useParams()
  const router = useRouter()
  const subcategoryId = params.id as string
  
  const [subcategory, setSubcategory] = useState<Subcategory | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkAuth()
    loadData()
  }, [subcategoryId])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/session')
      const data = await res.json()
      if (data.user) {
        setUser(data.user)
        setIsAdmin(data.user.role === 'admin')
      }
    } catch (error) {
      console.error('Error checking auth:', error)
    }
  }

  const loadData = async () => {
    try {
      // Load subcategory
      const subRes = await fetch(`/api/forum/subcategories?id=${subcategoryId}`)
      const subData = await subRes.json()
      
      if (subData.subcategory) {
        setSubcategory(subData.subcategory)
      }

      // Load posts
      const postsRes = await fetch(`/api/forum/posts?subcategory=${subcategoryId}`)
      const postsData = await postsRes.json()
      
      if (postsData.posts) {
        setPosts(postsData.posts)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Möchtest du diesen Post wirklich löschen?')) return

    try {
      const res = await fetch(`/api/forum/posts?id=${postId}`, { method: 'DELETE' })
      
      if (res.ok) {
        setPosts(posts.filter(p => p.id !== postId))
      }
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    )
  }

  if (!subcategory) {
    return (
      <div className="min-h-screen bg-black pt-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Unterkategorie nicht gefunden</h1>
          <Link href="/forum" className="text-red-500 hover:text-red-400">
            Zurück zum Forum
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-white/40 mb-6">
          <Link href="/forum" className="hover:text-white transition-colors">Forum</Link>
          <ChevronRight className="w-4 h-4" />
          <span style={{ color: subcategory.category?.color }}>{subcategory.category?.name}</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">{subcategory.name}</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{subcategory.name}</h1>
            <p className="text-white/60">{subcategory.description}</p>
          </div>
          {user && (
            <Link
              href={`/forum/create?subcategory=${subcategoryId}`}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Neuer Post
            </Link>
          )}
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900/50 rounded-xl border border-white/10">
              <MessageSquare className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <p className="text-white/60 text-lg">Noch keine Posts in dieser Unterkategorie</p>
              {user && (
                <Link
                  href={`/forum/create?subcategory=${subcategoryId}`}
                  className="inline-block mt-4 text-red-500 hover:text-red-400"
                >
                  Ersten Post erstellen
                </Link>
              )}
            </div>
          ) : (
            posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-zinc-900 rounded-xl p-6 border border-white/10 hover:border-red-500/30 transition-all group ${
                  post.is_pinned ? 'border-l-4 border-l-red-500' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {post.is_pinned && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-500 rounded text-xs font-medium">
                          <Pin className="w-3 h-3" />
                          Angepinnt
                        </span>
                      )}
                      {post.is_locked && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-zinc-700 text-zinc-400 rounded text-xs">
                          <Lock className="w-3 h-3" />
                          Geschlossen
                        </span>
                      )}
                    </div>
                    
                    <Link href={`/forum/post/${post.id}`}>
                      <h2 className="text-xl font-semibold text-white group-hover:text-red-500 transition-colors mb-2">
                        {post.title}
                      </h2>
                    </Link>
                    
                    <p className="text-white/50 line-clamp-2 mb-4">
                      {post.content.substring(0, 200)}...
                    </p>
                    
                    <div className="flex items-center gap-6 text-sm text-zinc-500">
                      <span className="flex items-center gap-2">
                        {post.user?.avatar_url ? (
                          <img 
                            src={post.user.avatar_url} 
                            alt={post.user.name}
                            className="w-6 h-6 rounded-full object-cover border border-white/20"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-medium">
                            {post.user?.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                        )}
                        <span className="text-white/70">{post.user?.name || 'Anonym'}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDistanceToNow(new Date(post.created_at))}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {post.view_count} Aufrufe
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {post.comment_count} Kommentare
                      </span>
                    </div>
                  </div>

                  {(isAdmin || user?.id === post.user_id) && (
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Back Link */}
        <div className="mt-8">
          <Link 
            href="/forum"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Übersicht
          </Link>
        </div>
      </div>
    </div>
  )
}
