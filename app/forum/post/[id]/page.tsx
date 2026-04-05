'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  MessageSquare, 
  ArrowLeft, 
  Eye, 
  Clock, 
  Send,
  Loader2,
  Trash2,
  Pin,
  Lock,
  ChevronRight,
  Reply
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
  subcategory: {
    id: string
    name: string
    slug: string
    category: {
      name: string
      slug: string
      color: string
    }
  }
}

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  parent_id: string | null
  user: {
    name: string
    email: string
    avatar_url: string | null
  }
}

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.id as string
  
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    checkAuth()
    loadPost()
  }, [postId])

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

  const loadPost = async () => {
    try {
      const res = await fetch(`/api/forum/posts/${postId}`)
      const data = await res.json()
      
      if (!res.ok) {
        console.error('API Error:', data)
      }
      
      if (data.post) {
        setPost(data.post)
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Error loading post:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !user) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/forum/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment.trim(),
          post_id: postId,
          parent_id: replyTo
        })
      })

      if (res.ok) {
        const data = await res.json()
        setComments([...comments, data.comment])
        setNewComment('')
        setReplyTo(null)
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Möchtest du diesen Kommentar wirklich löschen?')) return

    try {
      const res = await fetch(`/api/forum/comments?id=${commentId}`, { 
        method: 'DELETE' 
      })
      
      if (res.ok) {
        setComments(comments.filter(c => c.id !== commentId))
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const handleDeletePost = async () => {
    if (!confirm('Möchtest du diesen Post wirklich löschen?')) return

    try {
      const res = await fetch(`/api/forum/posts?id=${postId}`, { 
        method: 'DELETE' 
      })
      
      if (res.ok) {
        router.push(`/forum/subcategory/${post?.subcategory?.id}`)
      }
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  const handlePinPost = async () => {
    try {
      const res = await fetch('/api/forum/posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: postId,
          is_pinned: !post?.is_pinned
        })
      })
      
      if (res.ok) {
        setPost(prev => prev ? { ...prev, is_pinned: !prev.is_pinned } : null)
      }
    } catch (error) {
      console.error('Error pinning post:', error)
    }
  }

  const handleLockPost = async () => {
    try {
      const res = await fetch('/api/forum/posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: postId,
          is_locked: !post?.is_locked
        })
      })
      
      if (res.ok) {
        setPost(prev => prev ? { ...prev, is_locked: !prev.is_locked } : null)
      }
    } catch (error) {
      console.error('Error locking post:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-black pt-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Post nicht gefunden</h1>
          <Link href="/forum" className="text-red-500 hover:text-red-400">
            Zurück zum Forum
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-white/40 mb-6">
          <Link href="/forum" className="hover:text-white transition-colors">Forum</Link>
          <ChevronRight className="w-4 h-4" />
          <span style={{ color: post.subcategory?.category?.color }}>
            {post.subcategory?.category?.name}
          </span>
          <ChevronRight className="w-4 h-4" />
          <Link 
            href={`/forum/subcategory/${post.subcategory?.id}`}
            className="hover:text-white transition-colors"
          >
            {post.subcategory?.name}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">Post</span>
        </div>

        {/* Post */}
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 rounded-xl p-8 border border-white/10 mb-8"
        >
          {/* Post Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                {post.is_pinned && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-500 rounded-full text-xs font-medium">
                    <Pin className="w-3 h-3" />
                    Angepinnt
                  </span>
                )}
                {post.is_locked && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-zinc-700 text-zinc-400 rounded-full text-xs font-medium">
                    <Lock className="w-3 h-3" />
                    Geschlossen
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-white">{post.title}</h1>
            </div>

            {/* Admin Actions */}
            {isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePinPost}
                  className={`p-2 rounded-lg transition-colors ${
                    post.is_pinned 
                      ? 'bg-red-500/20 text-red-500' 
                      : 'text-zinc-500 hover:text-white hover:bg-white/10'
                  }`}
                  title={post.is_pinned ? 'Unpinnen' : 'Anpinnen'}
                >
                  <Pin className="w-5 h-5" />
                </button>
                <button
                  onClick={handleLockPost}
                  className={`p-2 rounded-lg transition-colors ${
                    post.is_locked 
                      ? 'bg-yellow-500/20 text-yellow-500' 
                      : 'text-zinc-500 hover:text-white hover:bg-white/10'
                  }`}
                  title={post.is_locked ? 'Entsperren' : 'Sperren'}
                >
                  <Lock className="w-5 h-5" />
                </button>
                <button
                  onClick={handleDeletePost}
                  className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Löschen"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Author Info */}
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-white/10">
            {post.user?.avatar_url ? (
              <img 
                src={post.user.avatar_url} 
                alt={post.user.name}
                className="w-12 h-12 rounded-full object-cover border border-white/20"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white text-lg font-medium">
                {post.user?.name?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
            <div>
              <div className="font-medium text-white">{post.user?.name || 'Anonym'}</div>
              <div className="text-sm text-zinc-500 flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDistanceToNow(new Date(post.created_at))}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {post.view_count} Aufrufe
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none">
            <p className="text-white/80 whitespace-pre-wrap text-lg">{post.content}</p>
          </div>
        </motion.article>

        {/* Comments Section */}
        <div className="bg-zinc-900 rounded-xl p-8 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {comments.length} Kommentare
          </h2>

          {/* Comment Form */}
          {user && !post.is_locked && (
            <form onSubmit={handleSubmitComment} className="mb-8">
              {replyTo && (
                <div className="flex items-center justify-between mb-2 px-4 py-2 bg-zinc-800 rounded-lg">
                  <span className="text-sm text-white/60">
                    Antwort auf einen Kommentar
                  </span>
                  <button
                    type="button"
                    onClick={() => setReplyTo(null)}
                    className="text-zinc-500 hover:text-white"
                  >
                    Abbrechen
                  </button>
                </div>
              )}
              <div className="flex gap-4">
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Schreibe einen Kommentar..."
                    rows={3}
                    className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-red-500 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>
          )}

          {!user && (
            <div className="mb-8 p-4 bg-zinc-800/50 rounded-lg text-center">
              <p className="text-white/60">
                <Link href="/login" className="text-red-500 hover:text-red-400">Melde dich an</Link>, um zu kommentieren
              </p>
            </div>
          )}

          {post.is_locked && (
            <div className="mb-8 p-4 bg-zinc-800/50 rounded-lg text-center">
              <p className="text-white/60 flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" />
                Dieser Post ist geschlossen
              </p>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-6">
            {comments.length === 0 ? (
              <p className="text-white/40 text-center py-8">
                Noch keine Kommentare. Sei der Erste!
              </p>
            ) : (
              comments.map((comment, index) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-white/10 last:border-0 pb-6 last:pb-0"
                >
                  <div className="flex items-start gap-4">
                    {comment.user?.avatar_url ? (
                      <img 
                        src={comment.user.avatar_url} 
                        alt={comment.user.name}
                        className="w-10 h-10 rounded-full object-cover border border-white/20 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white font-medium flex-shrink-0">
                        {comment.user?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4 mb-1">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-white">
                            {comment.user?.name || 'Anonym'}
                          </span>
                          <span className="text-zinc-500 text-sm">
                            {formatDistanceToNow(new Date(comment.created_at))}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {user && !post.is_locked && (
                            <button
                              onClick={() => setReplyTo(comment.id)}
                              className="p-1 text-zinc-500 hover:text-white transition-colors"
                              title="Antworten"
                            >
                              <Reply className="w-4 h-4" />
                            </button>
                          )}
                          {(isAdmin || user?.id === comment.user_id) && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="p-1 text-zinc-500 hover:text-red-500 transition-colors"
                              title="Löschen"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-white/80 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8">
          <Link 
            href={`/forum/subcategory/${post.subcategory?.id}`}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zu {post.subcategory?.name}
          </Link>
        </div>
      </div>
    </div>
  )
}
