import Link from 'next/link'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getUpcomingEvents } from '@/lib/events'
import { formatDate } from '@/lib/utils'

export async function EventsSection() {
  const upcomingEvents = await getUpcomingEvents(4)

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
              Experience the underground. Book your tickets now.
            </p>
          </div>
          <Button
            variant="ghost"
            className="mt-6 md:mt-0 text-white hover:text-red-500 group"
            asChild
          >
            <Link href="/events">
              View All Events
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
                <div className="relative aspect-[16/10] overflow-hidden bg-neutral-900 rounded-lg">
                  {/* Image */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{
                      backgroundImage: `url('${event.image}')`,
                    }}
                  >
                    {/* Fallback gradient if image fails */}
                    <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900" />
                  </div>
                  
                  {/* Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                  <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/10 transition-colors duration-500" />
                  
                  {/* Content */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-between">
                    {/* Top */}
                    <div className="flex items-start justify-between">
                      <Badge variant="red" className="uppercase tracking-wider">
                        {event.type}
                      </Badge>
                      <span className="text-white/80 font-semibold text-lg">
                        {event.price}
                      </span>
                    </div>

                    {/* Bottom */}
                    <div>
                      <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 group-hover:text-red-500 transition-colors font-display">
                        {event.name}
                      </h3>
                      <p className="text-white/70 text-sm line-clamp-2 mb-4">
                        {event.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-red-500" />
                          {formatDate(new Date(event.date))}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock size={14} className="text-red-500" />
                          {event.time}
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
            <Link href="/events">View All Events</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
