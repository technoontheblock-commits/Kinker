'use client'

import { motion } from 'framer-motion'
import { Calendar, Ticket, Building, Shirt, ExternalLink, Gift, Mail } from 'lucide-react'

interface DeveloperTabProps {
  testEmail: string
  setTestEmail: (v: string) => void
  testEmailLoading: boolean
  setTestEmailLoading: (v: boolean) => void
  testEmailResult: { success?: boolean; message?: string; code?: string } | null
  setTestEmailResult: (r: { success?: boolean; message?: string; code?: string } | null) => void
  sendTestVerificationEmail: () => Promise<void>
  setActiveTab: (tab: string) => void
}

export default function DeveloperTab({
  testEmail,
  setTestEmail,
  testEmailLoading,
  setTestEmailLoading,
  testEmailResult,
  setTestEmailResult,
  sendTestVerificationEmail,
  setActiveTab
}: DeveloperTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-white">Developer</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <button
          onClick={() => setActiveTab('events')}
          className="p-6 bg-neutral-900/50 rounded-xl border border-white/10 hover:border-red-500/50 transition-all text-left"
        >
          <Calendar className="w-8 h-8 text-red-500 mb-3" />
          <h3 className="text-white font-semibold">Events</h3>
          <p className="text-white/50 text-sm mt-1">Events verwalten</p>
        </button>

        <button
          onClick={() => setActiveTab('tickets')}
          className="p-6 bg-neutral-900/50 rounded-xl border border-white/10 hover:border-red-500/50 transition-all text-left"
        >
          <Ticket className="w-8 h-8 text-red-500 mb-3" />
          <h3 className="text-white font-semibold">Tickets</h3>
          <p className="text-white/50 text-sm mt-1">Tickets verwalten</p>
        </button>

        <button
          onClick={() => setActiveTab('rental')}
          className="p-6 bg-neutral-900/50 rounded-xl border border-white/10 hover:border-red-500/50 transition-all text-left"
        >
          <Building className="w-8 h-8 text-red-500 mb-3" />
          <h3 className="text-white font-semibold">Raumanfragen</h3>
          <p className="text-white/50 text-sm mt-1">Raumanfragen verwalten</p>
        </button>

        <button
          onClick={() => setActiveTab('printful')}
          className="p-6 bg-neutral-900/50 rounded-xl border border-white/10 hover:border-red-500/50 transition-all text-left"
        >
          <Shirt className="w-8 h-8 text-red-500 mb-3" />
          <h3 className="text-white font-semibold">Printful</h3>
          <p className="text-white/50 text-sm mt-1">Produkte synchronisieren</p>
        </button>

        <a
          href="/admin/eventfrog"
          className="p-6 bg-neutral-900/50 rounded-xl border border-white/10 hover:border-red-500/50 transition-all text-left block"
        >
          <ExternalLink className="w-8 h-8 text-red-500 mb-3" />
          <h3 className="text-white font-semibold">Eventfrog</h3>
          <p className="text-white/50 text-sm mt-1">Eventfrog Integration</p>
        </a>

        <a
          href="/admin/rewards"
          className="p-6 bg-neutral-900/50 rounded-xl border border-white/10 hover:border-red-500/50 transition-all text-left block"
        >
          <Gift className="w-8 h-8 text-red-500 mb-3" />
          <h3 className="text-white font-semibold">Reward Validator</h3>
          <p className="text-white/50 text-sm mt-1">Rewards verifizieren</p>
        </a>

        <a
          href="/admin/email-test"
          className="p-6 bg-neutral-900/50 rounded-xl border border-white/10 hover:border-red-500/50 transition-all text-left block"
        >
          <Mail className="w-8 h-8 text-red-500 mb-3" />
          <h3 className="text-white font-semibold">Email Test</h3>
          <p className="text-white/50 text-sm mt-1">E-Mails testen</p>
        </a>
      </div>

      {/* Test Verification Email */}
      <div className="mt-8 p-6 bg-neutral-900/50 rounded-xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-red-500" />
          Test Verification Email
        </h3>
        <p className="text-white/50 text-sm mb-4">
          Send a test verification email to any address to preview how it looks in the inbox.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="test@example.com"
            className="flex-1 px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
          />
          <button
            onClick={sendTestVerificationEmail}
            disabled={testEmailLoading}
            className="px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-white/10 disabled:text-white/30 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            {testEmailLoading ? 'Sending...' : 'Send Test Email'}
          </button>
        </div>
        {testEmailResult && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${testEmailResult.success ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
            {testEmailResult.message}
            {testEmailResult.code && (
              <p className="mt-1 font-mono text-lg tracking-widest">Code: {testEmailResult.code}</p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
