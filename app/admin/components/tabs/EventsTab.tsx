'use client'

import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, X } from 'lucide-react'
import { EventForm } from '../../EventForm'

interface EventsTabProps {
  events: any[]
  showAddEvent: boolean
  setShowAddEvent: (v: boolean) => void
  editingEvent: any
  setEditingEvent: (e: any) => void
  handleEditEvent: (event: any) => void
  handleDeleteEvent: (id: string) => Promise<void>
  loadEvents: () => Promise<void>
}

export default function EventsTab({
  events,
  showAddEvent,
  setShowAddEvent,
  editingEvent,
  setEditingEvent,
  handleEditEvent,
  handleDeleteEvent,
  loadEvents
}: EventsTabProps) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">Events</h1>
          <button
            onClick={() => setShowAddEvent(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Event
          </button>
        </div>

        {/* Events Table */}
        <div className="bg-neutral-900/50 rounded-xl border border-white/10 overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-black/30">
              <tr>
                <th className="text-left text-white/60 font-medium px-6 py-4">Name</th>
                <th className="text-left text-white/60 font-medium px-6 py-4">Date</th>
                <th className="text-left text-white/60 font-medium px-6 py-4">Lineup</th>
                <th className="text-left text-white/60 font-medium px-6 py-4">Type</th>
                <th className="text-left text-white/60 font-medium px-6 py-4">Price</th>
                <th className="text-left text-white/60 font-medium px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-t border-white/10">
                  <td className="px-6 py-4 text-white font-medium">{event.name}</td>
                  <td className="px-6 py-4 text-white/60">{new Date(event.date).toLocaleDateString('de-CH')}</td>
                  <td className="px-6 py-4">
                    {event.timetable && Array.isArray(event.timetable) && event.timetable.length > 0 ? (
                      <div className="space-y-1">
                        {event.timetable.map((floor: any) => {
                          const isActive = floor.active !== false
                          return (
                            <div key={floor.name} className={`text-xs ${!isActive ? 'opacity-40' : ''}`}>
                              <span className="text-red-500 font-medium">{floor.name}:</span>
                              {isActive ? (
                                floor.djs && floor.djs.length > 0 ? (
                                  <span className="text-white/60 ml-1">
                                    {floor.djs.map((dj: any) => `${dj.name}${dj.type === 'main' ? '★' : ''}`).join(', ')}
                                  </span>
                                ) : (
                                  <span className="text-white/40 ml-1 italic">empty</span>
                                )
                              ) : (
                                <span className="text-white/40 ml-1 italic">(inactive)</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : event.lineup && event.lineup.length > 0 ? (
                      <span className="text-white/60 text-sm">{event.lineup.join(', ')}</span>
                    ) : (
                      <span className="text-white/40 text-sm italic">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs bg-white/10 text-white/70 uppercase">
                      {event.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white/60">{event.price}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditEvent(event)}
                        className="p-2 text-white/60 hover:text-white transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-2 text-white/60 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add/Edit Event Modal */}
      {showAddEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-900 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingEvent ? 'Edit Event' : 'Add New Event'}
              </h2>
              <button
                onClick={() => {
                  setShowAddEvent(false)
                  setEditingEvent(null)
                }}
                className="p-2 text-white/60 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <EventForm
              event={editingEvent}
              onClose={() => {
                setShowAddEvent(false)
                setEditingEvent(null)
              }}
              onSuccess={() => {
                loadEvents()
                setShowAddEvent(false)
                setEditingEvent(null)
              }}
            />
          </motion.div>
        </div>
      )}
    </>
  )
}
