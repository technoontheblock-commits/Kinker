'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Calendar, Clock, MapPin, ArrowLeft, Music, Plus, Minus,
  ShoppingCart, Check, ExternalLink, Crown, Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

// --- Internal Event Types ---
interface DJ { name: string; type: 'main' | 'support' }
interface Floor { name: string; djs: DJ[]; active?: boolean }

interface InternalEvent {
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

// --- Eventfrog Event Type ---
interface EventfrogEvent {
  id: string
  title: string
  description: string
  date: string
  time: string
  endDate?: string
  endTime?: string
  location: string
  price: number
  currency: string
  image: string
  url: string
  soldOut: boolean
  organizerId?: string
  organizerName?: string
}

type EventData =
  | { source: 'internal'; data: InternalEvent }
  | { source: 'eventfrog'; data: EventfrogEvent }

export default function EventDetailPage() {
  const params = useParams()
  const [event, setEvent] = useState<EventData | null>(null)
  const [ticketTypes, setTicketTypes] = useState<any[]>([])
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadEvent()
  }, [params.id])

  const loadEvent = async () => {
    try {
      setLoading(true)
      setError('')

      // 1. Try internal event first
      const internalRes = await fetch(`/api/events/${params.id}`)
      if (internalRes.ok) {
        const internalData = await internalRes.json()
        if (internalData && internalData.id) {
          setEvent({ source: 'internal', data: internalData })

          // Load ticket types
          const ticketsRes = await fetch(`/api/event-tickets?eventId=${params.id}`)
          if (ticketsRes.ok) {
            const ticketsData = await ticketsRes.json()
            setTicketTypes(ticketsData)
            if (ticketsData.length > 0) {
              setSelectedTicket(ticketsData[0])
            }
          }
          setLoading(false)
          return
        }
      }

      // 2. Fallback to Eventfrog
      const eventfrogRes = await fetch(`/api/eventfrog/event/${params.id}`)
      if (eventfrogRes.ok) {
        const eventfrogData = await eventfrogRes.json()
        if (eventfrogData.event) {
          setEvent({ source: 'eventfrog', data: eventfrogData.event })
          setLoading(false)
          return
        }
      }

      setError('Event not found')
    } catch (err: any) {
      setError(err.message || 'Failed to load event')
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

  const buyNow = async () => {
    if (!selectedTicket) return
    await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_ticket_id: selectedTicket.id,
        quantity: quantity
      })
    })
    window.location.href = '/checkout'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60 text-lg mb-4">{error || 'Event not found'}</p>
          <Button variant="outline" asChild>
            <Link href="/events">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // ==================== EVENTFROG EVENT RENDER ====================
  if (event.source === 'eventfrog') {
    const e = event.data
    return (
      <div className="min-h-screen bg-black pt-24 lg:pt-32">
        {/* Hero Image */}
        <section className="relative h-[50vh] lg:h-[60vh]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${e.image || ''}')` }}
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
                Event
              </Badge>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter font-display text-white mb-4">
                {e.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-white/70">
                <span className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-red-500" />
                  {e.date} • {e.time}
                </span>
                {e.endDate && (
                  <span className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-red-500" />
                    End: {e.endDate} {e.endTime && `• ${e.endTime}`}
                  </span>
                )}
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
              {e.description && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4 font-display">About the Event</h2>
                  <div
                    className="text-white/70 text-lg leading-relaxed prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: e.description }}
                  />
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Location */}
              <div className="bg-neutral-900 rounded-lg p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4 font-display">Location</h3>
                <div className="flex items-start gap-3 text-white/70 mb-4">
                  <MapPin className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-white">{e.location}</p>
                    <p>Barcelona-Strasse 4</p>
                    <p>4142 Münchenstein</p>
                    <p>Switzerland</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/location">View on Map</Link>
                </Button>
              </div>

              {/* Tickets */}
              <div className="bg-neutral-900 rounded-lg p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4 font-display">Tickets</h3>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-white/60">Entry</span>
                  <span className="text-2xl font-bold text-white">
                    {e.price > 0 ? `${e.price.toFixed(2)} ${e.currency}` : 'Gratis'}
                  </span>
                </div>
                {e.soldOut ? (
                  <Button variant="glitch" size="lg" className="w-full" disabled>
                    AUSVERKAUFT
                  </Button>
                ) : (
                  <a
                    href={e.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-4 px-6 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Tickets on Eventfrog
                  </a>
                )}
              </div>

              {/* VIP Room Booking */}
              <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-lg p-6 border border-yellow-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <Crown className="w-6 h-6 text-yellow-400" />
                  <h3 className="text-xl font-bold text-white font-display">VIP Room</h3>
                </div>
                <p className="text-white/60 text-sm mb-4">
                  Experience the ultimate luxury at KINKER. Book your VIP room for an unforgettable night.
                </p>
                <div className="flex items-start gap-2 text-yellow-400/80 text-sm mb-4">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Includes exclusive seating, premium service, and bottle service options.</span>
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300"
                  asChild
                >
                  <Link href="/vip-booking">
                    <Crown className="mr-2 h-4 w-4" />
                    Book VIP Room
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  // ==================== INTERNAL EVENT RENDER (existing logic) ====================
  const e = event.data
  const floors = e.timetable?.filter(f => f.active !== false) || null

  return (
    <div className="min-h-screen bg-black pt-24 lg:pt-32">
      {/* Hero Image */}
      <section className="relative h-[50vh] lg:h-[60vh]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${e.image}')` }}
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
              {e.type}
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter font-display text-white mb-4">
              {e.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-white/70">
              <span className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-red-500" />
                {formatDate(new Date(e.date))}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-red-500" />
                {e.time} {e.end_time && `- ${e.end_time}`}
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
            {e.full_description && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 font-display">About the Event</h2>
                <p className="text-white/70 text-lg leading-relaxed">{e.full_description}</p>
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
              ) : e.lineup && e.lineup.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {e.lineup.map((artist) => (
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

                  <div className="flex justify-between items-center mb-4 pt-4 border-t border-white/10">
                    <span className="text-white/60">Total</span>
                    <span className="text-2xl font-bold text-white">
                      CHF {(selectedTicket?.price * quantity).toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={addToCart}
                    disabled={addedToCart}
                    className="w-full py-4 px-6 bg-white text-black font-semibold rounded-lg hover:bg-white/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {addedToCart ? (
                      <>
                        <Check className="w-5 h-5" />
                        Added to Cart
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        Add to Cart
                      </>
                    )}
                  </button>

                  <button
                    onClick={buyNow}
                    className="w-full py-4 px-6 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 mt-3"
                  >
                    Buy Now
                  </button>

                  <div className="text-center mt-4">
                    <Link href="/cart" className="text-white/60 hover:text-white text-sm underline">
                      View Cart
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-white/60">Entry</span>
                    <span className="text-2xl font-bold text-white">{e.price}</span>
                  </div>
                  <Button variant="glitch" size="lg" className="w-full" disabled>
                    Tickets coming soon
                  </Button>
                </>
              )}
            </div>

            {/* VIP Room Booking */}
            <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-lg p-6 border border-yellow-500/20">
              <div className="flex items-center gap-3 mb-3">
                <Crown className="w-6 h-6 text-yellow-400" />
                <h3 className="text-xl font-bold text-white font-display">VIP Room</h3>
              </div>
              <p className="text-white/60 text-sm mb-4">
                Experience the ultimate luxury at KINKER. Book your VIP room for an unforgettable night.
              </p>
              <div className="flex items-start gap-2 text-yellow-400/80 text-sm mb-4">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Includes exclusive seating, premium service, and bottle service options.</span>
              </div>
              <Button
                variant="outline"
                size="lg"
                className="w-full border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300"
                asChild
              >
                <Link href="/vip-booking">
                  <Crown className="mr-2 h-4 w-4" />
                  Book VIP Room
                </Link>
              </Button>
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
