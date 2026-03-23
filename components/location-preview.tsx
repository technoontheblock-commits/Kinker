'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { MapPin, Clock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { clubInfo } from '@/lib/data'
import { useLanguage } from './language-provider'

export function LocationPreview() {
  const { t, language } = useLanguage()
  
  return (
    <section className="py-24 lg:py-32 bg-black relative overflow-hidden">
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <iframe
          src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2692.889715077735!2d${clubInfo.coordinates.lng}!3d${clubInfo.coordinates.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4791b0e0b0b0b0b0%3A0x0!2zNDfCsDMzJzU1LjEiTiA3wrAzNScwNy4xIkU!5e0!3m2!1sen!2sch!4v1600000000000!5m2!1sen!2sch`}
          width="100%"
          height="100%"
          style={{ border: 0, filter: 'grayscale(100%) invert(92%) contrast(83%)' }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/60" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-red-500 font-semibold tracking-widest uppercase text-sm mb-4 block">
              {t.location.findUs}
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter font-display text-white mb-6">
              LOCATION
            </h2>
            <div className="space-y-4 mb-8">
              <p className="flex items-start gap-3 text-white/80 text-lg">
                <MapPin className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" />
                <span>
                  {clubInfo.address}
                  <br />
                  {clubInfo.city}
                  <br />
                  {clubInfo.country}
                </span>
              </p>
              <div className="flex items-start gap-3 text-white/60">
                <Clock className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p>{language === 'DE' ? 'Fr:' : 'Fri:'} {clubInfo.openingHours.friday}</p>
                  <p>{language === 'DE' ? 'Sa:' : 'Sat:'} {clubInfo.openingHours.saturday}</p>
                </div>
              </div>
            </div>
            <Button variant="glitch" size="lg" asChild>
              <Link href="/location">
                {t.location.viewDetails}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          {/* Map */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:block"
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-red-500/20 blur-xl rounded-full" />
              <div className="relative bg-neutral-900/80 backdrop-blur-sm border border-white/10 p-6 rounded-lg">
                <div className="aspect-square bg-neutral-800 rounded-lg overflow-hidden">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2689.6!2d7.605!3d47.5306!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4791b9654ac4b901%3A0xf0d3e3918eff88e9!2sKinker!5e0!3m2!1sen!2sch!4v1711130400000!5m2!1sen!2sch"
                    width="100%"
                    height="100%"
                    style={{ border: 0, filter: 'grayscale(100%)' }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
