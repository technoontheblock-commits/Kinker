'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Check, X, CreditCard, ScanLine, Volume2, VolumeX, Hash } from 'lucide-react'

type ScanResult = {
  valid: boolean
  message: string
  card?: {
    holder_name: string
    card_number: string
    scan_count: number
  }
  payment_status?: string
  status?: string
  type: 'bonuscard'
}

export default function ScannerPage() {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState('')
  const [scanCount, setScanCount] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  const videoContainerRef = useRef<HTMLDivElement>(null)
  const scannerRef = useRef<any>(null)
  const lastScanRef = useRef<string>('')
  const lastScanTimeRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const playBeep = useCallback((type: 'success' | 'error') => {
    if (!soundEnabled) return
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return
      const audioCtx = new AudioContextClass()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)

      if (type === 'success') {
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime)
        oscillator.frequency.setValueAtTime(1175, audioCtx.currentTime + 0.08)
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2)
        oscillator.start()
        oscillator.stop(audioCtx.currentTime + 0.2)
      } else {
        oscillator.frequency.setValueAtTime(220, audioCtx.currentTime)
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3)
        oscillator.start()
        oscillator.stop(audioCtx.currentTime + 0.3)
      }
    } catch {
      // Audio nicht verfügbar
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(type === 'success' ? [60] : [120, 60, 120])
    }
  }, [soundEnabled])

  const clearResult = useCallback(() => {
    setResult(null)
    setIsProcessing(false)
  }, [])

  const handleScan = useCallback(async (qrCode: string) => {
    if (isProcessing) return

    const now = Date.now()
    if (lastScanRef.current === qrCode && now - lastScanTimeRef.current < 3000) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    setIsProcessing(true)
    lastScanRef.current = qrCode
    lastScanTimeRef.current = now

    try {
      const isBonusCard = qrCode.startsWith('KINKER-BC-')

      if (!isBonusCard) {
        setResult({
          valid: false,
          message: 'Ungültiger QR-Code',
          type: 'bonuscard'
        })
        playBeep('error')
        timeoutRef.current = setTimeout(clearResult, 2000)
        return
      }

      const response = await fetch('/api/membership/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_code: qrCode })
      })

      const data = await response.json()
      const scanResult: ScanResult = {
        valid: data.valid,
        message: data.message,
        card: data.card,
        payment_status: data.payment_status,
        status: data.status,
        type: 'bonuscard'
      }

      setResult(scanResult)

      if (scanResult.valid) {
        setScanCount(prev => prev + 1)
        playBeep('success')
      } else {
        playBeep('error')
      }

      timeoutRef.current = setTimeout(clearResult, 2500)
    } catch {
      setResult({
        valid: false,
        message: 'Validierung fehlgeschlagen',
        type: 'bonuscard'
      })
      playBeep('error')
      timeoutRef.current = setTimeout(clearResult, 2000)
    }
  }, [isProcessing, playBeep, clearResult])

  const startScanner = useCallback(async () => {
    if (!videoContainerRef.current) return
    setError('')
    setResult(null)

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')

      scannerRef.current = new Html5Qrcode('scanner-video-container')

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 260, height: 260 },
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          handleScan(decodedText)
        },
        () => {
          // QR-Code nicht im Frame – ignorieren
        }
      )

      setScanning(true)
    } catch (err: any) {
      console.error('Scanner start error:', err)
      setError(err?.message || 'Kamera konnte nicht gestartet werden. Bitte Berechtigungen prüfen.')
      setScanning(false)
    }
  }, [handleScan])

  const stopScanner = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop()
        }
        await scannerRef.current.clear()
      } catch {
        // Ignorieren
      } finally {
        scannerRef.current = null
      }
    }
    setScanning(false)
    setResult(null)
    setIsProcessing(false)
  }, [])

  const validateCode = async (qrCode: string) => {
    if (!qrCode.trim()) return
    await handleScan(qrCode.trim())
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => {})
          }
          scannerRef.current.clear().catch(() => {})
        } catch {
          // Ignorieren
        }
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">Scanner</h1>
            {scanCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                <Hash className="w-4 h-4" />
                {scanCount} gescannt
              </div>
            )}
          </div>

          {!scanning && !result && (
            <div className="space-y-4">
              <button
                onClick={startScanner}
                className="w-full py-6 bg-red-500 hover:bg-red-600 rounded-xl flex items-center justify-center gap-3 text-white font-semibold transition-colors"
              >
                <Camera className="w-6 h-6" />
                Scanner starten
              </button>

              <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
                <p className="text-white/60 text-sm mb-3">Manuelle Eingabe</p>
                <input
                  type="text"
                  placeholder="QR-Code manuell eingeben"
                  className="w-full px-4 py-3 bg-black rounded-lg border border-white/10 text-white placeholder-white/30 focus:border-red-500 focus:outline-none transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      validateCode(e.currentTarget.value)
                      e.currentTarget.value = ''
                    }
                  }}
                />
              </div>
            </div>
          )}

          {scanning && (
            <div className="relative">
              {/* Toolbar */}
              <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between">
                <button
                  onClick={() => setSoundEnabled(prev => !prev)}
                  className="p-2 bg-black/60 backdrop-blur-sm rounded-full text-white/80 hover:text-white transition-colors"
                  title={soundEnabled ? 'Ton aus' : 'Ton an'}
                >
                  {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
                <button
                  onClick={stopScanner}
                  className="p-2 bg-black/60 backdrop-blur-sm rounded-full text-white/80 hover:text-white transition-colors"
                  title="Scanner stoppen"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Video Container */}
              <div className="relative aspect-square bg-neutral-900 rounded-xl overflow-hidden border border-white/10">
                <div id="scanner-video-container" ref={videoContainerRef} className="w-full h-full" />

                {/* Scanner Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-red-500 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-red-500 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-red-500 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-red-500 rounded-br-lg" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-px bg-red-500/50" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-40 bg-red-500/50" />
                  </div>
                </div>

                {/* Scanning Indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full text-white/80 text-sm">
                  <ScanLine className="w-4 h-4 animate-pulse text-red-500" />
                  QR-Code scannen...
                </div>

                {/* Manual fallback while scanning */}
                <div className="absolute bottom-16 left-4 right-4 z-10">
                  <input
                    type="text"
                    placeholder="oder manuell eingeben ↵"
                    className="w-full px-4 py-2.5 bg-black/70 backdrop-blur-sm rounded-lg border border-white/10 text-white text-sm placeholder-white/40 focus:border-red-500 focus:outline-none transition-colors"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        validateCode(e.currentTarget.value)
                        e.currentTarget.value = ''
                      }
                    }}
                  />
                </div>

                {/* Result Overlay */}
                <AnimatePresence>
                  {result && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`absolute inset-0 z-30 flex flex-col items-center justify-center p-6 ${
                        result.valid
                          ? 'bg-green-500/90 backdrop-blur-sm'
                          : 'bg-red-500/90 backdrop-blur-sm'
                      }`}
                    >
                      {result.valid ? (
                        <>
                          <CreditCard className="w-16 h-16 text-white mb-4" />
                          <h2 className="text-3xl font-bold text-white mb-2">{result.message}</h2>
                          {result.card && (
                            <div className="text-white/90 text-center mt-2 space-y-1">
                              <p className="font-semibold text-lg">{result.card.holder_name}</p>
                              <p className="font-mono text-sm opacity-80">{result.card.card_number}</p>
                              <p className="text-sm mt-2">Scan #{result.card.scan_count}</p>
                            </div>
                          )}
                          <p className="text-white/70 text-sm mt-6">Nächster Scan in Kürze...</p>
                        </>
                      ) : (
                        <>
                          <X className="w-16 h-16 text-white mb-4" />
                          <h2 className="text-2xl font-bold text-white mb-2">{result.message}</h2>
                          {result.payment_status === 'pending' && (
                            <p className="text-white/80 text-sm mt-1">Zahlung noch nicht eingegangen</p>
                          )}
                          {result.status === 'suspended' && (
                            <p className="text-white/80 text-sm mt-1">Karte ist gesperrt</p>
                          )}
                          <p className="text-white/70 text-sm mt-6">Nächster Scan in Kürze...</p>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 p-4 bg-red-500/20 text-red-400 rounded-lg text-center text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
