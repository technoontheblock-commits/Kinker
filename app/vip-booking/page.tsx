'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Crown, 
  Calendar, 
  Clock, 
  Check, 
  Wine, 
  GlassWater, 
  Beer,
  Info,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'

interface Event {
  id: string
  name: string
  date: string
  time: string
  description?: string
}

interface VIPPackage {
  id: string
  name: string
  price: string
  features: string[]
  icon: React.ReactNode
  color: string
}

const vipPackages: VIPPackage[] = [
  {
    id: 'Bronze',
    name: 'Bronze',
    price: 'CHF 500',
    features: [
      'VIP Room',
      'Sekt'
    ],
    icon: <Wine className="w-6 h-6" />,
    color: 'from-amber-700 to-amber-500'
  },
  {
    id: 'Silver',
    name: 'Silver',
    price: 'CHF 800',
    features: [
      'VIP Room',
      'Sekt',
      'Softdrinks'
    ],
    icon: <GlassWater className="w-6 h-6" />,
    color: 'from-gray-400 to-gray-200'
  },
  {
    id: 'Gold',
    name: 'Gold',
    price: 'CHF 1,200',
    features: [
      'VIP Room',
      'Sekt',
      'Softdrinks',
      '2 bottles of vodka'
    ],
    icon: <Crown className="w-6 h-6" />,
    color: 'from-yellow-500 to-yellow-300'
  }
]

export default function VIPBookingPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const [existingBookings, setExistingBookings] = useState<string[]>([])

  useEffect(() => {
    checkAuth()
    loadEvents()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/session')
      const data = await res.json()
      if (data.user) {
        setUser(data.user)
        loadUserBookings(data.user.id)
      }
    } catch (error) {
      console.error('Error checking auth:', error)
    }
  }

  const loadEvents = async () => {
    try {
      const res = await fetch('/api/events')
      if (res.ok) {
        const data = await res.json()
        // Filter only future events
        const futureEvents = data.filter((e: Event) => {
          const eventDate = new Date(e.date)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          return eventDate >= today
        })
        setEvents(futureEvents)
      }
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserBookings = async (userId: string) => {
    try {
      const res = await fetch('/api/vip-bookings')
      if (res.ok) {
        const data = await res.json()
        // Get event IDs where user has pending or approved bookings
        const bookedEventIds = data
          .filter((b: any) => ['pending', 'approved'].includes(b.status))
          .map((b: any) => b.event_id)
        setExistingBookings(bookedEventIds)
      }
    } catch (error) {
      console.error('Error loading user bookings:', error)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay() || 7 // Convert Sunday (0) to 7
    
    return { daysInMonth, startingDay: startingDay - 1 } // Adjust to 0-indexed Monday
  }

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return events.filter(e => e.date === dateStr)
  }

  const isDateBooked = (date: Date) => {
    const dateEvents = getEventsForDate(date)
    return dateEvents.some(e => existingBookings.includes(e.id))
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const dateEvents = getEventsForDate(clickedDate)
    
    if (dateEvents.length > 0 && !isDateBooked(clickedDate)) {
      setSelectedEvent(dateEvents[0])
      setSelectedPackage(null)
      setMessage(null)
    }
  }

  const handleCheckout = async () => {
    console.log('handleCheckout called', { user: !!user, selectedEvent, selectedPackage })
    
    if (!user) {
      console.log('No user, redirecting to login')
      router.push('/login?redirect=/vip-booking')
      return
    }

    if (!selectedEvent || !selectedPackage) {
      console.log('Missing selection', { selectedEvent, selectedPackage })
      setMessage({ type: 'error', text: 'Please select an event and package' })
      return
    }

    setSubmitting(true)
    setMessage(null)

    try {
      // Get package details
      const pkg = vipPackages.find(p => p.id === selectedPackage)
      console.log('Found package:', pkg)
      if (!pkg) {
        setMessage({ type: 'error', text: 'Invalid package selected' })
        setSubmitting(false)
        return
      }

      // Parse price (remove CHF and commas)
      const priceString = pkg.price.replace('CHF ', '').replace(',', '')
      const price = parseFloat(priceString)
      console.log('Parsed price:', price)

      // First create a VIP booking record
      console.log('Creating VIP booking...')
      const bookingRes = await fetch('/api/vip-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: selectedEvent.id,
          package: selectedPackage,
          notes: notes || undefined
        })
      })

      console.log('Booking response status:', bookingRes.status)

      if (!bookingRes.ok) {
        const error = await bookingRes.json()
        console.error('Booking error:', error)
        setMessage({ type: 'error', text: error.error || 'Failed to create booking' })
        setSubmitting(false)
        return
      }

      const booking = await bookingRes.json()
      console.log('Booking created:', booking)

      console.log('Adding to cart:', { vip_booking_id: booking.id, selectedPackage, price })
      
      // Add to cart via API
      const cartRes = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vip_booking_id: booking.id,
          quantity: 1,
          selected_size: selectedPackage,
          metadata: {
            type: 'vip_booking',
            package: selectedPackage,
            event_name: selectedEvent.name,
            event_date: selectedEvent.date,
            price: price,
            notes: notes || ''
          }
        })
      })

      console.log('Cart response status:', cartRes.status)
      
      if (!cartRes.ok) {
        const error = await cartRes.json()
        console.error('Cart error:', error)
        setMessage({ type: 'error', text: error.error || 'Failed to add to cart' })
        setSubmitting(false)
        return
      }
      
      const cartData = await cartRes.json()
      console.log('Cart data:', cartData)

      // Trigger cart update event
      window.dispatchEvent(new Event('cartUpdated'))

      // Redirect to standard checkout
      router.push('/checkout')
    } catch (error) {
      console.error('Checkout error:', error)
      setMessage({ type: 'error', text: 'An error occurred during checkout' })
      setSubmitting(false)
    }
  }

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth)
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            VIP Room <span className="text-red-500">Booking</span>
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto">
            Experience the ultimate luxury at Kinker Basel. Book your VIP room for an unforgettable night.
          </p>
        </motion.div>

        {/* Message */}
        {message && message.type === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-lg bg-red-500/20 text-red-500 border border-red-500/30"
          >
            {message.text}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calendar Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-zinc-900 rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-red-500" />
                Select Date
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-white font-medium min-w-[140px] text-center">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-white/40 text-sm py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before start of month */}
              {Array.from({ length: startingDay }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              
              {/* Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                const dateEvents = getEventsForDate(date)
                const hasEvent = dateEvents.length > 0
                const isBooked = isDateBooked(date)
                const isSelected = selectedEvent?.date === date.toISOString().split('T')[0]
                const isPast = date < new Date(new Date().setHours(0, 0, 0, 0))

                return (
                  <button
                    key={day}
                    onClick={() => !isPast && hasEvent && !isBooked && handleDateClick(day)}
                    disabled={isPast || !hasEvent || isBooked}
                    className={`
                      aspect-square rounded-lg flex flex-col items-center justify-center text-sm
                      transition-all relative
                      ${isPast 
                        ? 'text-white/20 cursor-not-allowed' 
                        : isBooked
                          ? 'bg-red-500/20 text-red-400 cursor-not-allowed'
                          : hasEvent
                            ? isSelected
                              ? 'bg-green-500 text-white'
                              : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 cursor-pointer'
                            : 'text-white/30 cursor-not-allowed'
                      }
                    `}
                  >
                    <span className="font-medium">{day}</span>
                    {hasEvent && !isPast && (
                      <span className={`text-xs mt-1 ${isSelected ? 'text-white/80' : 'text-green-400'}`}>
                        {isBooked ? 'Booked' : 'Event'}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 mt-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500/20 rounded" />
                <span className="text-white/60">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded" />
                <span className="text-white/60">Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500/20 rounded" />
                <span className="text-white/60">Already Booked</span>
              </div>
            </div>
          </motion.div>

          {/* Package Selection */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Selected Event Info */}
            {selectedEvent ? (
              <div className="bg-zinc-900 rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-2">{selectedEvent.name}</h3>
                <div className="flex items-center gap-4 text-white/60 text-sm">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-red-500" />
                    {new Date(selectedEvent.date).toLocaleDateString('de-CH')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-red-500" />
                    {selectedEvent.time}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900/50 rounded-xl p-6 border border-white/10 border-dashed">
                <p className="text-white/40 text-center">
                  Please select an event date from the calendar
                </p>
              </div>
            )}

            {/* VIP Packages */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Select Package</h3>
              {vipPackages.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => selectedEvent && setSelectedPackage(pkg.id)}
                  disabled={!selectedEvent}
                  className={`
                    w-full p-5 rounded-xl border transition-all text-left
                    ${selectedPackage === pkg.id
                      ? 'bg-gradient-to-r ' + pkg.color + ' bg-opacity-20 border-white/30'
                      : selectedEvent
                        ? 'bg-zinc-900 border-white/10 hover:border-white/30'
                        : 'bg-zinc-900/50 border-white/5 opacity-50 cursor-not-allowed'
                    }
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center
                        bg-gradient-to-r ${pkg.color}
                      `}>
                        {pkg.icon}
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-lg">{pkg.name}</h4>
                        <p className="text-white/60 text-sm">{pkg.price}</p>
                      </div>
                    </div>
                    {selectedPackage === pkg.id && (
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-black" />
                      </div>
                    )}
                  </div>
                  <ul className="mt-4 space-y-2">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-white/80 text-sm">
                        <Check className="w-4 h-4 text-red-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>

            {/* Additional Info */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-blue-400 text-sm">
                Additional drinks and pizza can be ordered at any time through the staff.
              </p>
            </div>

            {/* Notes */}
            {selectedEvent && (
              <div>
                <label className="block text-white/60 text-sm mb-2">Special Requests (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requests or notes..."
                  rows={3}
                  className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-red-500 resize-none"
                />
              </div>
            )}

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={!selectedEvent || !selectedPackage || submitting || !user}
              className="w-full py-4 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : !user ? (
                'Login to Book'
              ) : (
                <>
                  <Crown className="w-5 h-5" />
                  Proceed to Checkout
                </>
              )}
            </button>

            {!user && (
              <p className="text-center text-white/40 text-sm">
                Please <Link href="/login" className="text-red-500 hover:underline">login</Link> to make a booking
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
