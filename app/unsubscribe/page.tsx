'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Mail, Check, AlertCircle, Loader2 } from 'lucide-react'

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const emailFromUrl = searchParams.get('email') || ''

  const [email, setEmail] = useState(emailFromUrl)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  // Auto-unsubscribe if email is in URL
  useEffect(() => {
    if (emailFromUrl) {
      handleUnsubscribe(emailFromUrl)
    }
  }, [emailFromUrl])

  const handleUnsubscribe = async (targetEmail: string) => {
    if (!targetEmail || !targetEmail.includes('@')) {
      setResult({ success: false, message: 'Bitte gib eine gültige E-Mail-Adresse ein.' })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail })
      })

      const data = await res.json()

      if (res.ok) {
        setResult({ success: true, message: data.message || 'Du wurdest erfolgreich abgemeldet.' })
      } else {
        setResult({ success: false, message: data.error || 'Abmeldung fehlgeschlagen.' })
      }
    } catch {
      setResult({ success: false, message: 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.' })
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleUnsubscribe(email)
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Newsletter Abmeldung</h1>
          <p className="text-white/60">
            {emailFromUrl
              ? 'Wir verarbeiten deine Abmeldung...'
              : 'Gib deine E-Mail-Adresse ein, um dich vom Newsletter abzumelden.'}
          </p>
        </div>

        {result && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${result.success ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
            {result.success ? <Check className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span>{result.message}</span>
          </div>
        )}

        {!emailFromUrl && !result?.success && (
          <form onSubmit={onSubmit} className="bg-neutral-900 rounded-xl p-6 border border-white/10 space-y-4">
            <div>
              <label className="block text-white/60 text-sm mb-2">E-Mail Adresse</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="deine@email.com"
                required
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500/50 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Wird bearbeitet...
                </>
              ) : (
                'Vom Newsletter abmelden'
              )}
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <a href="/" className="text-red-500 hover:text-red-400 text-sm transition-colors">
            Zurück zur Startseite
          </a>
        </div>
      </div>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  )
}
