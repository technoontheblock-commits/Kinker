'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  ExternalLink,
  Loader2,
  Ticket,
  AlertCircle
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface EventfrogEvent {
  id: string
  title: string
  description: string
  shortDescription: string
  date: string
  time: string
  endTime: string
  location: string
  price: number
  currency: string
  image: string
  url: string
  presaleUrl: string
  soldOut: boolean
  cancelled: boolean
  categories: number[]
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventfrogEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [useEventfrog, setUseEventfrog] = useState(true)

  useEffect(() => {
    if (useEventfrog) {
      loadEventfrogEvents()
    }
  }, [useEventfrog])

  const loadEventfrogEvents = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/eventfrog/events')
      
      if (!res.ok) {
        throw new Error('Failed to load events')
      }
      
      const data = await res.json()
      setEvents(data.events || [])
    } catch (err: any) {
      setError(err.message)
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

  if (error) {
    return (
      <div className="min-h-screen bg-black pt-24">
        <div className="container mx-auto px-4 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Fehler beim Laden</h1>
          <p className="text-white/60 mb-6">{error}</p>
          <button
            onClick={() => setUseEventfrog(false)}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Lokale Events anzeigen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Events</h1>
          <p className="text-white/60 text-lg">
            Unsere kommenden Veranstaltungen
          </p>
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-white/60 text-lg">Keine Events gefunden</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-zinc-900 rounded-xl overflow-hidden border border-white/10 hover:border-red-500/30 transition-all group"
              >
                {/* Event Image */}
                {event.image && (
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {event.soldOut && (
                      <div className="absolute top-4 right-4 px-3 py-1 bg-red-600 text-white text-sm font-medium rounded-full">
                        Ausverkauft
                      </div>
                    )}
                    {event.cancelled && (
                      <div className="absolute top-4 right-4 px-3 py-1 bg-zinc-600 text-white text-sm font-medium rounded-full">
                        Abgesagt
                      </div>
                    )}
                  </div>
                )}

                {/* Event Content */}
                <div className="p-6">
                  <h2 className="text-xl font-bold text-white mb-2 group-hover:text-red-500 transition-colors">
                    {event.title}
                  </h2>
                  
                  {event.shortDescription && (
                    <p className="text-white/60 text-sm mb-4 line-clamp-2">
                      {event.shortDescription}
                    </p>
                  )}

                  <div className="space-y-2 text-sm text-white/50 mb-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(new Date(event.date))}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{event.time} {event.endTime && `- ${event.endTime}`}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between">
                    <div>
                      {event.price ? (
                        <span className="text-white font-medium">
                          Ab {event.price} {event.currency}
                        </span>
                      ) : (
                        <span className="text-white/50">Preis auf Anfrage</span>
                      )}
                    </div>
                    
                    <a
                      href={event.presaleUrl || event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      <Ticket className="w-4 h-4" />
                      Tickets
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-white/40 text-sm">
            Alle Tickets werden über Eventfrog verkauft
          </p>
        </div>
      </div>
    </div>
  )
}
