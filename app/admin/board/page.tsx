'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Calendar, 
  MessageSquare, 
  Trash2, 
  Edit2,
  X,
  Check,
  ChevronLeft,
  Clock,
  Layout,
  User
} from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

// DnD Kit imports
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface UserType {
  id: string
  name: string
  email: string
  avatar_url?: string
}

interface Comment {
  id: string
  content: string
  created_at: string
  user: UserType
}

interface Card {
  id: string
  title: string
  description?: string
  position: number
  due_date?: string
  assigned_to?: string
  assigned_user?: UserType
  created_by: string
  created_by_user?: UserType
  list_id: string
  comments?: Comment[]
}

interface List {
  id: string
  title: string
  position: number
  board_id: string
  cards: Card[]
}

interface Board {
  id: string
  title: string
  description?: string
  created_by: string
  created_by_user?: UserType
  created_at: string
  lists: List[]
}

// Sortable List Component
function SortableList({ 
  list, 
  onAddCard, 
  onEditList, 
  onDeleteList,
  onEditCard,
  onDeleteCard,
  onCardClick
}: { 
  list: List
  onAddCard: (listId: string) => void
  onEditList: (list: List) => void
  onDeleteList: (listId: string) => void
  onEditCard: (card: Card) => void
  onDeleteCard: (cardId: string) => void
  onCardClick: (card: Card) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: list.id, data: { type: 'List', list } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const {
    attributes: cardAttributes,
    listeners: cardListeners,
    setNodeRef: setCardRef,
    transform: cardTransform,
    transition: cardTransition,
  } = useSortable({ id: list.id + '-cards', data: { type: 'ListCards', list } })

  const cardStyle = {
    transform: CSS.Transform.toString(cardTransform),
    transition: cardTransition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-shrink-0 w-80 bg-neutral-900/80 rounded-xl max-h-full flex flex-col border border-white/10"
    >
      {/* List Header */}
      <div 
        {...attributes} 
        {...listeners}
        className="p-4 flex items-center justify-between cursor-grab active:cursor-grabbing border-b border-white/10"
      >
        <h3 className="font-semibold text-white">{list.title}</h3>
        <div className="flex items-center gap-1">
          <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded-full">
            {list.cards.length}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEditList(list)
            }}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4 text-white/60 hover:text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDeleteList(list.id)
            }}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4 text-white/60 hover:text-red-500" />
          </button>
        </div>
      </div>

      {/* Cards */}
      <div 
        ref={setCardRef}
        {...cardAttributes}
        {...cardListeners}
        style={cardStyle}
        className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[100px]"
      >
        <SortableContext 
          items={list.cards.map(c => c.id)} 
          strategy={verticalListSortingStrategy}
        >
          {list.cards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              onEdit={onEditCard}
              onDelete={onDeleteCard}
              onClick={onCardClick}
            />
          ))}
        </SortableContext>
      </div>

      {/* Add Card Button */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={() => onAddCard(list.id)}
          className="w-full flex items-center justify-center gap-2 p-2.5 text-white/60 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Karte hinzufügen
        </button>
      </div>
    </div>
  )
}

// Sortable Card Component
function SortableCard({ 
  card, 
  onEdit, 
  onDelete,
  onClick
}: { 
  card: Card
  onEdit: (card: Card) => void
  onDelete: (cardId: string) => void
  onClick: (card: Card) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { type: 'Card', card } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isOverdue = card.due_date && new Date(card.due_date) < new Date()

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(card)}
      className="bg-black/40 p-3 rounded-lg border border-white/10 cursor-grab active:cursor-grabbing hover:border-red-500/50 hover:bg-black/60 transition-all group"
    >
      <div className="flex items-start justify-between">
        <h4 className="text-sm font-medium text-white flex-1">{card.title}</h4>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(card)
            }}
            className="p-1 hover:bg-white/10 rounded"
          >
            <Edit2 className="w-3 h-3 text-white/60" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(card.id)
            }}
            className="p-1 hover:bg-white/10 rounded"
          >
            <Trash2 className="w-3 h-3 text-white/60 hover:text-red-500" />
          </button>
        </div>
      </div>
      
      {card.description && (
        <p className="text-xs text-white/50 mt-1.5 line-clamp-2">{card.description}</p>
      )}
      
      <div className="flex items-center gap-2 mt-2.5">
        {card.due_date && (
          <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-white/40'}`}>
            <Clock className="w-3 h-3" />
            {format(new Date(card.due_date), 'dd.MM.', { locale: de })}
          </span>
        )}
        
        {card.assigned_user && (
          <div className="flex items-center gap-1 ml-auto">
            <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-medium">
              {card.assigned_user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
        
        {card.comments && card.comments.length > 0 && (
          <span className="text-xs text-white/40 flex items-center gap-1 ml-auto">
            <MessageSquare className="w-3 h-3" />
            {card.comments.length}
          </span>
        )}
      </div>
    </div>
  )
}

// Card Detail Modal
function CardModal({
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

// Main Board Page
export default function KanbanBoardPage() {
  const router = useRouter()
  const [boards, setBoards] = useState<Board[]>([])
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null)
  const [lists, setLists] = useState<List[]>([])
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  
  // Modal states
  const [showNewBoardModal, setShowNewBoardModal] = useState(false)
  const [showNewListModal, setShowNewListModal] = useState(false)
  const [showNewCardModal, setShowNewCardModal] = useState(false)
  const [showEditListModal, setShowEditListModal] = useState(false)
  const [showEditCardModal, setShowEditCardModal] = useState(false)
  const [editingList, setEditingList] = useState<List | null>(null)
  const [editingCard, setEditingCard] = useState<Card | null>(null)
  const [newListBoardId, setNewListBoardId] = useState('')
  const [newCardListId, setNewCardListId] = useState('')

  // Form states
  const [newBoardTitle, setNewBoardTitle] = useState('')
  const [newBoardDescription, setNewBoardDescription] = useState('')
  const [newListTitle, setNewListTitle] = useState('')
  const [newCardTitle, setNewCardTitle] = useState('')
  const [newCardDescription, setNewCardDescription] = useState('')
  const [newCardAssignedTo, setNewCardAssignedTo] = useState('')
  const [newCardDueDate, setNewCardDueDate] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Fetch boards
  const fetchBoards = useCallback(async () => {
    try {
      const res = await fetch('/api/kanban/boards')
      console.log('Fetch boards response:', res.status)
      if (res.ok) {
        const data = await res.json()
        console.log('Boards data:', data)
        setBoards(Array.isArray(data) ? data : [])
      } else {
        const error = await res.json()
        console.error('Error fetching boards:', error)
        setBoards([])
      }
    } catch (error) {
      console.error('Error fetching boards:', error)
      setBoards([])
    }
  }, [])

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }, [])

  // Fetch board details
  const fetchBoard = useCallback(async (boardId: string) => {
    console.log('Fetching board:', boardId)
    try {
      const res = await fetch(`/api/kanban/boards/${boardId}`)
      console.log('Response status:', res.status)
      if (res.ok) {
        const data = await res.json()
        console.log('Board data:', data)
        setSelectedBoard(data)
        setLists(data.lists || [])

      } else {
        const error = await res.json()
        console.error('Error fetching board:', error)
        alert('Error: ' + (error.error || 'Failed to load board'))
      }
    } catch (error) {
      console.error('Error fetching board:', error)
      alert('Error loading board')
    }
  }, [])

  useEffect(() => {
    fetchBoards()
    fetchUsers()
    setLoading(false)
  }, [fetchBoards, fetchUsers])

  // Board operations
  const createBoard = async () => {
    if (!newBoardTitle.trim()) return
    
    try {
      const res = await fetch('/api/kanban/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newBoardTitle,
          description: newBoardDescription,
        }),
      })
      
      if (res.ok) {
        const board = await res.json()
        setBoards([board, ...boards])
        setNewBoardTitle('')
        setNewBoardDescription('')
        setShowNewBoardModal(false)
        setSelectedBoard(board)
        setLists([])
      }
    } catch (error) {
      console.error('Error creating board:', error)
    }
  }

  const deleteBoard = async (boardId: string) => {
    if (!confirm('Möchtest du dieses Board wirklich löschen?')) return
    
    try {
      const res = await fetch(`/api/kanban/boards/${boardId}`, {
        method: 'DELETE',
      })
      
      if (res.ok) {
        setBoards(boards.filter(b => b.id !== boardId))
        if (selectedBoard?.id === boardId) {
          setSelectedBoard(null)
          setLists([])
        }
      }
    } catch (error) {
      console.error('Error deleting board:', error)
    }
  }

  // List operations
  const createList = async () => {
    if (!newListTitle.trim() || !selectedBoard) return
    
    try {
      const res = await fetch('/api/kanban/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newListTitle,
          board_id: selectedBoard.id,
        }),
      })
      
      if (res.ok) {
        const list = await res.json()
        setLists([...lists, { ...list, cards: [] }])
        setNewListTitle('')
        setShowNewListModal(false)
      }
    } catch (error) {
      console.error('Error creating list:', error)
    }
  }

  const updateList = async () => {
    if (!editingList || !newListTitle.trim()) return
    
    try {
      const res = await fetch(`/api/kanban/lists/${editingList.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newListTitle }),
      })
      
      if (res.ok) {
        const updatedList = await res.json()
        setLists(lists.map(l => l.id === updatedList.id ? { ...l, title: updatedList.title } : l))
        setEditingList(null)
        setNewListTitle('')
        setShowEditListModal(false)
      }
    } catch (error) {
      console.error('Error updating list:', error)
    }
  }

  const deleteList = async (listId: string) => {
    if (!confirm('Möchtest du diese Liste wirklich löschen? Alle Karten werden ebenfalls gelöscht.')) return
    
    try {
      const res = await fetch(`/api/kanban/lists/${listId}`, {
        method: 'DELETE',
      })
      
      if (res.ok) {
        setLists(lists.filter(l => l.id !== listId))
      }
    } catch (error) {
      console.error('Error deleting list:', error)
    }
  }

  // Card operations
  const createCard = async () => {
    if (!newCardTitle.trim() || !newCardListId) return
    
    try {
      const res = await fetch('/api/kanban/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newCardTitle,
          description: newCardDescription,
          list_id: newCardListId,
          assigned_to: newCardAssignedTo || null,
          due_date: newCardDueDate || null,
        }),
      })
      
      if (res.ok) {
        const card = await res.json()
        setLists(lists.map(l => 
          l.id === newCardListId 
            ? { ...l, cards: [...l.cards, card] }
            : l
        ))
        setNewCardTitle('')
        setNewCardDescription('')
        setNewCardAssignedTo('')
        setNewCardDueDate('')
        setShowNewCardModal(false)
      }
    } catch (error) {
      console.error('Error creating card:', error)
    }
  }

  const updateCard = async (card: Card) => {
    try {
      const res = await fetch(`/api/kanban/cards/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: card.title,
          description: card.description,
          assigned_to: card.assigned_to,
          due_date: card.due_date,
        }),
      })
      
      if (res.ok) {
        const updatedCard = await res.json()
        setLists(lists.map(l => ({
          ...l,
          cards: l.cards.map(c => c.id === updatedCard.id ? updatedCard : c)
        })))
        if (selectedCard?.id === updatedCard.id) {
          setSelectedCard(updatedCard)
        }
      }
    } catch (error) {
      console.error('Error updating card:', error)
    }
  }

  const deleteCard = async (cardId: string) => {
    try {
      const res = await fetch(`/api/kanban/cards/${cardId}`, {
        method: 'DELETE',
      })
      
      if (res.ok) {
        setLists(lists.map(l => ({
          ...l,
          cards: l.cards.filter(c => c.id !== cardId)
        })))
        if (selectedCard?.id === cardId) {
          setSelectedCard(null)
        }
      }
    } catch (error) {
      console.error('Error deleting card:', error)
    }
  }

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
    
    if (active.data.current?.type === 'Card') {
      setActiveCard(active.data.current.card)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    
    if (!over) return
    
    const activeId = active.id
    const overId = over.id
    
    if (activeId === overId) return
    
    const isActiveCard = active.data.current?.type === 'Card'
    const isOverCard = over.data.current?.type === 'Card'
    const isOverList = over.data.current?.type === 'ListCards'
    
    if (!isActiveCard) return
    
    // Dropping a card over another card
    if (isActiveCard && isOverCard) {
      setLists((lists) => {
        const activeList = lists.find(l => l.cards.some(c => c.id === activeId))
        const overList = lists.find(l => l.cards.some(c => c.id === overId))
        
        if (!activeList || !overList) return lists
        
        const activeIndex = activeList.cards.findIndex(c => c.id === activeId)
        const overIndex = overList.cards.findIndex(c => c.id === overId)
        
        if (activeList === overList) {
          // Same list
          const newCards = arrayMove(activeList.cards, activeIndex, overIndex)
          return lists.map(l => 
            l.id === activeList.id 
              ? { ...l, cards: newCards.map((c, i) => ({ ...c, position: i })) }
              : l
          )
        } else {
          // Different list
          const activeCard = activeList.cards[activeIndex]
          const newActiveCards = activeList.cards.filter(c => c.id !== activeId)
          const newOverCards = [...overList.cards.slice(0, overIndex), { ...activeCard, list_id: overList.id }, ...overList.cards.slice(overIndex)]
          
          return lists.map(l => {
            if (l.id === activeList.id) {
              return { ...l, cards: newActiveCards.map((c, i) => ({ ...c, position: i })) }
            }
            if (l.id === overList.id) {
              return { ...l, cards: newOverCards.map((c, i) => ({ ...c, position: i })) }
            }
            return l
          })
        }
      })
    }
    
    // Dropping a card over a list
    if (isActiveCard && isOverList) {
      setLists((lists) => {
        const activeList = lists.find(l => l.cards.some(c => c.id === activeId))
        const overList = lists.find(l => l.id === overId.replace('-cards', ''))
        
        if (!activeList || !overList || activeList === overList) return lists
        
        const activeIndex = activeList.cards.findIndex(c => c.id === activeId)
        const activeCard = activeList.cards[activeIndex]
        
        const newActiveCards = activeList.cards.filter(c => c.id !== activeId)
        const newOverCards = [...overList.cards, { ...activeCard, list_id: overList.id }]
        
        return lists.map(l => {
          if (l.id === activeList.id) {
            return { ...l, cards: newActiveCards.map((c, i) => ({ ...c, position: i })) }
          }
          if (l.id === overList.id) {
            return { ...l, cards: newOverCards.map((c, i) => ({ ...c, position: i })) }
          }
          return l
        })
      })
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    setActiveId(null)
    setActiveCard(null)
    
    if (!over) return
    
    const activeId = active.id
    const overId = over.id
    
    // Handle list reordering
    if (active.data.current?.type === 'List') {
      const oldIndex = lists.findIndex(l => l.id === activeId)
      const newIndex = lists.findIndex(l => l.id === overId)
      
      if (oldIndex !== newIndex) {
        const newLists = arrayMove(lists, oldIndex, newIndex)
        setLists(newLists)
        
        // Update positions on server
        try {
          await fetch('/api/kanban/lists', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lists: newLists.map((l, i) => ({ id: l.id, position: i })),
            }),
          })
        } catch (error) {
          console.error('Error updating list positions:', error)
        }
      }
      return
    }
    
    // Handle card reordering/moving
    if (active.data.current?.type === 'Card') {
      const card = active.data.current.card
      const activeList = lists.find(l => l.cards.some(c => c.id === card.id))
      const overList = lists.find(l => 
        l.cards.some(c => c.id === overId) || l.id === overId.replace('-cards', '')
      )
      
      if (!activeList || !overList) return
      
      const newIndex = overList.cards.findIndex(c => c.id === overId)
      const finalIndex = newIndex >= 0 ? newIndex : overList.cards.length - 1
      
      try {
        await fetch(`/api/kanban/cards/${card.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            list_id: overList.id,
            position: finalIndex,
          }),
        })
      } catch (error) {
        console.error('Error updating card:', error)
      }
    }
  }

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  // Board selection view
  if (!selectedBoard) {
    return (
      <div className="p-6 pt-24">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Layout className="w-7 h-7 text-red-600" />
            Kanban Boards
          </h1>
          <button
            onClick={() => setShowNewBoardModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Neues Board
          </button>
        </div>

        {boards.length === 0 ? (
          <div className="text-center py-12 bg-neutral-900/50 rounded-xl border border-white/10">
            <Layout className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/50 mb-4">Noch keine Boards vorhanden</p>
            <button
              onClick={() => setShowNewBoardModal(true)}
              className="text-red-500 hover:text-red-400 font-medium transition-colors"
            >
              Erstelle dein erstes Board
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <div
                key={board.id}
                className="bg-neutral-900/50 rounded-xl border border-white/10 hover:border-red-500/50 hover:bg-neutral-900/80 transition-all group"
              >
                <div 
                  className="p-6 cursor-pointer"
                  onClick={() => {
                    console.log('Clicked board:', board.id)
                    fetchBoard(board.id)
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-lg">{board.title}</h3>
                      {board.description && (
                        <p className="text-white/50 text-sm mt-1 line-clamp-2">{board.description}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteBoard(board.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 rounded-lg transition-all ml-2"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm text-white/40">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(board.created_at), 'dd.MM.yyyy', { locale: de })}
                    </span>
                    {board.created_by_user && (
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {board.created_by_user.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New Board Modal */}
        {showNewBoardModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-neutral-900 rounded-xl max-w-md w-full p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4">Neues Board erstellen</h2>
              <input
                type="text"
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                placeholder="Board-Titel"
                className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2.5 mb-3 text-white placeholder:text-white/40 focus:border-red-500 focus:outline-none"
              />
              <textarea
                value={newBoardDescription}
                onChange={(e) => setNewBoardDescription(e.target.value)}
                placeholder="Beschreibung (optional)"
                rows={3}
                className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2.5 mb-4 text-white placeholder:text-white/40 focus:border-red-500 focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowNewBoardModal(false)
                    setNewBoardTitle('')
                    setNewBoardDescription('')
                  }}
                  className="px-4 py-2 text-white/60 hover:bg-white/10 rounded-lg transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={createBoard}
                  disabled={!newBoardTitle.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  Erstellen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Board detail view
  return (
    <div className="h-full flex flex-col pt-24">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-neutral-900 gap-4">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <button
            onClick={() => {
              setSelectedBoard(null)
              setLists([])
            }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5 text-white/70" />
          </button>
          <div className="min-w-0 overflow-hidden">
            <h1 className="text-xl font-bold text-white truncate">{selectedBoard.title}</h1>
            {selectedBoard.description && (
              <p className="text-sm text-white/50 truncate">{selectedBoard.description}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowNewListModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex-shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Neue Liste</span>
        </button>
      </div>

      {/* Board Content */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden bg-black">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex items-start gap-4 p-4 h-full">
            <SortableContext 
              items={lists.map(l => l.id)} 
              strategy={horizontalListSortingStrategy}
            >
              {lists.map((list) => (
                <SortableList
                  key={list.id}
                  list={list}
                  onAddCard={(listId) => {
                    setNewCardListId(listId)
                    setShowNewCardModal(true)
                  }}
                  onEditList={(list) => {
                    setEditingList(list)
                    setNewListTitle(list.title)
                    setShowEditListModal(true)
                  }}
                  onDeleteList={deleteList}
                  onEditCard={(card) => {
                    setEditingCard(card)
                    setNewCardTitle(card.title)
                    setNewCardDescription(card.description || '')
                    setNewCardAssignedTo(card.assigned_to || '')
                    setNewCardDueDate(card.due_date ? card.due_date.split('T')[0] : '')
                    setShowEditCardModal(true)
                  }}
                  onDeleteCard={deleteCard}
                  onCardClick={(card) => setSelectedCard(card)}
                />
              ))}
            </SortableContext>
            
            {lists.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-white/50 mb-4">Noch keine Listen vorhanden</p>
                  <button
                    onClick={() => setShowNewListModal(true)}
                    className="text-red-500 hover:text-red-400 font-medium transition-colors"
                  >
                    Erstelle deine erste Liste
                  </button>
                </div>
              </div>
            )}
          </div>

          <DragOverlay dropAnimation={dropAnimation}>
            {activeId && activeCard ? (
              <div className="bg-neutral-800 p-3 rounded-lg shadow-xl border border-white/20 opacity-90 rotate-2">
                <h4 className="text-sm font-medium text-white">{activeCard.title}</h4>
                {activeCard.description && (
                  <p className="text-xs text-white/50 mt-1 line-clamp-2">{activeCard.description}</p>
                )}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* New List Modal */}
      {showNewListModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 rounded-xl max-w-md w-full p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">Neue Liste erstellen</h2>
            <input
              type="text"
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              placeholder="Listen-Titel"
              className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2.5 mb-4 text-white placeholder:text-white/40 focus:border-red-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowNewListModal(false)
                  setNewListTitle('')
                }}
                className="px-4 py-2 text-white/60 hover:bg-white/10 rounded-lg transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={createList}
                disabled={!newListTitle.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Erstellen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit List Modal */}
      {showEditListModal && editingList && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 rounded-xl max-w-md w-full p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">Liste bearbeiten</h2>
            <input
              type="text"
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              placeholder="Listen-Titel"
              className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2.5 mb-4 text-white placeholder:text-white/40 focus:border-red-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowEditListModal(false)
                  setEditingList(null)
                  setNewListTitle('')
                }}
                className="px-4 py-2 text-white/60 hover:bg-white/10 rounded-lg transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={updateList}
                disabled={!newListTitle.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Card Modal */}
      {showNewCardModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">Neue Karte erstellen</h2>
            <input
              type="text"
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              placeholder="Karten-Titel"
              className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2.5 mb-3 text-white placeholder:text-white/40 focus:border-red-500 focus:outline-none"
            />
            <textarea
              value={newCardDescription}
              onChange={(e) => setNewCardDescription(e.target.value)}
              placeholder="Beschreibung (optional)"
              rows={3}
              className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2.5 mb-3 text-white placeholder:text-white/40 focus:border-red-500 focus:outline-none"
            />
            <select
              value={newCardAssignedTo}
              onChange={(e) => setNewCardAssignedTo(e.target.value)}
              className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2.5 mb-3 text-white focus:border-red-500 focus:outline-none"
            >
              <option value="" className="bg-neutral-900">Nicht zugewiesen</option>
              {users.map((user) => (
                <option key={user.id} value={user.id} className="bg-neutral-900">
                  {user.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={newCardDueDate}
              onChange={(e) => setNewCardDueDate(e.target.value)}
              className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2.5 mb-4 text-white focus:border-red-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowNewCardModal(false)
                  setNewCardTitle('')
                  setNewCardDescription('')
                  setNewCardAssignedTo('')
                  setNewCardDueDate('')
                }}
                className="px-4 py-2 text-white/60 hover:bg-white/10 rounded-lg transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={createCard}
                disabled={!newCardTitle.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Erstellen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card Detail Modal */}
      {selectedCard && selectedBoard && (
        <CardModal
          card={selectedCard}
          list={lists.find(l => l.cards.some(c => c.id === selectedCard.id))!}
          board={selectedBoard}
          users={users}
          onClose={() => setSelectedCard(null)}
          onUpdate={(card) => {
            updateCard(card)
            setSelectedCard(card)
          }}
          onDelete={(cardId) => {
            deleteCard(cardId)
            setSelectedCard(null)
          }}
        />
      )}
    </div>
  )
}
