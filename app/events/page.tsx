'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Calendar, MapPin, ExternalLink, Loader2, Ticket, ArrowRight } from 'lucide-react'

interface EventfrogEvent {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  price: number
  currency: string
  image: string
  url: string
  soldOut: boolean
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventfrogEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/eventfrog/events')
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load events')
      }
      
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
          <p className="text-red-500">Error: {error}</p>
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
          <div className="text-center py-12">
            <p className="text-white/60">Keine Events gefunden</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-zinc-900 rounded-xl overflow-hidden hover:bg-zinc-800 transition-colors h-full flex flex-col"
              >
                {/* Event Image — fixed aspect ratio */}
                <div className="aspect-video relative overflow-hidden flex-shrink-0">
                  {event.image ? (
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-800" />
                  )}
                  {event.soldOut && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">AUSVERKAUFT</span>
                    </div>
                  )}
                </div>

                {/* Event Content — grows to fill, pushes buttons to bottom */}
                <div className="p-6 flex flex-col flex-grow">
                  {/* Title — fixed 2-line height */}
                  <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 min-h-[3.5rem]">
                    {event.title}
                  </h3>

                  {/* Meta info — fixed height block */}
                  <div className="space-y-2 mb-4 flex-shrink-0">
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>{event.date} • {event.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  </div>

                  {/* Spacer pushes buttons to bottom */}
                  <div className="flex-grow" />

                  {/* Price & CTA — always at bottom */}
                  <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/5">
                    <div className="text-white font-bold whitespace-nowrap">
                      {event.price > 0 ? (
                        <span>{event.price.toFixed(2)} {event.currency}</span>
                      ) : (
                        <span className="text-green-400">Gratis</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/events/${event.id}`}
                        className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <ArrowRight className="w-4 h-4" />
                        Details
                      </Link>
                      <a
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Ticket className="w-4 h-4" />
                        Tickets
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
