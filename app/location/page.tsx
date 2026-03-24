'use client'

import { motion } from 'framer-motion'
import { MapPin, Train, Bus, Car, Clock, Hotel, Star, Euro } from 'lucide-react'
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
            Located in Münchenstein&apos;s industrial district, KINKER is easily 
            accessible by public transport, car, or taxi. Parking garage available opposite the club.
          </p>
        </motion.div>
      </section>

      {/* Map */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="relative h-[30vh] lg:h-[40vh] w-full rounded-lg overflow-hidden"
        >
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2689.6!2d7.605!3d47.5306!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4791b9654ac4b901%3A0xf0d3e3918eff88e9!2sKinker!5e0!3m2!1sen!2sch!4v1711130400000!5m2!1sen!2sch"
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
            viewport={{ once: true, amount: 0.3 }}
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
              href="https://www.google.com/maps/place/Kinker/@47.5306021,7.6022918,677m/data=!3m2!1e3!4b1!4m6!3m5!1s0x4791b9654ac4b901:0xf0d3e3918eff88e9!8m2!3d47.5305986!4d7.6071573!16s%2Fg%2F11j8h7ggmx?entry=ttu"
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
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-neutral-900/50 rounded-2xl p-8 lg:p-10 border border-white/10"
          >
            <div className="flex items-center gap-4 mb-8">
              <Clock className="w-8 h-8 text-red-500" />
              <h2 className="text-3xl font-bold text-white font-display">Opening Hours</h2>
            </div>
            <div className="space-y-4">
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
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mt-16"
        >
          <h2 className="text-3xl font-bold text-white mb-12 font-display text-center">
            How to Get There
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Public Transport */}
            <div className="p-8 bg-neutral-900/30 rounded-xl border border-white/10 hover:border-red-500/50 transition-colors group">
              <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-red-500/20 transition-colors">
                <Train className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 font-display">
                Public Transport
              </h3>
              <p className="text-white/60 leading-relaxed">
                Take tram line 10 or 17 and exit at &quot;Dreispitz&quot;.
                From there it&apos;s a 15-minute walk to the club.
                Night buses SN1-SN5 operate on weekends.
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
                Take bus 36 and exit at &quot;Dreispitz&quot;.
                The club is a 15-minute walk from there.
              </p>
            </div>

            {/* Uber/Taxi */}
            <div className="p-8 bg-neutral-900/30 rounded-xl border border-white/10 hover:border-red-500/50 transition-colors group">
              <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-red-500/20 transition-colors">
                <svg className="w-7 h-7 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3 font-display">
                Uber / Taxi
              </h3>
              <p className="text-white/60 leading-relaxed">
                Uber is available in Basel and recommended for a safe ride home.
                Taxis can also be found at the venue entrance.
                Save our address: Barcelona-Strasse 4, 4142 Münchenstein.
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
                From the A3 highway, take exit &quot;Münchenstein&quot;.
                There is a parking garage directly opposite the club (Barcelona-Strasse).
                Please use this garage - street parking is limited and not recommended.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 p-8 bg-gradient-to-r from-red-500/10 to-transparent rounded-xl border border-red-500/30"
        >
          <h3 className="text-xl font-bold text-white mb-4 font-display">
            Getting Home Safely
          </h3>
          <p className="text-white/70 leading-relaxed mb-4">
            We recommend using <strong>Uber</strong> or a taxi for a safe ride home, especially late at night.
            The nearest tram stop for night service is Dreispitz (15 min walk).
            Night buses SN1-SN5 operate after midnight on weekends.
          </p>
          <p className="text-white/70 leading-relaxed">
            We encourage everyone to plan their journey home in advance and look 
            out for each other. Your safety is our priority.
          </p>
        </motion.div>

        {/* Hotels Nearby */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16"
        >
          <div className="flex items-center gap-4 mb-8">
            <Hotel className="w-8 h-8 text-red-500" />
            <h2 className="text-3xl font-bold text-white font-display">Hotels in der Nähe</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Budget */}
            <div className="p-6 bg-neutral-900/50 rounded-xl border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Euro className="w-5 h-5 text-green-500" />
                <h3 className="text-xl font-bold text-white font-display">Preiswert</h3>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-black/30 rounded-lg">
                  <h4 className="font-semibold text-white">Ibis Budget Basel City</h4>
                  <p className="text-white/60 text-sm">Grosspeterstrasse 12, 4052 Basel</p>
                  <p className="text-green-400 text-sm mt-1">ab CHF 75/Nacht</p>
                  <p className="text-white/40 text-xs mt-1">~15 Min. mit Tram</p>
                </div>
                <div className="p-4 bg-black/30 rounded-lg">
                  <h4 className="font-semibold text-white">EasyHotel Basel</h4>
                  <p className="text-white/60 text-sm">Riehenring 109, 4058 Basel</p>
                  <p className="text-green-400 text-sm mt-1">ab CHF 85/Nacht</p>
                  <p className="text-white/40 text-xs mt-1">~20 Min. mit Tram</p>
                </div>
              </div>
            </div>

            {/* Mid-Range */}
            <div className="p-6 bg-neutral-900/50 rounded-xl border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-yellow-500" />
                <h3 className="text-xl font-bold text-white font-display">Mittelklasse</h3>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-black/30 rounded-lg">
                  <h4 className="font-semibold text-white">Hotel Basel</h4>
                  <p className="text-white/60 text-sm">Münzgasse 12, 4001 Basel</p>
                  <p className="text-yellow-400 text-sm mt-1">ab CHF 150/Nacht</p>
                  <p className="text-white/40 text-xs mt-1">~25 Min. mit Tram</p>
                </div>
                <div className="p-4 bg-black/30 rounded-lg">
                  <h4 className="font-semibold text-white">Radisson Blu Basel</h4>
                  <p className="text-white/60 text-sm">Steinentorstrasse 25, 4001 Basel</p>
                  <p className="text-yellow-400 text-sm mt-1">ab CHF 180/Nacht</p>
                  <p className="text-white/40 text-xs mt-1">~20 Min. mit Tram</p>
                </div>
              </div>
            </div>

            {/* Luxury */}
            <div className="p-6 bg-neutral-900/50 rounded-xl border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-red-500" />
                <Star className="w-5 h-5 text-red-500" />
                <h3 className="text-xl font-bold text-white font-display">Gehoben</h3>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-black/30 rounded-lg">
                  <h4 className="font-semibold text-white">Grand Hotel Les Trois Rois</h4>
                  <p className="text-white/60 text-sm">Blumenrain 8, 4001 Basel</p>
                  <p className="text-red-400 text-sm mt-1">ab CHF 350/Nacht</p>
                  <p className="text-white/40 text-xs mt-1">~25 Min. mit Tram</p>
                </div>
                <div className="p-4 bg-black/30 rounded-lg">
                  <h4 className="font-semibold text-white">Hotel Victoria</h4>
                  <p className="text-white/60 text-sm">Centralbahnplatz 3, 4002 Basel</p>
                  <p className="text-red-400 text-sm mt-1">ab CHF 280/Nacht</p>
                  <p className="text-white/40 text-xs mt-1">~20 Min. mit Tram</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-white/40 text-sm mt-6 text-center">
            * Preise sind Richtwerte und können je nach Saison variieren. Empfohlen wird eine frühzeitige Buchung.
          </p>
        </motion.div>
      </section>
    </div>
  )
}
