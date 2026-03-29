'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LogoIcon } from '@/components/logo'

export default function RegisterPage() {
  const router = useRouter()
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    newsletter: false
  })

  // Check if already logged in
  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/session')
      const data = await res.json()
      if (data.user) {
        router.push('/dashboard')
      }
    } catch (err) {
      // Not logged in, stay on page
    }
  }

  const validateForm = () => {
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First name and last name are required')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) return

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
          email: formData.email,
          password: formData.password,
          newsletter: formData.newsletter
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed')
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

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Account Created!</h1>
          <p className="text-white/60 mb-6">Redirecting to login...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-neutral-900/80 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-6">
              <LogoIcon className="h-12 w-auto mx-auto" />
            </Link>
            <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-white/60">Join the KINKER community</p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
            >
              <p className="text-red-500 text-sm text-center">{error}</p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                    placeholder="John"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                    placeholder="Doe"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
              <p className="text-white/40 text-xs mt-1">At least 8 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Newsletter */}
            <label className="flex items-start gap-2 text-sm text-white/60 cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.newsletter}
                onChange={(e) => setFormData({ ...formData, newsletter: e.target.checked })}
                className="mt-0.5 rounded border-white/20 bg-black/50" 
              />
              <span>
                Subscribe to our newsletter for exclusive events and updates
              </span>
            </label>

            {/* Terms */}
            <label className="flex items-start gap-2 text-sm text-white/60 cursor-pointer">
              <input type="checkbox" required className="mt-0.5 rounded border-white/20 bg-black/50" />
              <span>
                I agree to the{' '}
                <Link href="/terms" className="text-red-500 hover:text-red-400">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-red-500 hover:text-red-400">Privacy Policy</Link>
              </span>
            </label>

            {/* Submit */}
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
                  Create Account
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-neutral-900 text-white/40">or</span>
            </div>
          </div>

          {/* Login Link */}
          <p className="text-center text-white/60">
            Already have an account?{' '}
            <Link href="/login" className="text-red-500 hover:text-red-400 font-medium">
              Sign in
            </Link>
          </p>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link href="/" className="text-white/40 hover:text-white text-sm transition-colors">
            ← Back to homepage
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
