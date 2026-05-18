'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Calendar, MapPin, ExternalLink, Ticket, ArrowRight } from 'lucide-react'
import type { EventfrogEvent } from '@/lib/eventfrog'

export function EventsGrid({ events }: { events: EventfrogEvent[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event, index) => (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-zinc-900 rounded-xl overflow-hidden hover:bg-zinc-800 transition-colors h-full flex flex-col"
        >
          {/* Event Image */}
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

          {/* Event Content */}
          <div className="p-6 flex flex-col flex-grow">
            <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 min-h-[3.5rem]">
              {event.title}
            </h3>

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

            <div className="flex-grow" />

            {/* Price & CTA */}
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
  )
}
