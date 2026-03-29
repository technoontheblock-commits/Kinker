'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Clock, Filter, ArrowRight, ShoppingCart, X, Plus, Minus, Trash2, Ticket, Tag, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Event } from '@/lib/database.types'
import { useLanguage } from '@/components/language-provider'

type EventType = 'all' | 'clubnight' | 'festival' | 'special'

interface EventsClientProps {
  events: Event[]
}

interface CartItem {
  id: string
  event_ticket_id: string
  quantity: number
  event_ticket: {
    id: string
    name: string
    price: number
    event: {
      id: string
      name: string
      date: string
      image: string
    }
  }
}

export function EventsClient({ events }: EventsClientProps) {
  const { t } = useLanguage()
  const [activeFilter, setActiveFilter] = useState<EventType>('all')
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartData, setCartData] = useState<any>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [cartLoading, setCartLoading] = useState(false)
  const [discountCode, setDiscountCode] = useState('')
  const [discountLoading, setDiscountLoading] = useState(false)
  const [discountError, setDiscountError] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null)

  // Load cart on mount
  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = async () => {
    try {
      const res = await fetch('/api/cart')
      if (res.ok) {
        const data = await res.json()
        setCart(data.items || [])
        setCartData(data)
        setAppliedDiscount(data.discount)
      }
    } catch (error) {
      console.error('Error loading cart:', error)
    }
  }

  const applyDiscount = async () => {
    if (!discountCode.trim()) return
    
    setDiscountLoading(true)
    setDiscountError('')
    
    try {
      const res = await fetch('/api/cart/discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountCode.trim() })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setAppliedDiscount(data.discount)
        setDiscountCode('')
        await loadCart()
      } else {
        setDiscountError(data.error || 'Invalid code')
      }
    } catch (error) {
      setDiscountError('Failed to apply code')
    } finally {
      setDiscountLoading(false)
    }
  }

  const removeDiscount = async () => {
    await fetch('/api/cart/discount', { method: 'DELETE' })
    setAppliedDiscount(null)
    await loadCart()
  }

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return
    setCartLoading(true)
    try {
      const res = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId, quantity })
      })
      if (res.ok) {
        loadCart()
      }
    } catch (error) {
      console.error('Error updating cart:', error)
    } finally {
      setCartLoading(false)
    }
  }

  const removeItem = async (itemId: string) => {
    setCartLoading(true)
    try {
      const res = await fetch(`/api/cart?itemId=${itemId}`, { method: 'DELETE' })
      if (res.ok) {
        loadCart()
      }
    } catch (error) {
      console.error('Error removing item:', error)
    } finally {
      setCartLoading(false)
    }
  }

  const cartSubtotal = cart.reduce((sum, item) => sum + ((item.event_ticket?.price || 0) * item.quantity), 0)
  const cartTotal = cartData?.total ?? cartSubtotal
  const discountAmount = cartData?.discountAmount ?? 0
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const filteredEvents = events.filter((event) =>
    activeFilter === 'all' ? true : event.type === activeFilter
  )

  return (
    <div className="min-h-screen bg-black pt-24 lg:pt-32">
      {/* Header */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-red-500 font-semibold tracking-widest uppercase text-sm mb-4 block">
              {t.events.whatsOn}
            </span>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter font-display text-white">
              EVENTS
            </h1>
          </div>
          
          {/* Cart Button */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative p-3 bg-neutral-900 border border-white/10 rounded-lg hover:border-red-500/50 transition-colors"
          >
            <ShoppingCart className="w-6 h-6 text-white" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </section>

      {/* Cart Sidebar */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />
          
          {/* Cart Panel */}
          <div className="relative w-full max-w-md bg-neutral-900 border-l border-white/10 h-full overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white font-display">Your Cart</h2>
                <button
                  onClick={() => setCartOpen(false)}
                  className="p-2 text-white/60 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <p className="text-white/60">Your cart is empty</p>
                  <p className="text-white/40 text-sm mt-2">Add tickets to get started</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map((item) => (
                      <div key={item.id} className="bg-black/30 rounded-lg p-4 border border-white/5">
                        <div className="flex items-start gap-3 mb-3">
                          <div 
                            className="w-16 h-16 bg-neutral-800 rounded bg-cover bg-center flex-shrink-0"
                            style={{ backgroundImage: item.event_ticket?.event?.image ? `url('${item.event_ticket.event.image}')` : undefined }}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-semibold truncate">{item.event_ticket?.event?.name || 'Event'}</h3>
                            <p className="text-white/60 text-sm">{item.event_ticket?.name || 'Ticket'}</p>
                            <p className="text-red-500 font-bold">CHF {item.event_ticket?.price || 0}</p>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            disabled={cartLoading}
                            className="p-1 text-white/40 hover:text-red-500 disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={cartLoading || item.quantity <= 1}
                              className="p-1 border border-white/20 rounded text-white hover:bg-white/10 disabled:opacity-50"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-white font-semibold w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={cartLoading}
                              className="p-1 border border-white/20 rounded text-white hover:bg-white/10 disabled:opacity-50"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <span className="text-white font-bold">
                            CHF {(item.event_ticket.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Discount Code */}
                  <div className="border-t border-white/10 pt-4 mb-4">
                    {appliedDiscount ? (
                      <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg mb-3">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-green-500" />
                          <div>
                            <p className="text-green-500 font-medium text-sm">{appliedDiscount.name}</p>
                            <p className="text-white/60 text-xs">Code: {appliedDiscount.code}</p>
                          </div>
                        </div>
                        <button 
                          onClick={removeDiscount}
                          className="text-white/40 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 mb-3">
                        <div className="flex-1 relative">
                          <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                          <input
                            type="text"
                            value={discountCode}
                            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                            placeholder="Reward Code (KINKER-XXX)"
                            className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-10 pr-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-red-500"
                          />
                        </div>
                        <button
                          onClick={applyDiscount}
                          disabled={discountLoading || !discountCode.trim()}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
                        >
                          {discountLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                        </button>
                      </div>
                    )}
                    {discountError && (
                      <p className="text-red-500 text-xs mb-3">{discountError}</p>
                    )}
                  </div>

                  {/* Total & Checkout */}
                  <div className="border-t border-white/10 pt-4">
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-white/60 text-sm">
                        <span>Subtotal</span>
                        <span>CHF {cartSubtotal.toFixed(2)}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex items-center justify-between text-green-500 text-sm">
                          <span>Discount</span>
                          <span>- CHF {discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-white/10">
                        <span className="text-white/60">Total</span>
                        <span className="text-2xl font-bold text-white">CHF {cartTotal.toFixed(2)}</span>
                      </div>
                    </div>
                    <Link
                      href="/checkout"
                      onClick={() => setCartOpen(false)}
                      className="block w-full py-4 px-6 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors text-center"
                    >
                      Proceed to Checkout
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="w-5 h-5 text-white/60 mr-2" />
          <FilterButton type="all" active={activeFilter} onClick={setActiveFilter}>
            {t.events.filters.all}
          </FilterButton>
          <FilterButton type="clubnight" active={activeFilter} onClick={setActiveFilter}>
            {t.events.filters.clubnight}
          </FilterButton>
          <FilterButton type="special" active={activeFilter} onClick={setActiveFilter}>
            {t.events.filters.special}
          </FilterButton>
          <FilterButton type="festival" active={activeFilter} onClick={setActiveFilter}>
            {t.events.filters.festival}
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
              {t.events.noEvents}
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
  const { t } = useLanguage()
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
                    +{event.lineup.length - 3} {t.events.more}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white group/btn">
                {t.events.viewDetails}
                <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
              <Button variant="glitch" size="sm">
                {t.events.tickets}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
