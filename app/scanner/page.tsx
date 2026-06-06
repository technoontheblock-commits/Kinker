'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera, Check, X, CreditCard, ScanLine, Volume2, VolumeX,
  Hash, AlertCircle, Clock, ListChecks, Maximize2, Minimize2, Keyboard
} from 'lucide-react'

type ScanHistoryItem = {
  id: string
  cardNumber: string
  holderName: string
  valid: boolean
  message: string
  timestamp: number
}

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
  const [starting, setStarting] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState('')
  const [scanCount, setScanCount] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)

  const videoContainerRef = useRef<HTMLDivElement>(null)
  const scannerRef = useRef<any>(null)
  const lastScanRef = useRef<string>('')
  const lastScanTimeRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const initStartedRef = useRef(false)
  const sessionScansRef = useRef<Set<string>>(new Set())

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
        setResult({ valid: false, message: 'Ungültiger QR-Code', type: 'bonuscard' })
        playBeep('error')
        timeoutRef.current = setTimeout(clearResult, 2000)
        return
      }
      if (sessionScansRef.current.has(qrCode)) {
        setResult({ valid: false, message: 'Bereits in dieser Session gescannt', card: undefined, type: 'bonuscard' })
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
        sessionScansRef.current.add(qrCode)
        setScanCount(prev => prev + 1)
        playBeep('success')
      } else {
        playBeep('error')
      }

      if (scanResult.card) {
        setScanHistory(prev => [
          { id: qrCode + '-' + Date.now(), cardNumber: scanResult.card!.card_number, holderName: scanResult.card!.holder_name, valid: scanResult.valid, message: scanResult.message, timestamp: Date.now() },
          ...prev
        ].slice(0, 50))
      } else if (!scanResult.valid) {
        setScanHistory(prev => [
          { id: qrCode + '-' + Date.now(), cardNumber: '—', holderName: '—', valid: false, message: scanResult.message, timestamp: Date.now() },
          ...prev
        ].slice(0, 50))
      }

      timeoutRef.current = setTimeout(clearResult, 2500)
    } catch {
      setResult({ valid: false, message: 'Validierung fehlgeschlagen', type: 'bonuscard' })
      playBeep('error')
      timeoutRef.current = setTimeout(clearResult, 2000)
    }
  }, [isProcessing, playBeep, clearResult])

  const requestCamera = useCallback(async () => {
    setError('')
    setResult(null)
    setStarting(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      stream.getTracks().forEach(track => track.stop())
      setScanning(true)
    } catch (err: any) {
      const msg = err?.name || err?.message || ''
      if (msg.includes('NotAllowed') || msg.includes('Permission')) {
        setError('Kamera-Zugriff verweigert. Bitte erlaube den Zugriff in den Browsereinstellungen.')
      } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
        setError('Keine Kamera gefunden.')
      } else if (msg.includes('NotReadable') || msg.includes('TrackStart')) {
        setError('Kamera wird bereits verwendet.')
      } else {
        setError(`Kamera-Fehler: ${msg}`)
      }
      setStarting(false)
    }
  }, [])

  useEffect(() => {
    if (!scanning || initStartedRef.current) return
    async function initScanner() {
      initStartedRef.current = true
      await new Promise(resolve => setTimeout(resolve, 150))
      if (!videoContainerRef.current) {
        setError('Scanner konnte nicht initialisiert werden.')
        setScanning(false)
        setStarting(false)
        initStartedRef.current = false
        return
      }
      try {
        const html5QrcodeModule = await import('html5-qrcode')
        const Html5Qrcode = html5QrcodeModule.default?.Html5Qrcode || html5QrcodeModule.Html5Qrcode
        const Html5QrcodeSupportedFormats = html5QrcodeModule.default?.Html5QrcodeSupportedFormats || html5QrcodeModule.Html5QrcodeSupportedFormats
        if (!Html5Qrcode) throw new Error('Scanner-Library konnte nicht geladen werden')
        scannerRef.current = new Html5Qrcode('scanner-video-container')
        await scannerRef.current.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 }, formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE], aspectRatio: 1.0 },
          (decodedText: string) => handleScan(decodedText),
          () => {}
        )
        setStarting(false)
      } catch (err: any) {
        console.error('Scanner init error:', err)
        setError(`Scanner-Fehler: ${err?.message || err?.toString?.() || ''}`)
        setScanning(false)
        setStarting(false)
        initStartedRef.current = false
      }
    }
    initScanner()
  }, [scanning, handleScan])

  const stopScanner = useCallback(async () => {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null }
    if (scannerRef.current) {
      try { if (scannerRef.current.isScanning) await scannerRef.current.stop(); await scannerRef.current.clear() } catch { } finally { scannerRef.current = null }
    }
    initStartedRef.current = false
    setScanning(false)
    setResult(null)
    setIsProcessing(false)
    setShowManualInput(false)
    setShowHistory(false)
  }, [])

  const validateCode = async (qrCode: string) => {
    if (!qrCode.trim()) return
    await handleScan(qrCode.trim())
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (scannerRef.current) {
        try { if (scannerRef.current.isScanning) scannerRef.current.stop().catch(() => {}); scannerRef.current.clear().catch(() => {}) } catch { }
      }
    }
  }, [])

  // Idle screen
  if (!scanning) {
    return (
      <div className="min-h-screen bg-black pt-20">
        <div className="container mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-white">Scanner</h1>
              {scanCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                  <Hash className="w-4 h-4" />{scanCount} gescannt
                </div>
              )}
            </div>
            <div className="space-y-4">
              <button onClick={requestCamera} disabled={starting}
                className="w-full py-6 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center justify-center gap-3 text-white font-semibold transition-colors">
                {starting ? <ScanLine className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                {starting ? 'Kamera wird gestartet...' : 'Scanner starten'}
              </button>
              <div className="bg-neutral-900 rounded-xl p-6 border border-white/10">
                <p className="text-white/60 text-sm mb-3">Manuelle Eingabe</p>
                <input type="text" placeholder="QR-Code manuell eingeben"
                  className="w-full px-4 py-3 bg-black rounded-lg border border-white/10 text-white placeholder-white/30 focus:border-red-500 focus:outline-none transition-colors"
                  onKeyDown={(e) => { if (e.key === 'Enter') { validateCode(e.currentTarget.value); e.currentTarget.value = '' } }} />
              </div>
            </div>
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mt-4 p-4 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-center text-sm flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />{error}
                </motion.div>
              )}
            </AnimatePresence>
            {scanHistory.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3"><ListChecks className="w-4 h-4 text-white/60" /><h3 className="text-white/60 text-sm font-medium">Scan-Verlauf</h3></div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {scanHistory.map((item) => (
                    <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border ${item.valid ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{item.cardNumber !== '—' ? item.cardNumber : item.message}</p>
                        {item.cardNumber !== '—' && <p className="text-white/50 text-xs">{item.holderName}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <div className="flex items-center gap-1 text-white/40 text-xs"><Clock className="w-3 h-3" />{new Date(item.timestamp).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                        {item.valid ? <Check className="w-4 h-4 text-green-400" /> : <X className="w-4 h-4 text-red-400" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    )
  }

  // Fullscreen scanner
  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Video fills entire screen */}
      <div id="scanner-video-container" ref={videoContainerRef} className="absolute inset-0 w-full h-full" />

      {/* Dark overlay with cutout */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 md:w-80 md:h-80">
          <div className="absolute inset-0 bg-transparent rounded-xl" />
          <div className="absolute -inset-[500px] bg-black/60" style={{ clipPath: 'inset(500px round 16px)' }} />
          {/* Corner brackets */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-red-500 rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-red-500 rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-red-500 rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-red-500 rounded-br-lg" />
        </div>
      </div>

      {/* Top Toolbar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setSoundEnabled(prev => !prev)}
            className="p-3 bg-black/50 backdrop-blur-sm rounded-full text-white/80 hover:text-white transition-colors">
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          {scanCount > 0 && (
            <div className="px-3 py-2 bg-black/50 backdrop-blur-sm rounded-full text-green-400 text-sm font-medium">
              {scanCount} gescannt
            </div>
          )}
        </div>
        <button onClick={stopScanner}
          className="p-3 bg-black/50 backdrop-blur-sm rounded-full text-white/80 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom Toolbar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 space-y-3">
        {/* Manual Input */}
        <AnimatePresence>
          {showManualInput && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="bg-neutral-900/90 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <input type="text" placeholder="QR-Code manuell eingeben ↵" autoFocus
                className="w-full px-4 py-3 bg-black rounded-lg border border-white/10 text-white placeholder-white/30 focus:border-red-500 focus:outline-none transition-colors"
                onKeyDown={(e) => { if (e.key === 'Enter') { validateCode(e.currentTarget.value); e.currentTarget.value = ''; setShowManualInput(false) } }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* History */}
        <AnimatePresence>
          {showHistory && scanHistory.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="bg-neutral-900/90 backdrop-blur-md rounded-xl p-3 border border-white/10 max-h-48 overflow-y-auto">
              <div className="space-y-2">
                {scanHistory.slice(0, 10).map((item) => (
                  <div key={item.id} className={`flex items-center justify-between p-2 rounded-lg ${item.valid ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    <div className="min-w-0">
                      <p className="text-white text-xs font-medium truncate">{item.cardNumber !== '—' ? item.cardNumber : item.message}</p>
                      {item.cardNumber !== '—' && <p className="text-white/50 text-[10px]">{item.holderName}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-white/40 text-[10px]">{new Date(item.timestamp).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}</span>
                      {item.valid ? <Check className="w-3 h-3 text-green-400" /> : <X className="w-3 h-3 text-red-400" />}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setShowManualInput(prev => !prev)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${showManualInput ? 'bg-red-500 text-white' : 'bg-black/50 backdrop-blur-sm text-white/80 hover:text-white'}`}>
            <Keyboard className="w-4 h-4" />Manuell
          </button>
          {scanHistory.length > 0 && (
            <button onClick={() => setShowHistory(prev => !prev)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${showHistory ? 'bg-red-500 text-white' : 'bg-black/50 backdrop-blur-sm text-white/80 hover:text-white'}`}>
              <ListChecks className="w-4 h-4" />Verlauf
            </button>
          )}
        </div>

        {/* Scanning Indicator */}
        {!result && !showManualInput && !showHistory && (
          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full text-white/60 text-sm mx-auto w-fit">
            <ScanLine className="w-4 h-4 animate-pulse text-red-500" />
            QR-Code scannen...
          </div>
        )}
      </div>

      {/* Result Overlay */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={`absolute inset-0 z-30 flex flex-col items-center justify-center p-6 ${result.valid ? 'bg-green-500/90' : 'bg-red-500/90'}`}>
            {result.valid ? (
              <>
                <CreditCard className="w-20 h-20 text-white mb-4" />
                <h2 className="text-4xl font-bold text-white mb-2 text-center">{result.message}</h2>
                {result.card && (
                  <div className="text-white/90 text-center mt-2 space-y-1">
                    <p className="font-semibold text-xl">{result.card.holder_name}</p>
                    <p className="font-mono text-sm opacity-80">{result.card.card_number}</p>
                    <p className="text-sm mt-2">Scan #{result.card.scan_count}</p>
                  </div>
                )}
                <p className="text-white/70 text-sm mt-8">Nächster Scan in Kürze...</p>
              </>
            ) : (
              <>
                <X className="w-20 h-20 text-white mb-4" />
                <h2 className="text-3xl font-bold text-white mb-2 text-center">{result.message}</h2>
                {result.payment_status === 'pending' && <p className="text-white/80 text-sm mt-1">Zahlung noch nicht eingegangen</p>}
                {result.status === 'suspended' && <p className="text-white/80 text-sm mt-1">Karte ist gesperrt</p>}
                <p className="text-white/70 text-sm mt-8">Nächster Scan in Kürze...</p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
