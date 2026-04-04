'use client'

import { useState, useEffect } from 'react'
import { Loader2, CheckCircle, XCircle, CreditCard } from 'lucide-react'

export default function SumUpAdminPage() {
  const [status, setStatus] = useState<any>(null)
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  useEffect(() => {
    checkStatus()
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/sumup/config')
      const data = await res.json()
      setConfig(data)
    } catch (error) {
      console.error('Failed to load config:', error)
    }
  }

  const checkStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/sumup/test')
      const data = await res.json()
      setStatus(data)
    } catch (error) {
      setStatus({ status: 'error', message: 'Failed to check status' })
    } finally {
      setLoading(false)
    }
  }

  const createTestCheckout = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/sumup/test', { method: 'POST' })
      const data = await res.json()
      setTestResult(data)
    } catch (error) {
      setTestResult({ status: 'error', message: 'Failed to create test checkout' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black pt-24">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-white mb-8">SumUp Integration</h1>

        {/* Status Card */}
        <div className="bg-zinc-900 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">API Status</h2>
            <button
              onClick={checkStatus}
              disabled={loading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aktualisieren'}
            </button>
          </div>

          {status ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {status.status === 'success' ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-500" />
                )}
                <span className={status.status === 'success' ? 'text-green-400' : 'text-red-400'}>
                  {status.message}
                </span>
              </div>
              
              {status.httpStatus && (
                <p className="text-sm text-zinc-400">HTTP Status: {status.httpStatus}</p>
              )}

              {status.merchant && (
                <div className="bg-zinc-800 rounded-lg p-4 space-y-2">
                  <p className="text-zinc-400">Merchant Code: <span className="text-white font-mono">{status.merchant.merchant_code}</span></p>
                  <p className="text-zinc-400">Name: <span className="text-white">{status.merchant.merchant_name}</span></p>
                  <p className="text-zinc-400">Email: <span className="text-white">{status.merchant.email}</span></p>
                  <p className="text-zinc-400">Status: <span className="text-white">{status.merchant.status}</span></p>
                  <p className="text-zinc-400">Config Match: 
                    <span className={status.match ? 'text-green-400' : 'text-red-400'}>
                      {status.match ? ' ✓' : ' ✗'}
                    </span>
                  </p>
                </div>
              )}

              {status.error && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                  <p className="text-red-400 text-sm">Error: {JSON.stringify(status.error, null, 2)}</p>
                </div>
              )}
              
              {status.raw_response && (
                <div className="mt-4">
                  <p className="text-zinc-400 text-sm mb-2">Raw API Response:</p>
                  <pre className="text-xs text-zinc-500 bg-black/30 p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(status.raw_response, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <p className="text-zinc-500">Lade Status...</p>
          )}
        </div>

        {/* Test Checkout Card */}
        <div className="bg-zinc-900 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Test Checkout</h2>
          <p className="text-zinc-400 mb-4">
            Erstelle einen Test-Checkout mit CHF 1.00 um die Integration zu testen.
          </p>
          <button
            onClick={createTestCheckout}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 text-white rounded-lg font-medium"
          >
            <CreditCard className="w-5 h-5" />
            {loading ? 'Wird erstellt...' : 'Test Checkout erstellen'}
          </button>

          {testResult && (
            <div className="mt-4 bg-zinc-800 rounded-lg p-4">
              {testResult.status === 'success' ? (
                <div className="space-y-2">
                  <p className="text-green-400">✓ Checkout erstellt!</p>
                  <p className="text-zinc-400 text-sm">Checkout ID: <span className="text-white font-mono">{testResult.checkout.id}</span></p>
                  <p className="text-zinc-400 text-sm">Status: <span className="text-green-400">{testResult.checkout.status}</span></p>
                  <p className="text-zinc-400 text-sm">Amount: {testResult.checkout.amount} {testResult.checkout.currency}</p>
                  
                  <div className="mt-4 flex flex-col gap-2">
                    <a 
                      href={`https://dashboard.sumup.com/sales/transactions/${testResult.checkout.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                    >
                      Zum SumUp Dashboard →
                    </a>
                  </div>
                  
                  <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <p className="text-blue-400 font-medium mb-2">ℹ️ SumUp Online Payments</p>
                    <p className="text-blue-200/70 text-sm">
                      Für Online-Zahlungen muss das <strong>SumUp Card Widget</strong> auf der Checkout-Seite eingebunden werden.
                      Die checkout.id wird dabei verwendet.
                    </p>
                    <a 
                      href="https://developer.sumup.com/online-payments/sdks/js"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline text-sm mt-2 inline-block"
                    >
                      SumUp JS SDK Dokumentation →
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-red-400">
                  <p>✗ Fehler: {testResult.message}</p>
                  {testResult.httpStatus && <p className="text-sm">HTTP Status: {testResult.httpStatus}</p>}
                  {testResult.error && (
                    <pre className="mt-2 text-xs text-red-300 overflow-auto bg-red-950/30 p-2 rounded">
                      {JSON.stringify(testResult.error, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Configuration Info */}
        <div className="bg-zinc-900 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Konfiguration</h2>
          <div className="space-y-2 text-sm">
            <p className="text-zinc-400">
              API Key: <span className="text-white">{config?.hasApiKey ? `✓ ${config.apiKeyPrefix}` : '✗ Nicht konfiguriert'}</span>
            </p>
            <p className="text-zinc-400">
              Merchant Code: <span className="text-white">{config?.hasMerchantCode ? `✓ ${config.merchantCode}` : '✗ Nicht konfiguriert'}</span>
            </p>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
            <h3 className="text-yellow-400 font-medium mb-2">Wichtige Hinweise:</h3>
            <ul className="text-yellow-200/70 text-sm space-y-1 list-disc list-inside">
              <li>Der API Key muss ein <strong>Secret API Key</strong> sein (nicht Public)</li>
              <li>Der Merchant muss vollständig aktiviert sein bei SumUp</li>
              <li>Die Return URL muss öffentlich erreichbar sein</li>
              <li>Für Produktion: Webhook konfigurieren für Payment Notifications</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
