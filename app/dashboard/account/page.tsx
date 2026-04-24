'use client'

import { useState, useEffect } from 'react'
import { User, Mail, Phone, Lock, Shield, Camera, Loader2, Check, Monitor, Smartphone, LogOut, QrCode, Copy, Eye, EyeOff, X } from 'lucide-react'

interface Session {
  id: string
  device_info: string
  ip_address: string
  created_at: string
  last_active_at: string
}

export default function AccountPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  // Sessions
  const [sessions, setSessions] = useState<Session[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)

  // 2FA
  const [twoFAEnabled, setTwoFAEnabled] = useState(false)
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [twoFAQRCode, setTwoFAQRCode] = useState('')
  const [twoFASecret, setTwoFASecret] = useState('')
  const [twoFAVerifyCode, setTwoFAVerifyCode] = useState('')
  const [twoFALoading, setTwoFALoading] = useState(false)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [showDisable2FA, setShowDisable2FA] = useState(false)
  const [disable2FACode, setDisable2FACode] = useState('')

  // Load user data on mount
  useEffect(() => {
    loadProfile()
    loadSessions()
  }, [])

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const data = await res.json()
        setFormData(prev => ({
          ...prev,
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
        }))
        setAvatarUrl(data.avatar_url || null)
        setTwoFAEnabled(data.totp_enabled || false)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSessions = async () => {
    setSessionsLoading(true)
    try {
      const res = await fetch('/api/user/sessions')
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions || [])
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
    } finally {
      setSessionsLoading(false)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    setMessage(null)
    
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
        })
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Profile saved successfully!' })
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to save profile' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 5MB' })
      return
    }

    setUploading(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        const data = await res.json()
        setAvatarUrl(data.avatar_url)
        setMessage({ type: 'success', text: 'Profile photo updated!' })
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to upload photo' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while uploading' })
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    setUploading(true)
    try {
      const res = await fetch('/api/user/avatar', { method: 'DELETE' })
      if (res.ok) {
        setAvatarUrl(null)
        setMessage({ type: 'success', text: 'Profile photo removed' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove photo' })
    } finally {
      setUploading(false)
    }
  }

  const changePassword = async () => {
    if (!formData.currentPassword || !formData.newPassword) {
      setMessage({ type: 'error', text: 'Please fill in all password fields' })
      return
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }
    if (formData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        })
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully!' })
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }))
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to change password' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' })
    } finally {
      setSaving(false)
    }
  }

  // Session management
  const terminateSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/user/sessions/${sessionId}`, { method: 'DELETE' })
      if (res.ok) {
        await loadSessions()
        setMessage({ type: 'success', text: 'Session terminated' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to terminate session' })
    }
  }

  const terminateAllOtherSessions = async () => {
    try {
      const res = await fetch('/api/user/sessions', { method: 'DELETE' })
      if (res.ok) {
        await loadSessions()
        setMessage({ type: 'success', text: 'All other sessions terminated' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to terminate sessions' })
    }
  }

  const getSessionIcon = (deviceInfo: string) => {
    if (deviceInfo?.toLowerCase().includes('mobile')) return <Smartphone className="w-5 h-5 text-white/60" />
    return <Monitor className="w-5 h-5 text-white/60" />
  }

  // 2FA setup
  const start2FASetup = async () => {
    setTwoFALoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/user/2fa/setup', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setTwoFAQRCode(data.qrCode)
        setTwoFASecret(data.secret)
        setShow2FASetup(true)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to setup 2FA' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to setup 2FA' })
    } finally {
      setTwoFALoading(false)
    }
  }

  const verify2FA = async () => {
    if (!twoFAVerifyCode || twoFAVerifyCode.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter a 6-digit code' })
      return
    }
    setTwoFALoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/user/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: twoFAVerifyCode })
      })
      const data = await res.json()
      if (res.ok) {
        setTwoFAEnabled(true)
        setBackupCodes(data.backupCodes || [])
        setShow2FASetup(false)
        setShowBackupCodes(true)
        setTwoFAVerifyCode('')
        setMessage({ type: 'success', text: '2FA enabled successfully!' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Invalid code' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to verify code' })
    } finally {
      setTwoFALoading(false)
    }
  }

  const disable2FA = async () => {
    if (!disable2FACode) {
      setMessage({ type: 'error', text: 'Please enter a code' })
      return
    }
    setTwoFALoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/user/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: disable2FACode })
      })
      const data = await res.json()
      if (res.ok) {
        setTwoFAEnabled(false)
        setShowDisable2FA(false)
        setDisable2FACode('')
        setMessage({ type: 'success', text: '2FA disabled successfully' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Invalid code' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to disable 2FA' })
    } finally {
      setTwoFALoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setMessage({ type: 'success', text: 'Copied to clipboard' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Account Settings</h1>
        <p className="text-white/60">Manage your profile and preferences</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
          {message.text}
        </div>
      )}

      {/* Profile Section */}
      <div className="bg-neutral-900 rounded-xl p-4 md:p-6 border border-white/10">
        <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">Profile</h2>
        
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="Profile" 
                className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-white/20"
              />
            ) : (
              <div className="w-16 h-16 md:w-20 md:h-20 bg-red-500 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer text-sm">
              <Camera className="w-4 h-4" />
              Change Photo
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarChange}
                className="hidden"
                disabled={uploading}
              />
            </label>
            {avatarUrl && (
              <button 
                onClick={handleRemoveAvatar}
                disabled={uploading}
                className="px-3 py-2 md:px-4 md:py-2 text-red-400 hover:text-red-300 transition-colors text-sm"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white/60 text-sm mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-white/60 text-sm mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full pl-12 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white/60 cursor-not-allowed"
              />
            </div>
            <p className="text-white/40 text-xs mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="block text-white/60 text-sm mb-2">Phone</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white"
                placeholder="+41 79 123 45 67"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Password Section */}
      <div className="bg-neutral-900 rounded-xl p-4 md:p-6 border border-white/10">
        <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 flex items-center gap-2">
          <Lock className="w-5 h-5 text-red-500" />
          Change Password
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="password"
            placeholder="Current Password"
            value={formData.currentPassword}
            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
            className="px-4 py-2.5 md:py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40"
          />
          <input
            type="password"
            placeholder="New Password"
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            className="px-4 py-2.5 md:py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40"
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="px-4 py-2.5 md:py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button 
            onClick={changePassword}
            disabled={saving}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Change Password'}
          </button>
        </div>
      </div>

      {/* Security */}
      <div className="bg-neutral-900 rounded-xl p-4 md:p-6 border border-white/10">
        <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-500" />
          Security
        </h2>

        {/* Two-Factor Authentication */}
        <div className="mb-6">
          <div className="flex items-center justify-between p-3 md:p-4 bg-black/30 rounded-lg text-sm md:text-base">
            <div>
              <p className="text-white font-medium">Two-Factor Authentication</p>
              <p className="text-white/60 text-sm">
                {twoFAEnabled ? 'Enabled - Your account is protected' : 'Add an extra layer of security'}
              </p>
            </div>
            {twoFAEnabled ? (
              <button 
                onClick={() => setShowDisable2FA(true)}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg transition-colors text-sm"
              >
                Disable
              </button>
            ) : (
              <button 
                onClick={start2FASetup}
                disabled={twoFALoading}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                {twoFALoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enable'}
              </button>
            )}
          </div>

          {/* 2FA Setup Modal */}
          {show2FASetup && (
            <div className="mt-4 p-4 bg-black/30 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Setup 2FA</h3>
                <button onClick={() => setShow2FASetup(false)} className="text-white/60 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {twoFAQRCode && (
                <div className="space-y-4">
                  <div className="flex flex-col items-center">
                    <img src={twoFAQRCode} alt="2FA QR Code" className="w-48 h-48 rounded-lg" />
                    <p className="text-white/60 text-sm mt-2 text-center">
                      Scan this QR code with your authenticator app
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-black/50 rounded-lg text-white/80 text-sm font-mono break-all">
                      {twoFASecret}
                    </code>
                    <button 
                      onClick={() => copyToClipboard(twoFASecret)}
                      className="p-2 text-white/60 hover:text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-white/60 text-sm mb-2">Enter 6-digit code</label>
                    <input
                      type="text"
                      value={twoFAVerifyCode}
                      onChange={(e) => setTwoFAVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white text-center text-xl tracking-[0.5em] placeholder:text-white/30"
                      placeholder="000000"
                    />
                  </div>

                  <button
                    onClick={verify2FA}
                    disabled={twoFALoading || twoFAVerifyCode.length !== 6}
                    className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {twoFALoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Verify & Enable'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Disable 2FA Modal */}
          {showDisable2FA && (
            <div className="mt-4 p-4 bg-black/30 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Disable 2FA</h3>
                <button onClick={() => setShowDisable2FA(false)} className="text-white/60 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-white/60 text-sm mb-4">
                Enter your 2FA code or a backup code to disable two-factor authentication.
              </p>
              <input
                type="text"
                value={disable2FACode}
                onChange={(e) => setDisable2FACode(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/30 mb-4"
                placeholder="Enter code"
              />
              <button
                onClick={disable2FA}
                disabled={twoFALoading || !disable2FACode}
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {twoFALoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Disable 2FA'}
              </button>
            </div>
          )}

          {/* Backup Codes Modal */}
          {showBackupCodes && backupCodes.length > 0 && (
            <div className="mt-4 p-4 bg-black/30 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Backup Codes</h3>
                <button onClick={() => setShowBackupCodes(false)} className="text-white/60 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-white/60 text-sm mb-4">
                Save these backup codes in a safe place. Each code can only be used once.
              </p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {backupCodes.map((code, i) => (
                  <code key={i} className="px-3 py-2 bg-black/50 rounded-lg text-white/80 text-sm font-mono text-center">
                    {code}
                  </code>
                ))}
              </div>
              <button
                onClick={() => copyToClipboard(backupCodes.join('\n'))}
                className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
              >
                Copy All Codes
              </button>
            </div>
          )}
        </div>

        {/* Active Sessions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white font-medium">Active Sessions</p>
              <p className="text-white/60 text-sm">Manage your logged in devices</p>
            </div>
            {sessions.length > 1 && (
              <button
                onClick={terminateAllOtherSessions}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
              >
                Log out all others
              </button>
            )}
          </div>

          {sessionsLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session, index) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getSessionIcon(session.device_info)}
                    <div>
                      <p className="text-white text-sm">
                        {session.device_info || 'Unknown Device'}
                        {index === 0 && <span className="ml-2 text-green-500 text-xs">Current</span>}
                      </p>
                      <p className="text-white/40 text-xs">
                        {session.ip_address} · {new Date(session.created_at).toLocaleDateString('de-CH')}
                      </p>
                    </div>
                  </div>
                  {index !== 0 && (
                    <button
                      onClick={() => terminateSession(session.id)}
                      className="p-2 text-white/40 hover:text-red-500 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {sessions.length === 0 && (
                <p className="text-white/40 text-sm text-center py-4">No active sessions</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button 
          onClick={saveProfile}
          disabled={saving}
          className="px-6 py-2.5 md:px-8 md:py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 text-sm md:text-base"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
          Save Changes
        </button>
      </div>
    </div>
  )
}
