'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Printer, Check, CreditCard, Smartphone, Calendar, ShoppingCart, Download, ScanLine, Crown } from 'lucide-react'
import { AdminSidebar } from '@/components/admin-sidebar'

const A4_WIDTH = '210mm'
const A4_HEIGHT = '297mm'
const A3_WIDTH = '297mm'
const A3_HEIGHT = '420mm'

const benefits = [
  '5 CHF Rabatt an der Abendkasse',
  'Digitale Karte mit QR-Code',
  'Immer auf dem Handy dabei',
  '1 Jahr gültig',
]

const steps = [
  { icon: ShoppingCart, title: 'Membership kaufen', desc: 'Fülle das Formular aus und bestelle deine persönliche Karte.' },
  { icon: Download, title: 'PDF speichern / Screenshot', desc: 'Speichere deine digitale Karte als PDF oder mache einen Screenshot.' },
  { icon: ScanLine, title: 'QR-Code scannen lassen', desc: 'Zeige deinen QR-Code an der Abendkasse vor und profitiere von der Ermässigung.' },
]

function Flyer({ size, scale }: { size: 'a4' | 'a3'; scale: number }) {
  const isA4 = size === 'a4'
  const width = isA4 ? A4_WIDTH : A3_WIDTH
  const height = isA4 ? A4_HEIGHT : A3_HEIGHT
  const titleSize = isA4 ? 'text-5xl' : 'text-7xl'
  const subtitleSize = isA4 ? 'text-2xl' : 'text-4xl'
  const benefitSize = isA4 ? 'text-lg' : 'text-2xl'
  const stepTitleSize = isA4 ? 'text-sm' : 'text-xl'
  const stepDescSize = isA4 ? 'text-xs' : 'text-base'
  const priceSize = isA4 ? 'text-6xl' : 'text-8xl'
  const logoSize = isA4 ? 120 : 180

  return (
    <div
      className={`flyer-${size} bg-black text-white relative overflow-hidden flex flex-col items-center justify-center`}
      style={{
        width,
        height,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-red-600/20 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-red-500/10 to-transparent rounded-full blur-3xl" />

      {/* Top border line */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 via-red-500 to-red-600" />

      <div className="relative z-10 flex flex-col items-center px-12 py-10 w-full h-full">
        {/* Logo */}
        <img
          src="/images/logo.png"
          alt="KINKER"
          width={logoSize}
          className="mb-6"
        />

        {/* Title */}
        <h1 className={`${titleSize} font-bold tracking-tight mb-2`}>
          KINKER <span className="text-red-500">MEMBERSHIP</span>
        </h1>
        <p className={`${subtitleSize} text-white/60 mb-8`}>
          Deine Mitgliedschaft für exklusive Preisermässigungen
        </p>

        {/* Price */}
        <div className="mb-10 text-center">
          <p className={`${priceSize} font-bold text-red-500 leading-none`}>CHF 100</p>
          <p className={`${isA4 ? 'text-base' : 'text-xl'} text-white/40 mt-2`}>pro Jahr</p>
        </div>

        {/* Benefits */}
        <div className={`w-full max-w-[85%] ${isA4 ? 'mb-10' : 'mb-14'}`}>
          <div className={`grid ${isA4 ? 'grid-cols-2 gap-4' : 'grid-cols-2 gap-8'}`}>
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`${isA4 ? 'w-8 h-8' : 'w-12 h-12'} bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Check className={`${isA4 ? 'w-4 h-4' : 'w-6 h-6'} text-red-500`} />
                </div>
                <span className={`${benefitSize} text-white/90`}>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className={`w-full max-w-[90%] ${isA4 ? 'mb-10' : 'mb-14'}`}>
          <div className={`h-px bg-gradient-to-r from-transparent via-white/20 to-transparent ${isA4 ? 'mb-6' : 'mb-10'}`} />
          <h3 className={`${isA4 ? 'text-lg' : 'text-2xl'} font-bold text-white text-center mb-6`}>So funktioniert&apos;s</h3>
          <div className={`grid grid-cols-3 gap-4 ${isA4 ? '' : 'gap-8'}`}>
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className={`${isA4 ? 'w-12 h-12' : 'w-16 h-16'} bg-gradient-to-br from-red-600 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3`}>
                  <step.icon className={`${isA4 ? 'w-6 h-6' : 'w-8 h-8'} text-white`} />
                </div>
                <p className={`${stepTitleSize} font-semibold text-white mb-1`}>{step.title}</p>
                <p className={`${stepDescSize} text-white/50`}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer / CTA */}
        <div className="mt-auto w-full">
          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className={`${isA4 ? 'w-6 h-6' : 'w-8 h-8'} text-red-500`} />
              <span className={`${isA4 ? 'text-sm' : 'text-lg'} text-white/60`}>
                kinker.ch/membership
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-white/40">
                <Smartphone className={`${isA4 ? 'w-4 h-4' : 'w-5 h-5'}`} />
                <span className={`${isA4 ? 'text-xs' : 'text-sm'}`}>Digitale Karte</span>
              </div>
              <div className="flex items-center gap-2 text-white/40">
                <CreditCard className={`${isA4 ? 'w-4 h-4' : 'w-5 h-5'}`} />
                <span className={`${isA4 ? 'text-xs' : 'text-sm'}`}>Sofort verfügbar</span>
              </div>
              <div className="flex items-center gap-2 text-white/40">
                <Calendar className={`${isA4 ? 'w-4 h-4' : 'w-5 h-5'}`} />
                <span className={`${isA4 ? 'text-xs' : 'text-sm'}`}>1 Jahr gültig</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminAdvertisingPage() {
  const [scaleA4, setScaleA4] = useState(0.5)
  const [scaleA3, setScaleA3] = useState(0.35)

  useEffect(() => {
    function handleResize() {
      const containerWidth = Math.min(window.innerWidth - 320, 1200)
      const a4Target = 210 * 3.78 // px at 96dpi
      const a3Target = 297 * 3.78
      setScaleA4(Math.min((containerWidth / 2 - 40) / a4Target, 0.6))
      setScaleA3(Math.min((containerWidth / 2 - 40) / a3Target, 0.45))
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handlePrint = (size: 'a4' | 'a3') => {
    const style = document.createElement('style')
    style.id = 'print-flyer-style'
    style.innerHTML = `
      @media print {
        @page { size: ${size === 'a4' ? '210mm 297mm' : '297mm 420mm'}; margin: 0; }
        body * { visibility: hidden !important; }
        .flyer-${size} { 
          visibility: visible !important; 
          position: fixed !important; 
          top: 0 !important; 
          left: 0 !important; 
          transform: none !important;
          width: ${size === 'a4' ? '210mm' : '297mm'} !important;
          height: ${size === 'a4' ? '297mm' : '420mm'} !important;
        }
        .flyer-${size} * { visibility: visible !important; }
      }
    `
    document.head.appendChild(style)
    window.print()
    setTimeout(() => {
      const el = document.getElementById('print-flyer-style')
      if (el) el.remove()
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-black pt-20">
      <AdminSidebar />
      <div className="ml-64 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-white">Werbung</h1>
          </div>

          <p className="text-white/60 mb-8 max-w-2xl">
            Drucke DIN A4 oder DIN A3 Flyer für die KINKER Membership. Die Flyer enthalten keine internen Informationen – nur öffentliche Vorteile und den Link zur Membership-Seite.
          </p>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* A4 Preview */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">DIN A4</h2>
                <button
                  onClick={() => handlePrint('a4')}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <Printer className="w-4 h-4" />
                  A4 Drucken
                </button>
              </div>
              <div className="bg-neutral-900 rounded-xl border border-white/10 p-6 overflow-auto">
                <div style={{ height: `${297 * 3.78 * scaleA4 + 20}px` }}>
                  <Flyer size="a4" scale={scaleA4} />
                </div>
              </div>
            </div>

            {/* A3 Preview */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">DIN A3</h2>
                <button
                  onClick={() => handlePrint('a3')}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <Printer className="w-4 h-4" />
                  A3 Drucken
                </button>
              </div>
              <div className="bg-neutral-900 rounded-xl border border-white/10 p-6 overflow-auto">
                <div style={{ height: `${420 * 3.78 * scaleA3 + 20}px` }}>
                  <Flyer size="a3" scale={scaleA3} />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
