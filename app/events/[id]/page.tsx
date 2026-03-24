'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Calendar, Clock, MapPin, ArrowLeft, Music, Plus, Minus, ShoppingCart, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

interface DJ {
  name: string
  type: 'main' | 'support'
}

interface Floor {
  name: string
  djs: DJ[]
  active?: boolean
}

interface Event {
  id: string
  name: string
  date: string
  time: string
  end_time?: string
  description: string
  full_description?: string
  image: string
  price: string
  type: string
  lineup?: string[]
  timetable?: Floor[]
}

export default function EventDetailPage() {
  const params = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [ticketTypes, setTicketTypes] = useState<any[]>([])
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEvent()
  }, [params.id])

  const loadEvent = async () => {
    try {
      // Load event
      const eventRes = await fetch(`/api/events/${params.id}`)
      if (eventRes.ok) {
        const eventData = await eventRes.json()
        setEvent(eventData)
      }

      // Load ticket types for this event
      const ticketsRes = await fetch(`/api/event-tickets?eventId=${params.id}`)
      if (ticketsRes.ok) {
        const ticketsData = await ticketsRes.json()
        setTicketTypes(ticketsData)
        if (ticketsData.length > 0) {
          setSelectedTicket(ticketsData[0])
        }
      }
    } catch (error) {
      console.error('Error loading event:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async () => {
    if (!selectedTicket) return

    await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_ticket_id: selectedTicket.id,
        quantity: quantity
      })
    })

    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
        <p className="text-white">Event not found</p>
      </div>
    )
  }

  const floors = event.timetable?.filter(f => f.active !== false) || null

  return (
    <div className="min-h-screen bg-black pt-24 lg:pt-32">
      {/* Hero Image */}
      <section className="relative h-[50vh] lg:h-[60vh]">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${event.image}')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />

        <div className="absolute top-6 left-4 sm:left-6 lg:left-8 z-10">
          <Button variant="ghost" size="sm" className="text-white/70 hover:text-white" asChild>
            <Link href="/events">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Link>
          </Button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8">
          <div className="container mx-auto">
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
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {event.full_description && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 font-display">About the Event</h2>
                <p className="text-white/70 text-lg leading-relaxed">{event.full_description}</p>
              </div>
            )}

            {/* Lineup */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 font-display flex items-center gap-3">
                <Music className="w-6 h-6 text-red-500" />
                Lineup
              </h2>
              
              {floors && floors.length > 0 ? (
                <div className="space-y-6">
                  {floors.map((floor) => (
                    <div key={floor.name} className="bg-neutral-900/50 rounded-xl p-6 border border-white/10">
                      <h3 className="text-lg font-semibold text-white mb-4">{floor.name}</h3>
                      <div className="flex flex-wrap gap-3">
                        {floor.djs.map((dj) => (
                          <span key={dj.name} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white">
                            {dj.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : event.lineup && event.lineup.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {event.lineup.map((artist) => (
                    <span key={artist} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white">
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
              <h3 className="text-xl font-bold text-white mb-4 font-display">Tickets</h3>
              
              {ticketTypes.length > 0 ? (
                <>
                  {/* Ticket Type Selection */}
                  <div className="space-y-2 mb-4">
                    {ticketTypes.map((ticket) => (
                      <button
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className={`w-full p-3 rounded-lg border text-left transition-colors ${
                          selectedTicket?.id === ticket.id
                            ? 'border-red-500 bg-red-500/10'
                            : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-white font-medium">{ticket.name}</span>
                          <span className="text-white font-bold">CHF {ticket.price}</span>
                        </div>
                        {ticket.description && (
                          <p className="text-white/60 text-sm mt-1">{ticket.description}</p>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/60">Quantity</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-2 border border-white/20 rounded-lg text-white hover:bg-white/10"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-white font-semibold w-8 text-center">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="p-2 border border-white/20 rounded-lg text-white hover:bg-white/10"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center mb-4 pt-4 border-t border-white/10">
                    <span className="text-white/60">Total</span>
                    <span className="text-2xl font-bold text-white">
                      CHF {(selectedTicket?.price * quantity).toFixed(2)}
                    </span>
                  </div>

                  {/* Add to Cart */}
                  <Button
                    variant="glitch"
                    size="lg"
                    className="w-full"
                    onClick={addToCart}
                    disabled={addedToCart}
                  >
                    {addedToCart ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Added to Cart
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-white/60">Entry</span>
                    <span className="text-2xl font-bold text-white">{event.price}</span>
                  </div>
                  <Button variant="glitch" size="lg" className="w-full" disabled>
                    Tickets coming soon
                  </Button>
                </>
              )}
            </div>

            {/* Location Card */}
            <div className="bg-neutral-900 rounded-lg p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4 font-display">Location</h3>
              <div className="flex items-start gap-3 text-white/70 mb-4">
                <MapPin className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p>Barcelona-Strasse 4</p>
                  <p>4142 Münchenstein</p>
                  <p>Switzerland</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/location">View on Map</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
