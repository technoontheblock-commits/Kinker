'use client'

import { useState } from 'react'
import { Mail, Send, Loader2, Check, AlertCircle, ChevronDown } from 'lucide-react'

const EMAIL_TYPES = [
  {
    value: 'simple',
    label: 'Simple Test Email',
    description: 'Basic HTML test email',
    endpoint: '/api/test-email',
    needsMockData: false
  },
  {
    value: 'verification',
    label: 'Email Verification',
    description: '6-digit verification code email',
    endpoint: '/api/email/test-verification',
    needsMockData: false
  },
  {
    value: 'order',
    label: 'Order Confirmation',
    description: 'Bestellbestätigung mit Artikelliste',
    endpoint: '/api/email/order-confirmation',
    needsMockData: true
  },
  {
    value: 'rental',
    label: 'Rental Confirmation',
    description: 'Raumanfrage-Bestätigung',
    endpoint: '/api/email/rental-confirmation',
    needsMockData: true
  },
  {
    value: 'application',
    label: 'Job Application Confirmation',
    description: 'Bewerbungsbestätigung',
    endpoint: '/api/email/application-confirmation',
    needsMockData: true
  },
  {
    value: 'contact',
    label: 'Contact Form Confirmation',
    description: 'Kontaktformular Bestätigung + Admin-Mail',
    endpoint: '/api/contact',
    needsMockData: true
  },
  {
    value: 'newsletter',
    label: 'Newsletter Welcome',
    description: 'Newsletter Anmeldung + Willkommens-Mail',
    endpoint: '/api/subscribe',
    needsMockData: false
  }
]

function getMockPayload(type: string, email: string) {
  switch (type) {
    case 'order':
      return {
        to: email,
        orderNumber: 'KINKER-' + Math.floor(100000 + Math.random() * 900000),
        items: [
          { name: 'Event Ticket - Main Floor', quantity: 2, price: 25.00 },
          { name: 'VIP Upgrade', quantity: 1, price: 50.00 }
        ],
        total: 100.00,
        discount: null
      }
    case 'rental':
      return {
        to: email,
        name: 'Test User',
        eventType: 'Geburtstagsfeier',
        eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        guests: 45,
        rooms: ['Main Floor', 'Lounge'],
        inquiryId: 'inq-' + Math.random().toString(36).substring(2, 10)
      }
    case 'application':
      return {
        to: email,
        name: 'Test Bewerber',
        jobTitle: 'Barkeeper',
        department: 'Bar',
        applicationId: 'app-' + Math.random().toString(36).substring(2, 10)
      }
    case 'contact':
      return {
        name: 'Test User',
        email: email,
        subject: 'Test-Anfrage über Kontaktformular',
        message: 'Dies ist eine Testnachricht vom Email Test Dashboard. Bitte ignorieren.'
      }
    case 'newsletter':
      return { email }
    default:
      return { email }
  }
}

export default function EmailTestPage() {
  const [email, setEmail] = useState('technoontheblock@gmail.com')
  const [selectedType, setSelectedType] = useState('simple')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const selectedOption = EMAIL_TYPES.find(t => t.value === selectedType) || EMAIL_TYPES[0]

  const sendTest = async () => {
    setLoading(true)
    setResult(null)

    try {
      const payload = getMockPayload(selectedType, email)
      const res = await fetch(selectedOption.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      setResult({ success: res.ok, ...data })
    } catch (error) {
      setResult({ success: false, error: 'Failed to send' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Email Test</h1>
          <p className="text-white/60">Teste verschiedene E-Mail Templates</p>
        </div>

        {result && (
          <div className={`mb-6 p-4 rounded-lg ${result.success ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
            <div className="flex items-center gap-2">
              {result.success ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-medium">{result.error || result.message || 'Email sent successfully!'}</span>
            </div>
            {result.code && (
              <p className="mt-2 font-mono text-lg tracking-widest">Code: {result.code}</p>
            )}
            {result.data && (
              <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(result.data, null, 2)}</pre>
            )}
          </div>
        )}

        <div className="bg-neutral-900 rounded-xl p-6 border border-white/10 space-y-6">
          {/* Email Type Dropdown */}
          <div>
            <label className="block text-white/60 text-sm mb-2">E-Mail Typ</label>
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white text-left flex items-center justify-between hover:border-white/20 transition-colors"
              >
                <div>
                  <span className="font-medium">{selectedOption.label}</span>
                  <span className="text-white/40 text-sm ml-2">— {selectedOption.description}</span>
                </div>
                <ChevronDown className={`w-5 h-5 text-white/40 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute z-10 w-full mt-2 bg-neutral-900 border border-white/10 rounded-lg shadow-xl overflow-hidden">
                  {EMAIL_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => {
                        setSelectedType(type.value)
                        setDropdownOpen(false)
                        setResult(null)
                      }}
                      className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-white/5 transition-colors ${
                        selectedType === type.value ? 'bg-white/5 border-l-2 border-red-500' : 'border-l-2 border-transparent'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium">{type.label}</div>
                        <div className="text-white/40 text-sm">{type.description}</div>
                      </div>
                      {type.needsMockData && (
                        <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded shrink-0">
                          Mock Data
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-white/60 text-sm mb-2">E-Mail Adresse</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500/50 transition-colors"
            />
          </div>

          {/* Mock Data Info */}
          {selectedOption.needsMockData && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-amber-400/80 text-sm">
                Dieser E-Mail-Typ verwendet automatisch generierte Testdaten (Mock Data) um das Template korrekt darzustellen.
              </p>
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={sendTest}
            disabled={loading}
            className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                {selectedOption.label} senden
              </>
            )}
          </button>
        </div>

        <div className="mt-8 p-4 bg-white/5 rounded-lg">
          <h2 className="text-white font-semibold mb-2">Hinweise:</h2>
          <ul className="text-white/60 text-sm space-y-1">
            <li>• E-Mails werden über Resend versendet</li>
            <li>• Prüfe auch deinen Spam-Ordner</li>
            <li>• Resend Free: 100 E-Mails/Tag</li>
            <li>• Mock Data = automatisch generierte Testdaten für realistische Vorschau</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
