'use client'

import { useState } from 'react'
import { X, Calendar, User, MessageSquare, Trash2, Check, Edit2 } from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import type { Card, List, Board, UserType, Comment } from './types'

export function CardModal({
  card,
  list,
  board,
  users,
  onClose,
  onUpdate,
  onDelete,
}: {
  card: Card
  list: List
  board: Board
  users: UserType[]
  onClose: () => void
  onUpdate: (card: Card) => void
  onDelete: (cardId: string) => void
}) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description || '')
  const [assignedTo, setAssignedTo] = useState(card.assigned_to || '')
  const [dueDate, setDueDate] = useState(card.due_date ? card.due_date.split('T')[0] : '')
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState<Comment[]>(card.comments || [])
  const [isEditing, setIsEditing] = useState(false)

  const handleSave = async () => {
    const updatedCard: Card = {
      ...card,
      title,
      description,
      assigned_to: assignedTo || undefined,
      due_date: dueDate || undefined,
    }
    onUpdate(updatedCard)
    setIsEditing(false)
  }

  const handleAddComment = async () => {
    if (!comment.trim()) return
    
    try {
      const res = await fetch('/api/kanban/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_id: card.id,
          content: comment,
        }),
      })
      
      if (res.ok) {
        const newComment = await res.json()
        setComments([...comments, newComment])
        setComment('')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xl font-bold w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                />
              ) : (
                <h2 className="text-xl font-bold text-white">{card.title}</h2>
              )}
              <p className="text-sm text-white/50 mt-1">
                in Liste <span className="text-white/70 font-medium">{list.title}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Edit2 className="w-5 h-5 text-white/60" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-white/70 mb-2">Beschreibung</h3>
            {isEditing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white placeholder:text-white/40 focus:border-red-500 focus:outline-none"
                placeholder="Beschreibung hinzufügen..."
              />
            ) : (
              <p className="text-white/60 whitespace-pre-wrap">
                {card.description || 'Keine Beschreibung'}
              </p>
            )}
          </div>

          {/* Assignee & Due Date */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="text-sm font-medium text-white/70 mb-2">Zugewiesen an</h3>
              {isEditing ? (
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full bg-black/50 border border-white/20 rounded-lg p-2.5 text-white focus:border-red-500 focus:outline-none"
                >
                  <option value="" className="bg-neutral-900">Nicht zugewiesen</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id} className="bg-neutral-900">
                      {user.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-2">
                  {card.assigned_user ? (
                    <>
                      <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-medium">
                        {card.assigned_user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white/80">{card.assigned_user.name}</span>
                    </>
                  ) : (
                    <span className="text-white/40">Nicht zugewiesen</span>
                  )}
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-white/70 mb-2">Fällig am</h3>
              {isEditing ? (
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-black/50 border border-white/20 rounded-lg p-2.5 text-white focus:border-red-500 focus:outline-none"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-white/40" />
                  <span className={card.due_date && new Date(card.due_date) < new Date() ? 'text-red-500' : 'text-white/80'}>
                    {card.due_date 
                      ? format(new Date(card.due_date), 'dd. MMMM yyyy', { locale: de })
                      : 'Kein Fälligkeitsdatum'
                    }
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Save/Cancel buttons when editing */}
          {isEditing && (
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors"
              >
                <Check className="w-4 h-4" />
                Speichern
              </button>
              <button
                onClick={() => {
                  setTitle(card.title)
                  setDescription(card.description || '')
                  setAssignedTo(card.assigned_to || '')
                  setDueDate(card.due_date ? card.due_date.split('T')[0] : '')
                  setIsEditing(false)
                }}
                className="px-4 py-2 text-white/60 hover:bg-white/10 rounded-lg transition-colors"
              >
                Abbrechen
              </button>
            </div>
          )}

          {/* Comments */}
          <div className="border-t border-white/10 pt-6">
            <h3 className="text-sm font-medium text-white/70 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Kommentare ({comments.length})
            </h3>
            
            {/* Add Comment */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                placeholder="Kommentar hinzufügen..."
                className="flex-1 bg-black/50 border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder:text-white/40 focus:border-red-500 focus:outline-none"
              />
              <button
                onClick={handleAddComment}
                disabled={!comment.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Senden
              </button>
            </div>

            {/* Comments List */}
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-600/80 flex items-center justify-center text-white text-sm flex-shrink-0 font-medium">
                    {c.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-white/90">{c.user.name}</span>
                      <span className="text-xs text-white/40">
                        {format(new Date(c.created_at), 'dd.MM. HH:mm', { locale: de })}
                      </span>
                    </div>
                    <p className="text-white/70 text-sm mt-1">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delete Card */}
          <div className="border-t border-white/10 pt-4 mt-6">
            <button
              onClick={() => {
                if (confirm('Möchtest du diese Karte wirklich löschen?')) {
                  onDelete(card.id)
                  onClose()
                }
              }}
              className="text-red-500 hover:text-red-400 text-sm flex items-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Karte löschen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
