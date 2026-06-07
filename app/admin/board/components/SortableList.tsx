'use client'

import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import type { List, Card } from './types'
import { SortableCard } from './SortableCard'

export function SortableList({
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
