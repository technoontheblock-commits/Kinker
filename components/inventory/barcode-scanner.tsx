'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Camera, X, ScanLine, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  isScanning: boolean
  setIsScanning: (scanning: boolean) => void
}

export function BarcodeScanner({ onScan, isScanning, setIsScanning }: BarcodeScannerProps) {
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const scannerRef = useRef<any>(null)
  const [error, setError] = useState<string>('')
  const [starting, setStarting] = useState(false)
  const initStartedRef = useRef(false)
  const lastScanRef = useRef<string>('')
  const lastScanTimeRef = useRef<number>(0)

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) await scannerRef.current.stop()
        await scannerRef.current.clear()
      } catch {
        // ignore
      } finally {
        scannerRef.current = null
      }
    }
    initStartedRef.current = false
    setIsScanning(false)
    setStarting(false)
    setError('')
  }, [setIsScanning])

  const handleDecoded = useCallback(async (decodedText: string) => {
    const now = Date.now()
    const trimmed = decodedText.trim()
    if (!trimmed) return
    if (lastScanRef.current === trimmed && now - lastScanTimeRef.current < 1500) return
    lastScanRef.current = trimmed
    lastScanTimeRef.current = now
    await stopScanner()
    onScan(trimmed)
  }, [onScan, stopScanner])

  useEffect(() => {
    if (!isScanning || initStartedRef.current) return

    async function initScanner() {
      initStartedRef.current = true
      setStarting(true)
      setError('')
      await new Promise(resolve => setTimeout(resolve, 150))

      if (!videoContainerRef.current) {
        setError('Scanner konnte nicht initialisiert werden.')
        setStarting(false)
        initStartedRef.current = false
        return
      }

      try {
        const html5QrcodeModule = await import('html5-qrcode')
        const Html5Qrcode = html5QrcodeModule.default?.Html5Qrcode || html5QrcodeModule.Html5Qrcode
        const Html5QrcodeSupportedFormats =
          html5QrcodeModule.default?.Html5QrcodeSupportedFormats || html5QrcodeModule.Html5QrcodeSupportedFormats

        if (!Html5Qrcode) {
          throw new Error('Scanner-Library konnte nicht geladen werden')
        }

        scannerRef.current = new Html5Qrcode('inventory-scanner-video-container')
        await scannerRef.current.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 300, height: 150 },
            aspectRatio: 1.777,
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
            ],
          },
          (decodedText: string) => handleDecoded(decodedText),
          () => {}
        )
        setStarting(false)
      } catch (err: any) {
        console.error('Scanner init error:', err)
        const msg = err?.message || err?.toString?.() || ''
        if (msg.includes('NotAllowed') || msg.includes('Permission')) {
          setError('Kamera-Zugriff verweigert. Bitte erlaube den Zugriff in den Browsereinstellungen.')
        } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
          setError('Keine Kamera gefunden.')
        } else if (msg.includes('NotReadable') || msg.includes('TrackStart')) {
          setError('Kamera wird bereits verwendet.')
        } else {
          setError(`Scanner-Fehler: ${msg}`)
        }
        setStarting(false)
        setIsScanning(false)
        initStartedRef.current = false
      }
    }

    initScanner()
  }, [isScanning, setIsScanning, handleDecoded])

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) scannerRef.current.stop().catch(() => {})
          scannerRef.current.clear().catch(() => {})
        } catch {
          // ignore
        }
      }
    }
  }, [])

  if (!isScanning) {
    return (
      <div className="space-y-3">
        <button
          onClick={() => setIsScanning(true)}
          disabled={starting}
          className="w-full py-6 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center justify-center gap-3 text-white font-semibold transition-colors"
        >
          {starting ? <ScanLine className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
          {starting ? 'Kamera wird gestartet...' : 'Scanner starten'}
        </button>
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div id="inventory-scanner-video-container" ref={videoContainerRef} className="absolute inset-0 w-full h-full" />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg px-4">
          <div className="relative aspect-[3/2] max-h-[40vh]">
            <div className="absolute inset-0 bg-transparent rounded-xl border-2 border-red-500/50" />
            <div className="absolute -left-2 top-0 w-8 h-8 border-t-4 border-l-4 border-red-500 rounded-tl-lg" />
            <div className="absolute -right-2 top-0 w-8 h-8 border-t-4 border-r-4 border-red-500 rounded-tr-lg" />
            <div className="absolute -left-2 bottom-0 w-8 h-8 border-b-4 border-l-4 border-red-500 rounded-bl-lg" />
            <div className="absolute -right-2 bottom-0 w-8 h-8 border-b-4 border-r-4 border-red-500 rounded-br-lg" />
          </div>
        </div>
      </div>

      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <p className="text-white/80 font-medium text-sm">Barcode in den Rahmen halten</p>
        <button
          onClick={stopScanner}
          className="p-2 bg-black/50 rounded-full text-white hover:bg-white/20 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {starting && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <ScanLine className="w-10 h-10 text-red-500 animate-spin mx-auto mb-3" />
            <p className="text-white/80">Kamera wird gestartet...</p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-8 left-4 right-4 z-10 p-4 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
