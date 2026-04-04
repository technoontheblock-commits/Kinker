'use client'

import { useState, useEffect } from 'react'
import { Mail, Send, Loader2, Users, AlertCircle, Check } from 'lucide-react'

export default function NewsletterAdminPage() {
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [testEmail, setTestEmail] = useState('')
  const [subscriberCount, setSubscriberCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    loadSubscriberCount()
  }, [])

  const loadSubscriberCount = async () => {
    try {
      const res = await fetch('/api/admin/newsletter/subscribers')
      if (res.ok) {
        const data = await res.json()
        setSubscriberCount(data.count || 0)
      }
    } catch (error) {
      console.error('Error loading subscribers:', error)
    }
  }

  const sendTest = async () => {
    if (!testEmail || !subject || !content) return
    
    setLoading(true)
    setResult(null)
    
    try {
      const res = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          content,
          testOnly: true,
          testEmail
        })
      })
      
      const data = await res.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Failed to send test email' })
    } finally {
      setLoading(false)
    }
  }

  const sendToAll = async () => {
    if (!subject || !content) return
    
    if (!confirm(`Send to ${subscriberCount} subscribers?`)) return
    
    setLoading(true)
    setResult(null)
    
    try {
      const res = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          content,
          testOnly: false
        })
      })
      
      const data = await res.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Failed to send newsletter' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Newsletter</h1>
          <p className="text-white/60">Send emails to {subscriberCount} subscribers</p>
        </div>

        {result && (
          <div className={`mb-6 p-4 rounded-lg ${result.error ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
            {result.error ? (
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {result.error}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                Sent to {result.sent} recipients ({result.failed} failed)
              </div>
            )}
          </div>
        )}

        <div className="bg-neutral-900 rounded-xl p-6 border border-white/10 space-y-6">
          {/* Subject */}
          <div>
            <label className="block text-white/60 text-sm mb-2">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="New Event: Hard Sessions #042"
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-white/60 text-sm mb-2">Content (HTML) *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              placeholder="<h2>Hello!</h2><p>New event coming up...</p>"
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm"
            />
          </div>

          {/* Test Email */}
          <div className="border-t border-white/10 pt-6">
            <label className="block text-white/60 text-sm mb-2">Test Email</label>
            <div className="flex gap-3">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white"
              />
              <button
                onClick={sendTest}
                disabled={loading || !testEmail || !subject || !content}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Test
              </button>
            </div>
          </div>

          {/* Send to All */}
          <div className="border-t border-white/10 pt-6">
            <button
              onClick={sendToAll}
              disabled={loading || !subject || !content}
              className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Users className="w-5 h-5" />
                  Send to {subscriberCount} Subscribers
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview */}
        {content && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-white mb-4">Preview</h2>
            <div 
              className="bg-neutral-900 rounded-xl p-8 border border-white/10 prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
