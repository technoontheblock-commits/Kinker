'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MessageSquare, Trash2, Edit2, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import type { Card } from './types'

export function SortableCard({
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
