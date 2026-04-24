'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Lock, ArrowRight, Loader2, Check, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LogoIcon } from '@/components/logo'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [isLoading, setIsLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link')
      setValidating(false)
      return
    }

    // Validate token
    fetch(`/api/auth/reset-password?token=${token}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Invalid or expired link')
        }
        setValidating(false)
      })
      .catch((err) => {
        setError(err.message)
        setValidating(false)
      })
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Reset failed')
      }

      setSuccess(true)
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (validating) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto" />
        <p className="text-white/60 mt-4">Validating link...</p>
      </div>
    )
  }

  return (
    <>
      <div className="text-center mb-8">
        <Link href="/" className="inline-block mb-6">
          <LogoIcon className="h-12 w-auto mx-auto" />
        </Link>
        <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
        <p className="text-white/60">Enter your new password</p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
        >
          <p className="text-red-500 text-sm text-center">{error}</p>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3"
        >
          <Check className="w-5 h-5 text-green-400 shrink-0" />
          <p className="text-green-400 text-sm">Password reset successfully! Redirecting to login...</p>
        </motion.div>
      )}

      {!success && !error.includes('Invalid') && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-12 pr-12 text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-white/40 text-xs mt-2">Minimum 8 characters</p>
          </div>

          <Button
            type="submit"
            variant="glitch"
            size="lg"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Reset Password
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </form>
      )}

      <p className="text-center text-white/60 mt-6">
        <Link href="/login" className="text-red-500 hover:text-red-400 font-medium">
          Back to sign in
        </Link>
      </p>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 pt-24 lg:pt-28">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="bg-neutral-900/80 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
          <Suspense fallback={
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto" />
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </motion.div>
    </div>
  )
}
