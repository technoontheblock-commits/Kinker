'use client'

import { motion } from 'framer-motion'
import { MapPin, Train, Bus, Car, Clock } from 'lucide-react'
import { clubInfo } from '@/lib/data'

export default function LocationPage() {
  return (
    <div className="min-h-screen bg-black pt-24 lg:pt-32">
      {/* Header */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-red-500 font-semibold tracking-widest uppercase text-sm mb-4 block">
            Find Us
          </span>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter font-display text-white mb-6">
            LOCATION
          </h1>
          <p className="text-lg text-white/70 max-w-2xl">
            Located in the heart of Basel&apos;s industrial district, KINKER is easily 
            accessible by public transport and offers nearby parking options.
          </p>
        </motion.div>
      </section>

      {/* Map */}
      <section className="relative h-[50vh] lg:h-[60vh] mb-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <iframe
            src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2692.889715077735!2d${clubInfo.coordinates.lng}!3d${clubInfo.coordinates.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4791b0e0b0b0b0b0%3A0x0!2zNDfCsDMzJzU1LjEiTiA3wrAzNScwNy4xIkU!5e0!3m2!1sen!2sch!4v1600000000000!5m2!1sen!2sch`}
            width="100%"
            height="100%"
            style={{ border: 0, filter: 'grayscale(100%) invert(92%) contrast(83%)' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </motion.div>
      </section>

      {/* Address & Directions */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Address Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-neutral-900/50 rounded-2xl p-8 lg:p-10 border border-white/10"
          >
            <div className="flex items-center gap-4 mb-8">
              <MapPin className="w-8 h-8 text-red-500" />
              <h2 className="text-3xl font-bold text-white font-display">Address</h2>
            </div>
            <address className="not-italic space-y-2 text-xl text-white/80 mb-8">
              <p className="font-bold text-white text-2xl">{clubInfo.name}</p>
              <p>{clubInfo.address}</p>
              <p>{clubInfo.city}</p>
              <p>{clubInfo.country}</p>
            </address>
            <a
              href={`https://maps.google.com/?q=${clubInfo.coordinates.lat},${clubInfo.coordinates.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-red-500 hover:text-red-400 font-semibold transition-colors"
            >
              Open in Google Maps
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </motion.div>

          {/* Opening Hours Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-neutral-900/50 rounded-2xl p-8 lg:p-10 border border-white/10"
          >
            <div className="flex items-center gap-4 mb-8">
              <Clock className="w-8 h-8 text-red-500" />
              <h2 className="text-3xl font-bold text-white font-display">Opening Hours</h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-black/30 rounded-lg">
                <span className="text-white font-semibold">Tuesday</span>
                <span className="text-white/70">{clubInfo.openingHours.tuesday}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-black/30 rounded-lg">
                <span className="text-white font-semibold">Friday</span>
                <span className="text-white/70">{clubInfo.openingHours.friday}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-black/30 rounded-lg">
                <span className="text-white font-semibold">Saturday</span>
                <span className="text-white/70">{clubInfo.openingHours.saturday}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Directions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16"
        >
          <h2 className="text-3xl font-bold text-white mb-12 font-display text-center">
            How to Get There
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Public Transport */}
            <div className="p-8 bg-neutral-900/30 rounded-xl border border-white/10 hover:border-red-500/50 transition-colors group">
              <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-red-500/20 transition-colors">
                <Train className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 font-display">
                Public Transport
              </h3>
              <p className="text-white/60 leading-relaxed">
                Take tram line 8 or 14 to &quot;Klybeck&quot; station. 
                The club is a 3-minute walk from there. 
                Night buses operate on weekends.
              </p>
            </div>

            {/* Bus */}
            <div className="p-8 bg-neutral-900/30 rounded-xl border border-white/10 hover:border-red-500/50 transition-colors group">
              <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-red-500/20 transition-colors">
                <Bus className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 font-display">
                Bus
              </h3>
              <p className="text-white/60 leading-relaxed">
                Bus lines 30, 31, and 36 stop at &quot;Klybeckstrasse&quot;. 
                From Basel SBB, take bus 30 direction &quot;Habermatten&quot;.
              </p>
            </div>

            {/* Car */}
            <div className="p-8 bg-neutral-900/30 rounded-xl border border-white/10 hover:border-red-500/50 transition-colors group">
              <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-red-500/20 transition-colors">
                <Car className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 font-display">
                By Car
              </h3>
              <p className="text-white/60 leading-relaxed">
                From the A3 highway, take exit &quot;Basel-Kleinhüningen&quot;. 
                Limited street parking available. 
                We recommend using public transport.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 p-8 bg-gradient-to-r from-red-500/10 to-transparent rounded-xl border border-red-500/30"
        >
          <h3 className="text-xl font-bold text-white mb-4 font-display">
            Getting Home Safely
          </h3>
          <p className="text-white/70 leading-relaxed mb-4">
            Basel has an excellent night bus network (SN1-SN5) that operates after 
            midnight on weekends. The nearest night bus stop is at Klybeckplatz, 
            just 5 minutes walk from the club. Taxis are available at the venue entrance.
          </p>
          <p className="text-white/70 leading-relaxed">
            We encourage everyone to plan their journey home in advance and look 
            out for each other. Your safety is our priority.
          </p>
        </motion.div>
      </section>
    </div>
  )
}
