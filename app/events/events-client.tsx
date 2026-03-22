'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, Clock, Filter, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Event } from '@/lib/database.types'

type EventType = 'all' | 'clubnight' | 'festival' | 'special'

interface EventsClientProps {
  events: Event[]
}

export function EventsClient({ events }: EventsClientProps) {
  const [activeFilter, setActiveFilter] = useState<EventType>('all')

  const filteredEvents = events.filter((event) =>
    activeFilter === 'all' ? true : event.type === activeFilter
  )

  return (
    <div className="min-h-screen bg-black pt-24 lg:pt-32">
      {/* Header */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div>
          <span className="text-red-500 font-semibold tracking-widest uppercase text-sm mb-4 block">
            What&apos;s On
          </span>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter font-display text-white">
            EVENTS
          </h1>
        </div>
      </section>

      {/* Filters */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="w-5 h-5 text-white/60 mr-2" />
          <FilterButton type="all" active={activeFilter} onClick={setActiveFilter}>
            All Events
          </FilterButton>
          <FilterButton type="clubnight" active={activeFilter} onClick={setActiveFilter}>
            Club Nights
          </FilterButton>
          <FilterButton type="special" active={activeFilter} onClick={setActiveFilter}>
            Special Events
          </FilterButton>
          <FilterButton type="festival" active={activeFilter} onClick={setActiveFilter}>
            Festivals
          </FilterButton>
        </div>
      </section>

      {/* Events Grid */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-24">
            <p className="text-white/60 text-lg">
              No events found for this filter.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}

function FilterButton({
  type,
  active,
  onClick,
  children,
}: {
  type: EventType
  active: EventType
  onClick: (type: EventType) => void
  children: React.ReactNode
}) {
  const isActive = active === type
  
  return (
    <button
      onClick={() => onClick(type)}
      className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
        isActive
          ? 'bg-red-500 text-white'
          : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function EventCard({ event }: { event: Event }) {
  // Parse timetable from JSON
  const timetable = event.timetable as Array<{ time: string; artist: string }> | null
  
  return (
    <Link href={`/events/${event.id}`} className="group block">
      <div className="relative bg-neutral-900 rounded-lg overflow-hidden border border-white/10 hover:border-red-500/50 transition-colors duration-300">
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="relative w-full md:w-2/5 aspect-video md:aspect-auto">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{
                backgroundImage: `url('${event.image}')`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-neutral-900/50 hidden md:block" />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent md:hidden" />
          </div>

          {/* Content */}
          <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-4">
                <Badge variant="red" className="uppercase tracking-wider">
                  {event.type}
                </Badge>
                <span className="text-white/80 font-semibold">
                  {event.price}
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 group-hover:text-red-500 transition-colors font-display">
                {event.name}
              </h2>

              <p className="text-white/60 mb-4 line-clamp-2">
                {event.description}
              </p>

              <div className="flex flex-wrap gap-4 text-sm text-white/50 mb-6">
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-red-500" />
                  {formatDate(new Date(event.date))}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-red-500" />
                  {event.time} {event.end_time && `- ${event.end_time}`}
                </span>
              </div>

              {/* Lineup Preview */}
              <div className="flex flex-wrap gap-2">
                {event.lineup.slice(0, 3).map((artist) => (
                  <span
                    key={artist}
                    className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded"
                  >
                    {artist}
                  </span>
                ))}
                {event.lineup.length > 3 && (
                  <span className="text-xs text-white/40 px-2 py-1">
                    +{event.lineup.length - 3} more
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white group/btn">
                View Details
                <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
              <Button variant="glitch" size="sm">
                Tickets
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
