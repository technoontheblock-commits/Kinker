import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { Calendar, Clock, MapPin, ArrowLeft, ExternalLink, Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getEventById, getEvents } from '@/lib/events'
import { formatDate } from '@/lib/utils'

export const revalidate = 60

export async function generateStaticParams() {
  const events = await getEvents()
  return events.map((event) => ({
    id: event.id,
  }))
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const event = await getEventById(params.id)
  
  if (!event) {
    return {
      title: 'Event Not Found | KINKER BASEL',
    }
  }
  
  return {
    title: `${event.name} | KINKER BASEL`,
    description: event.description,
  }
}

// Types for the floor-based lineup structure
interface DJ {
  name: string
  type: 'main' | 'support'
}

interface Floor {
  name: string
  djs: DJ[]
  active?: boolean
}

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const event = await getEventById(params.id)
  
  if (!event) {
    notFound()
  }

  // Parse floor-based lineup from timetable, filter only active floors
  const allFloors = event.timetable as Floor[] | null
  const floors = allFloors?.filter(f => f.active !== false) || null

  return (
    <div className="min-h-screen bg-black pt-24 lg:pt-32">
      {/* Hero Image */}
      <section className="relative h-[50vh] lg:h-[60vh]">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${event.image}')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />

        {/* Back Button */}
        <div className="absolute top-6 left-4 sm:left-6 lg:left-8 z-10">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white"
            asChild
          >
            <Link href="/events">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Link>
          </Button>
        </div>

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8">
          <div className="container mx-auto">
            <div>
              <Badge variant="red" className="mb-4 uppercase tracking-wider">
                {event.type}
              </Badge>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter font-display text-white mb-4">
                {event.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-white/70">
                <span className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-red-500" />
                  {formatDate(new Date(event.date))}
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-red-500" />
                  {event.time} {event.end_time && `- ${event.end_time}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {event.full_description && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 font-display">
                  About the Event
                </h2>
                <p className="text-white/70 text-lg leading-relaxed">
                  {event.full_description}
                </p>
              </div>
            )}

            {/* Lineup by Floor */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 font-display flex items-center gap-3">
                <Music className="w-6 h-6 text-red-500" />
                Lineup
              </h2>
              
              {floors && floors.length > 0 ? (
                <div className="space-y-6">
                  {floors.map((floor) => {
                    const mainActs = floor.djs.filter(dj => dj.type === 'main')
                    const supportActs = floor.djs.filter(dj => dj.type === 'support')
                    
                    return (
                      <div 
                        key={floor.name} 
                        className="bg-neutral-900/50 rounded-xl p-6 border border-white/10"
                      >
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          {floor.name}
                        </h3>
                        
                        {mainActs.length > 0 && (
                          <div className="mb-4">
                            <span className="text-xs uppercase tracking-wider text-red-500 mb-2 block">Main Act</span>
                            <div className="flex flex-wrap gap-3">
                              {mainActs.map((dj) => (
                                <span
                                  key={dj.name}
                                  className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-white font-semibold hover:bg-red-500/30 transition-colors cursor-default"
                                >
                                  {dj.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {supportActs.length > 0 && (
                          <div>
                            <span className="text-xs uppercase tracking-wider text-white/50 mb-2 block">Support</span>
                            <div className="flex flex-wrap gap-3">
                              {supportActs.map((dj) => (
                                <span
                                  key={dj.name}
                                  className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/70 text-sm hover:border-white/30 hover:text-white transition-colors cursor-default"
                                >
                                  {dj.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {floor.djs.length === 0 && (
                          <p className="text-white/40 text-sm italic">No lineup announced yet</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : event.lineup && event.lineup.length > 0 ? (
                // Fallback for old format
                <div className="flex flex-wrap gap-3">
                  {event.lineup.map((artist) => (
                    <span
                      key={artist}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-medium hover:border-red-500/50 hover:text-red-500 transition-colors cursor-default"
                    >
                      {artist}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-white/40 italic">Lineup to be announced</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Card */}
            <div className="bg-neutral-900 rounded-lg p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4 font-display">
                Tickets
              </h3>
              <div className="flex items-center justify-between mb-6">
                <span className="text-white/60">Entry</span>
                <span className="text-2xl font-bold text-white">{event.price}</span>
              </div>
              <Button
                variant="glitch"
                size="lg"
                className="w-full"
                asChild
              >
                <a href={event.ticket_url} target="_blank" rel="noopener noreferrer">
                  Buy Tickets
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>

            {/* Location Card */}
            <div className="bg-neutral-900 rounded-lg p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4 font-display">
                Location
              </h3>
              <div className="flex items-start gap-3 text-white/70 mb-4">
                <MapPin className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p>Barcelona-Strasse 4</p>
                  <p>4057 Basel</p>
                  <p>Switzerland</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-white/20 text-white hover:bg-white hover:text-black"
                asChild
              >
                <Link href="/location">View on Map</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
