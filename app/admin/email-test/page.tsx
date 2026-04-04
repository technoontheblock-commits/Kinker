'use client'

import { useState } from 'react'
import { Mail, Send, Loader2, Check, AlertCircle } from 'lucide-react'

export default function EmailTestPage() {
  const [email, setEmail] = useState('technoontheblock@gmail.com')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const sendTest = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const res = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
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
          <p className="text-white/60">Teste die E-Mail Funktion</p>
        </div>

        {result && (
          <div className={`mb-6 p-4 rounded-lg ${result.success ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
            <div className="flex items-center gap-2">
              {result.success ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              {result.error || 'Email sent successfully!'}
            </div>
            {result.data && (
              <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(result.data, null, 2)}</pre>
            )}
          </div>
        )}

        <div className="bg-neutral-900 rounded-xl p-6 border border-white/10 space-y-6">
          <div>
            <label className="block text-white/60 text-sm mb-2">E-Mail Adresse</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white"
            />
          </div>

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
                Send Test Email
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
          </ul>
        </div>
      </div>
    </div>
  )
}
