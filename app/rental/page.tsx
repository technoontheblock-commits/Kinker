'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Home, 
  Warehouse, 
  Trees, 
  Check, 
  Plus, 
  Mail, 
  Phone, 
  Calendar,
  Users,
  MessageSquare,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/components/language-provider'

const roomIcons: { [key: string]: React.ReactNode } = {
  'Wohnzimmer': <Home className="w-8 h-8" />,
  'Bunker': <Warehouse className="w-8 h-8" />,
  'Aussenbereich': <Trees className="w-8 h-8" />,
}

export default function RentalPage() {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventType: '',
    date: '',
    guests: '',
    rooms: [] as string[],
    extras: [] as string[],
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/rental', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          eventType: formData.eventType,
          date: formData.date,
          guests: formData.guests,
          rooms: formData.rooms,
          extras: formData.extras,
          message: formData.message
        })
      })
      
      if (response.ok) {
        setSubmitted(true)
      } else {
        const error = await response.json()
        console.error('Error submitting rental inquiry:', error)
        alert('Fehler beim Senden der Anfrage: ' + (error.error || 'Unbekannter Fehler'))
      }
    } catch (error) {
      console.error('Error submitting rental inquiry:', error)
      alert('Fehler beim Senden der Anfrage')
    }
  }

  const toggleRoom = (roomName: string) => {
    setFormData(prev => ({
      ...prev,
      rooms: prev.rooms.includes(roomName)
        ? prev.rooms.filter(r => r !== roomName)
        : [...prev.rooms, roomName]
    }))
  }

  const toggleExtra = (extra: string) => {
    setFormData(prev => ({
      ...prev,
      extras: prev.extras.includes(extra)
        ? prev.extras.filter(e => e !== extra)
        : [...prev.extras, extra]
    }))
  }

  const rooms = [
    {
      name: 'Wohnzimmer',
      description: t.rental.rooms.wohnzimmer.description,
      features: t.rental.rooms.wohnzimmer.features,
    },
    {
      name: 'Bunker',
      description: t.rental.rooms.bunker.description,
      features: t.rental.rooms.bunker.features,
    },
    {
      name: 'Aussenbereich',
      description: t.rental.rooms.aussenbereich.description,
      features: t.rental.rooms.aussenbereich.features,
    },
  ]

  if (submitted) {
    return (
      <div className="min-h-screen bg-black pt-24 lg:pt-32 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center px-4"
        >
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-4 font-display">{t.rental.success.title}</h2>
          <p className="text-white/70 text-lg max-w-md mx-auto mb-8">
            {t.rental.success.message}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-24 lg:pt-32">
      {/* Header */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <span className="text-red-500 font-semibold tracking-widest uppercase text-sm mb-4 block">
            {t.rental.subtitle}
          </span>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter font-display text-white mb-6">
            {t.rental.title}
          </h1>
          <p className="text-lg text-white/70 leading-relaxed">
            {t.rental.description}
          </p>
        </motion.div>
      </section>

      {/* Rooms */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <h2 className="text-3xl font-bold text-white mb-12 font-display">{t.rental.availableRooms}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {rooms.map((room, index) => (
            <motion.div
              key={room.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-neutral-900/50 rounded-2xl p-8 border border-white/10 hover:border-red-500/50 transition-colors"
            >
              <div className="text-red-500 mb-6">{roomIcons[room.name]}</div>
              <h3 className="text-2xl font-bold text-white mb-2 font-display">{room.name}</h3>
              <p className="text-white/60 mb-6">{room.description}</p>
              <ul className="space-y-3">
                {room.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-white/70 text-sm">
                    <Check className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Included & Extras */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Included */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="bg-neutral-900/30 rounded-2xl p-8 border border-white/10"
          >
            <h3 className="text-2xl font-bold text-white mb-6 font-display">{t.rental.included}</h3>
            <ul className="space-y-4">
              {t.rental.includedList.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-white/80">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Extras */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="bg-neutral-900/30 rounded-2xl p-8 border border-white/10"
          >
            <h3 className="text-2xl font-bold text-white mb-6 font-display">{t.rental.extras}</h3>
            <ul className="space-y-4">
              {t.rental.extrasList.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-white/80">
                  <Plus className="w-5 h-5 text-red-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-white mb-4 font-display text-center">
            {t.rental.submitInquiry}
          </h2>
          <p className="text-white/60 text-center mb-12">
            {t.rental.inquirySubtitle}
          </p>

          <form onSubmit={handleSubmit} className="bg-neutral-900/30 rounded-2xl p-8 lg:p-12 border border-white/10">
            {/* Personal Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-white/80 mb-2 text-sm">{t.rental.form.name} *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500 transition-colors"
                  placeholder={t.rental.form.placeholder.name}
                />
              </div>
              <div>
                <label className="block text-white/80 mb-2 text-sm">{t.rental.form.email} *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500 transition-colors"
                  placeholder={t.rental.form.placeholder.email}
                />
              </div>
              <div>
                <label className="block text-white/80 mb-2 text-sm">{t.rental.form.phone}</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500 transition-colors"
                  placeholder={t.rental.form.placeholder.phone}
                />
              </div>
              <div>
                <label className="block text-white/80 mb-2 text-sm">{t.rental.form.eventType} *</label>
                <input
                  type="text"
                  required
                  value={formData.eventType}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500 transition-colors"
                  placeholder={t.rental.form.placeholder.eventType}
                />
              </div>
            </div>

            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-white/80 mb-2 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {t.rental.form.date} *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-white/80 mb-2 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {t.rental.form.guests} *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.guests}
                  onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500 transition-colors"
                  placeholder={t.rental.form.placeholder.guests}
                />
              </div>
            </div>

            {/* Room Selection */}
            <div className="mb-8">
              <label className="block text-white/80 mb-4 text-sm">{t.rental.form.rooms} *</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {rooms.map((room) => (
                  <button
                    key={room.name}
                    type="button"
                    onClick={() => toggleRoom(room.name)}
                    className={`p-4 rounded-lg border transition-all text-left ${
                      formData.rooms.includes(room.name)
                        ? 'border-red-500 bg-red-500/10'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={formData.rooms.includes(room.name) ? 'text-red-500' : 'text-white/60'}>
                        {roomIcons[room.name]}
                      </div>
                      <span className={formData.rooms.includes(room.name) ? 'text-white' : 'text-white/70'}>
                        {room.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Extras Selection */}
            <div className="mb-8">
              <label className="block text-white/80 mb-4 text-sm">{t.rental.extras}</label>
              <div className="flex flex-wrap gap-3">
                {t.rental.extrasList.map((extra) => (
                  <button
                    key={extra}
                    type="button"
                    onClick={() => toggleExtra(extra)}
                    className={`px-4 py-2 rounded-full border transition-all text-sm ${
                      formData.extras.includes(extra)
                        ? 'border-red-500 bg-red-500/10 text-white'
                        : 'border-white/20 text-white/70 hover:border-white/40'
                    }`}
                  >
                    {extra}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="mb-8">
              <label className="block text-white/80 mb-2 text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                {t.rental.form.message}
              </label>
              <textarea
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-red-500 transition-colors resize-none"
                placeholder={t.rental.form.placeholder.message}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
            >
              {t.rental.form.sendInquiry}
            </button>
          </form>

          {/* Direct Contact */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-8">
            <a
              href="mailto:backoffice@knkr.ch"
              className="flex items-center gap-3 text-white/70 hover:text-red-500 transition-colors"
            >
              <Mail className="w-5 h-5" />
              <span>backoffice@knkr.ch</span>
            </a>
            <a
              href="tel:+41611234567"
              className="flex items-center gap-3 text-white/70 hover:text-red-500 transition-colors"
            >
              <Phone className="w-5 h-5" />
              <span>+41 61 123 45 67</span>
            </a>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
