'use client'

import Link from 'next/link'
import { Calendar, Clock, ArrowRight, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from './language-provider'
import { useEffect, useState } from 'react'

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

export function EventsSection() {
  const { t } = useLanguage()
  const [upcomingEvents, setUpcomingEvents] = useState<EventfrogEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await fetch('/api/eventfrog/events')
        const data = await res.json()
        if (data.events) {
          // Take first 4 upcoming events
          setUpcomingEvents(data.events.slice(0, 4))
        }
      } catch (err) {
        console.error('Error loading Eventfrog events:', err)
      } finally {
        setLoading(false)
      }
    }
    loadEvents()
  }, [])

  const formatEventDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('de-DE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <section id="events" className="py-24 lg:py-32 bg-black relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter font-display text-white">
              UPCOMING<span className="text-red-500">.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[16/10] bg-neutral-900 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (upcomingEvents.length === 0) {
    return null
  }

  return (
    <section id="events" className="py-24 lg:py-32 bg-black relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 lg:mb-16">
          <div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter font-display text-white mb-4">
              UPCOMING
              <span className="text-red-500">.</span>
            </h2>
            <p className="text-white/60 text-lg">
              {t.home.events.subtitle}
            </p>
          </div>
          <Button
            variant="ghost"
            className="mt-6 md:mt-0 text-white hover:text-red-500 group"
            asChild
          >
            <Link href="/events">
              {t.home.events.viewAll}
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              className="group relative"
            >
              <Link href={`/events/${event.id}`}>
                <div className="relative aspect-[16/10] overflow-hidden bg-neutral-900 rounded-lg cursor-pointer">
                  {/* Image */}
                  {event.image ? (
                    <img
                      src={event.image}
                      alt={event.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900" />
                  )}
                  
                  {/* Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                  <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/10 transition-colors duration-500" />
                  
                  {/* Content */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-between">
                    {/* Top */}
                    <div className="flex items-start justify-between">
                      <Badge variant="red" className="uppercase tracking-wider">
                        Event
                      </Badge>
                      <span className="text-white/80 font-semibold text-lg">
                        {event.price > 0 ? `${event.price.toFixed(2)} ${event.currency}` : 'Gratis'}
                      </span>
                    </div>

                    {/* Bottom */}
                    <div>
                      <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 group-hover:text-red-500 transition-colors font-display line-clamp-2">
                        {event.title}
                      </h3>
                      <p 
                        className="text-white/70 text-sm line-clamp-2 mb-4"
                        dangerouslySetInnerHTML={{ __html: event.description }}
                      />
                      <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-red-500" />
                          {formatEventDate(event.date)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock size={14} className="text-red-500" />
                          {event.time}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <ExternalLink size={14} className="text-red-500" />
                          Details
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-12 text-center md:hidden">
          <Button variant="glitch" size="lg" asChild className="w-full">
            <Link href="/events">{t.home.events.viewAll}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
