'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Crown, LogIn, UserPlus, CreditCard, Loader2, Check, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function ClaimContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [validating, setValidating] = useState(true)
  const [valid, setValid] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'select' | 'existing' | 'new' | 'card'>('select')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Auth forms
  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    name: '',
    newsletter: false,
  })

  // Card data
  const [cardData, setCardData] = useState({
    holder_name: '',
    holder_email: '',
  })

  // Auth error from login step
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    if (!token) {
      setValidating(false)
      setError('Kein Token vorhanden')
      return
    }

    fetch(`/api/membership/claims?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setValid(true)
        } else {
          setError(data.error || 'Ungültiger Token')
        }
      })
      .catch(() => setError('Fehler bei der Validierung'))
      .finally(() => setValidating(false))
  }, [token])

  const handleAuth = async (authMode: 'existing' | 'new') => {
    setAuthError('')
    if (authMode === 'existing') {
      if (!authData.email || !authData.password) {
        setAuthError('E-Mail und Passwort erforderlich')
        return
      }
    } else {
      if (!authData.name || !authData.email || !authData.password) {
        setAuthError('Alle Felder erforderlich')
        return
      }
      if (authData.password.length < 8) {
        setAuthError('Passwort muss mindestens 8 Zeichen haben')
        return
      }
    }
    setMode('card')
  }

  const handleSubmit = async () => {
    if (!cardData.holder_name || !cardData.holder_email) {
      setAuthError('Karteninhaber-Name und E-Mail erforderlich')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/membership/claims/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          holder_name: cardData.holder_name,
          holder_email: cardData.holder_email,
          auth_mode: mode === 'card' ? (authData.name ? 'new' : 'existing') : undefined,
          email: authData.email,
          password: authData.password,
          name: authData.name,
          newsletter: authData.newsletter,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setSuccess(true)
      } else {
        setAuthError(data.error || 'Ein Fehler ist aufgetreten')
      }
    } catch {
      setAuthError('Ein Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <div className="min-h-screen bg-black pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black pt-20 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-neutral-900 rounded-2xl border border-white/10 p-8 text-center">
          <Crown className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Ungültiger Link</h1>
          <p className="text-white/60 mb-6">{error}</p>
          <Link href="/membership" className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium">
            Zur Membership-Seite
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black pt-20 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-neutral-900 rounded-2xl border border-white/10 p-8 text-center"
        >
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Membership aktiviert!</h1>
          <p className="text-white/60 mb-6">
            Deine Membership wurde erfolgreich deinem Account zugeordnet. Du findest sie im Dashboard.
          </p>
          <Link href="/dashboard/membership" className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium">
            Zum Dashboard
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto"
        >
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-600 to-red-500 rounded-2xl mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Membership beanspruchen</h1>
            <p className="text-white/60">
              Du hast einen gültigen Claim-Link erhalten. Wähle eine Option, um fortzufahren.
            </p>
          </div>

          <div className="bg-neutral-900 rounded-2xl border border-white/10 p-8">
            {mode === 'select' && (
              <div className="space-y-4">
                <button
                  onClick={() => setMode('existing')}
                  className="w-full flex items-center gap-4 p-5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/50 rounded-xl transition-all text-left"
                >
                  <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <LogIn className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Ich habe bereits ein Account</h3>
                    <p className="text-white/50 text-sm">Melde dich an und ordne die Membership zu.</p>
                  </div>
                </button>

                <button
                  onClick={() => setMode('new')}
                  className="w-full flex items-center gap-4 p-5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/50 rounded-xl transition-all text-left"
                >
                  <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <UserPlus className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Ich habe kein Account</h3>
                    <p className="text-white/50 text-sm">Erstelle ein neues Konto und erhalte die Membership.</p>
                  </div>
                </button>
              </div>
            )}

            {mode === 'existing' && (
              <div className="space-y-5">
                <button onClick={() => setMode('select')} className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-2">
                  <ArrowLeft className="w-4 h-4" /> Zurück
                </button>
                <h2 className="text-xl font-bold text-white">Anmelden</h2>
                <div>
                  <label className="block text-white/60 text-sm mb-2">E-Mail</label>
                  <input
                    type="email"
                    value={authData.email}
                    onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-black rounded-xl border border-white/10 text-white placeholder-white/30 focus:border-red-500 focus:outline-none transition-colors"
                    placeholder="max@beispiel.ch"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-2">Passwort</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={authData.password}
                      onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                      className="w-full px-4 py-3 bg-black rounded-xl border border-white/10 text-white placeholder-white/30 focus:border-red-500 focus:outline-none transition-colors pr-12"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                {authError && <p className="text-red-400 text-sm">{authError}</p>}
                <button
                  onClick={() => handleAuth('existing')}
                  className="w-full py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold rounded-xl transition-all"
                >
                  Weiter
                </button>
              </div>
            )}

            {mode === 'new' && (
              <div className="space-y-5">
                <button onClick={() => setMode('select')} className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-2">
                  <ArrowLeft className="w-4 h-4" /> Zurück
                </button>
                <h2 className="text-xl font-bold text-white">Account erstellen</h2>
                <div>
                  <label className="block text-white/60 text-sm mb-2">Name</label>
                  <input
                    type="text"
                    value={authData.name}
                    onChange={(e) => setAuthData({ ...authData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-black rounded-xl border border-white/10 text-white placeholder-white/30 focus:border-red-500 focus:outline-none transition-colors"
                    placeholder="Max Mustermann"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-2">E-Mail</label>
                  <input
                    type="email"
                    value={authData.email}
                    onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-black rounded-xl border border-white/10 text-white placeholder-white/30 focus:border-red-500 focus:outline-none transition-colors"
                    placeholder="max@beispiel.ch"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-2">Passwort</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={authData.password}
                      onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                      className="w-full px-4 py-3 bg-black rounded-xl border border-white/10 text-white placeholder-white/30 focus:border-red-500 focus:outline-none transition-colors pr-12"
                      placeholder="Mindestens 8 Zeichen"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={authData.newsletter}
                    onChange={(e) => setAuthData({ ...authData, newsletter: e.target.checked })}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-red-500"
                  />
                  <span className="text-white/60 text-sm">Newsletter abonnieren</span>
                </label>
                {authError && <p className="text-red-400 text-sm">{authError}</p>}
                <button
                  onClick={() => handleAuth('new')}
                  className="w-full py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold rounded-xl transition-all"
                >
                  Weiter
                </button>
              </div>
            )}

            {mode === 'card' && (
              <div className="space-y-5">
                <button onClick={() => setMode(authData.name ? 'new' : 'existing')} className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-2">
                  <ArrowLeft className="w-4 h-4" /> Zurück
                </button>
                <h2 className="text-xl font-bold text-white">Kartendaten eingeben</h2>
                <div>
                  <label className="block text-white/60 text-sm mb-2">Name des Karteninhabers *</label>
                  <input
                    type="text"
                    value={cardData.holder_name}
                    onChange={(e) => setCardData({ ...cardData, holder_name: e.target.value })}
                    className="w-full px-4 py-3 bg-black rounded-xl border border-white/10 text-white placeholder-white/30 focus:border-red-500 focus:outline-none transition-colors"
                    placeholder="Max Mustermann"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-2">E-Mail des Karteninhabers *</label>
                  <input
                    type="email"
                    value={cardData.holder_email}
                    onChange={(e) => setCardData({ ...cardData, holder_email: e.target.value })}
                    className="w-full px-4 py-3 bg-black rounded-xl border border-white/10 text-white placeholder-white/30 focus:border-red-500 focus:outline-none transition-colors"
                    placeholder="max@beispiel.ch"
                  />
                </div>
                {authError && <p className="text-red-400 text-sm">{authError}</p>}
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                  {loading ? 'Wird erstellt...' : 'Membership bestätigen'}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function MembershipClaimPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    }>
      <ClaimContent />
    </Suspense>
  )
}
