'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Calendar, 
  Trash2, 
  ChevronLeft,
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
} from '@dnd-kit/sortable'

import type { UserType, Card, List, Board } from './components/types'
import { SortableList } from './components/SortableList'
import { CardModal } from './components/CardModal'

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
    setActiveId(String(active.id))
    
    if (active.data.current?.type === 'Card') {
      setActiveCard(active.data.current.card)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    
    if (!over) return
    
    const activeId = String(active.id)
    const overId = String(over.id)
    
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
        const overList = lists.find(l => l.id === overId.replace('-cards', '') as string)
        
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
    
    const activeId = String(active.id)
    const overId = String(over.id)
    
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
        l.cards.some(c => c.id === overId) || l.id === overId.replace('-cards', '') as string
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
