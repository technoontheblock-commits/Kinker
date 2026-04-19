'use client'

import Link from 'next/link'
import { Instagram, Facebook, Mail, MapPin } from 'lucide-react'
import { clubInfo } from '@/lib/data'
import { useLanguage } from './language-provider'

export function Footer() {
  const { t, language } = useLanguage()
  
  return (
    <footer className="bg-black border-t border-white/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-bold tracking-tighter font-display">
                <span className="text-white">KINKER</span>
                <span className="text-red-500">.</span>
              </span>
            </Link>
            <p className="text-white/60 text-sm">
              {language === 'DE' 
                ? 'Hard Techno in Basel. Kein Rassismus. Kein Hass. Nur Musik.' 
                : 'Hard techno in Basel. No racism. No hate. Just music.'}
            </p>
            <div className="flex space-x-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-red-500 transition-colors"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-red-500 transition-colors"
              >
                <Facebook size={20} />
              </a>
              <a
                href="mailto:backoffice@knkr.ch"
                className="text-white/60 hover:text-red-500 transition-colors"
              >
                <Mail size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">
              {language === 'DE' ? 'Quick Links' : 'Quick Links'}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/events" className="text-white/60 hover:text-red-500 transition-colors text-sm">
                  {t.nav.events}
                </Link>
              </li>
              <li>
                <Link href="/club" className="text-white/60 hover:text-red-500 transition-colors text-sm">
                  {language === 'DE' ? 'Club Info' : 'Club Info'}
                </Link>
              </li>
              <li>
                <Link href="/location" className="text-white/60 hover:text-red-500 transition-colors text-sm">
                  {t.nav.location}
                </Link>
              </li>
            </ul>
          </div>

          {/* Opening Hours */}
          <div>
            <h3 className="text-white font-semibold mb-4">
              {language === 'DE' ? 'Öffnungszeiten' : 'Opening Hours'}
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="text-white/60">
                <span className="text-white">{language === 'DE' ? 'Freitag:' : 'Friday:'}</span> {clubInfo.openingHours.friday}
              </li>
              <li className="text-white/60">
                <span className="text-white">{language === 'DE' ? 'Samstag:' : 'Saturday:'}</span> {clubInfo.openingHours.saturday}
              </li>
            </ul>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-white font-semibold mb-4">
              {language === 'DE' ? 'Finde uns' : 'Find Us'}
            </h3>
            <address className="not-italic text-white/60 text-sm space-y-1">
              <p className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 text-red-500" />
                <span>
                  {clubInfo.address}<br />
                  {clubInfo.city}<br />
                  {clubInfo.country}
                </span>
              </p>
            </address>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()} KINKER. {t.footer.rights}
          </p>
          <div className="flex space-x-6 text-sm">
            <Link href="/impressum" className="text-white/40 hover:text-white transition-colors">
              {t.footer.imprint}
            </Link>
            <Link href="/privacy" className="text-white/40 hover:text-white transition-colors">
              {t.footer.privacy}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
