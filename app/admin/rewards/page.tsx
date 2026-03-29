'use client'

import { useState } from 'react'
import { Search, CheckCircle, XCircle, Gift, Loader2 } from 'lucide-react'

export default function RewardsValidationPage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const validateCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch(`/api/rewards/validate?code=${encodeURIComponent(code.trim())}`)
      const data = await res.json()

      if (res.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Invalid code')
      }
    } catch (err) {
      setError('Failed to validate code')
    } finally {
      setLoading(false)
    }
  }

  const redeemCode = async () => {
    if (!result?.redemption?.id) return

    setLoading(true)
    try {
      const res = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redemption_id: result.redemption.id })
      })

      const data = await res.json()

      if (res.ok) {
        setResult({ ...result, redemption: { ...result.redemption, status: 'used' } })
      } else {
        setError(data.error || 'Failed to redeem')
      }
    } catch (err) {
      setError('Failed to redeem code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Reward Validation</h1>
          <p className="text-white/60">Enter a reward code to validate and redeem</p>
        </div>

        {/* Search Form */}
        <form onSubmit={validateCode} className="mb-8">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter code (e.g., KINKER-A3F9K2)"
                className="w-full bg-neutral-900 border border-white/10 rounded-lg py-4 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:border-red-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="px-6 py-4 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Validate'}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="mb-6 p-6 bg-red-500/10 border border-red-500/20 rounded-xl">
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-red-500 font-semibold">Invalid Code</p>
                <p className="text-white/60 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`p-6 rounded-xl border ${result.redemption.status === 'used' ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
            <div className="flex items-start gap-4">
              {result.redemption.status === 'used' ? (
                <XCircle className="w-10 h-10 text-yellow-500 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-10 h-10 text-green-500 flex-shrink-0" />
              )}
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-white">{result.reward.name}</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    result.redemption.status === 'used' 
                      ? 'bg-yellow-500/20 text-yellow-500' 
                      : 'bg-green-500/20 text-green-500'
                  }`}>
                    {result.redemption.status === 'used' ? 'Already Used' : 'Valid'}
                  </span>
                </div>
                
                <p className="text-white/60 mb-4">{result.reward.description}</p>
                
                <div className="space-y-2 text-sm">
                  <p className="text-white/80">
                    <span className="text-white/40">Code:</span>{' '}
                    <span className="font-mono text-red-500">{result.redemption.code}</span>
                  </p>
                  <p className="text-white/80">
                    <span className="text-white/40">Customer:</span> {result.user.name} ({result.user.email})
                  </p>
                  <p className="text-white/80">
                    <span className="text-white/40">Points Used:</span> {result.redemption.points_used}
                  </p>
                  <p className="text-white/80">
                    <span className="text-white/40">Redeemed:</span>{' '}
                    {new Date(result.redemption.created_at).toLocaleDateString('de-CH')}
                  </p>
                  {result.redemption.expires_at && (
                    <p className="text-white/80">
                      <span className="text-white/40">Expires:</span>{' '}
                      {new Date(result.redemption.expires_at).toLocaleDateString('de-CH')}
                    </p>
                  )}
                </div>

                {/* Redeem Button */}
                {result.redemption.status !== 'used' && (
                  <button
                    onClick={redeemCode}
                    disabled={loading}
                    className="mt-6 w-full py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white font-semibold rounded-lg transition-colors"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Mark as Used'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 p-6 bg-neutral-900 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">How to use</h3>
          <ol className="space-y-2 text-white/60 text-sm list-decimal list-inside">
            <li>Enter the reward code provided by the customer</li>
            <li>Click "Validate" to check if the code is valid</li>
            <li>Verify the customer and reward details</li>
            <li>Click "Mark as Used" to redeem the reward</li>
            <li>Give the customer their reward (discount, free ticket, etc.)</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
