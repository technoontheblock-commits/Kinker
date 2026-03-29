'use client'

import { useState, useEffect } from 'react'
import { User, Mail, Phone, Lock, Bell, Shield, Camera, Loader2, Check } from 'lucide-react'

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

  const [notifications, setNotifications] = useState({
    events: true,
    orders: true,
    newsletter: false,
  })

  // Load user data on mount
  useEffect(() => {
    loadProfile()
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
        setNotifications({
          events: data.preferences?.events ?? true,
          orders: data.preferences?.orders ?? true,
          newsletter: data.newsletter_opt_in ?? false,
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
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
          preferences: notifications,
          newsletter_opt_in: notifications.newsletter,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
        <p className="text-white/60">Manage your profile and preferences</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
          {message.text}
        </div>
      )}

      {/* Profile Section */}
      <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
        <h2 className="text-xl font-bold text-white mb-6">Profile</h2>
        
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-white" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
            <Camera className="w-4 h-4" />
            Change Photo
          </button>
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
      <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Lock className="w-5 h-5 text-red-500" />
          Change Password
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="password"
            placeholder="Current Password"
            value={formData.currentPassword}
            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
            className="px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40"
          />
          <input
            type="password"
            placeholder="New Password"
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            className="px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40"
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/40"
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

      {/* Notifications */}
      <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Bell className="w-5 h-5 text-red-500" />
          Notifications
        </h2>
        <div className="space-y-4">
          {Object.entries(notifications).map(([key, value]) => (
            <label key={key} className="flex items-center justify-between p-4 bg-black/30 rounded-lg cursor-pointer">
              <span className="text-white capitalize">{key} Notifications</span>
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                className="w-5 h-5 accent-red-500"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-500" />
          Security
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
            <div>
              <p className="text-white font-medium">Two-Factor Authentication</p>
              <p className="text-white/60 text-sm">Add an extra layer of security</p>
            </div>
            <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors opacity-50 cursor-not-allowed" disabled>
              Coming Soon
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
            <div>
              <p className="text-white font-medium">Active Sessions</p>
              <p className="text-white/60 text-sm">Manage your logged in devices</p>
            </div>
            <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors opacity-50 cursor-not-allowed" disabled>
              Coming Soon
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button 
          onClick={saveProfile}
          disabled={saving}
          className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
          Save Changes
        </button>
      </div>
    </div>
  )
}
