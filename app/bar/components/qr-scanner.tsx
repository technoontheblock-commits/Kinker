'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Camera, ScanLine, RefreshCw, AlertCircle } from 'lucide-react'
import jsQR from 'jsqr'
import { cn } from '@/lib/utils'
import { BAR_WALLET_QR_PREFIX } from '@/lib/bar'

interface QrScannerProps {
  onScan: (qrCode: string) => void
}

export function QrScanner({ onScan }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const requestRef = useRef<number | null>(null)
  const frameCountRef = useRef(0)
  const lastScanRef = useRef<{ code: string; time: number } | null>(null)
  const processingRef = useRef(false)

  const [status, setStatus] = useState<'idle' | 'starting' | 'scanning' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [torchOn, setTorchOn] = useState(false)

  const stopCamera = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current)
      requestRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }, [])

  const tryEnableTorch = useCallback(async (stream: MediaStream) => {
    try {
      const track = stream.getVideoTracks()[0]
      if (!track) return
      const capabilities = track.getCapabilities() as any
      if (capabilities?.torch) {
        await track.applyConstraints({ advanced: [{ torch: true }] } as any)
        setTorchOn(true)
      }
    } catch {
      // Torch not supported or failed
    }
  }, [])

  const tryOptimizeExposure = useCallback(async (stream: MediaStream) => {
    try {
      const track = stream.getVideoTracks()[0]
      if (!track) return
      await track.applyConstraints({ advanced: [{ exposureMode: 'continuous', focusMode: 'continuous' }] } as any)
    } catch {
      // Ignore unsupported constraints
    }
  }, [])

  const startCamera = useCallback(async () => {
    setStatus('starting')
    setErrorMsg('')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      await tryOptimizeExposure(stream)
      await tryEnableTorch(stream)

      setStatus('scanning')
    } catch (err: any) {
      console.error('Camera error:', err)
      const name = err?.name || ''
      if (name.includes('NotAllowed') || name.includes('Permission')) {
        setErrorMsg('Kamera-Zugriff verweigert. Bitte erlaube den Zugriff in den Browsereinstellungen.')
      } else if (name.includes('NotFound') || name.includes('DevicesNotFound')) {
        setErrorMsg('Keine Kamera gefunden.')
      } else if (name.includes('NotReadable') || name.includes('TrackStart')) {
        setErrorMsg('Kamera wird bereits von einer anderen App verwendet.')
      } else {
        setErrorMsg(`Kamera-Fehler: ${err?.message || name}`)
      }
      setStatus('error')
    }
  }, [tryEnableTorch, tryOptimizeExposure])

  const scanFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || status !== 'scanning') {
      requestRef.current = requestAnimationFrame(scanFrame)
      return
    }

    frameCountRef.current += 1
    if (
      video.readyState !== video.HAVE_ENOUGH_DATA ||
      processingRef.current ||
      frameCountRef.current % 3 !== 0
    ) {
      requestRef.current = requestAnimationFrame(scanFrame)
      return
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) {
      requestRef.current = requestAnimationFrame(scanFrame)
      return
    }

    // Scale down for performance while keeping enough detail for QR decoding
    const maxDim = 1280
    const scale = Math.min(1, maxDim / Math.max(video.videoWidth, video.videoHeight))
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    })

    if (code?.data) {
      const qrCode = code.data.trim()
      const now = Date.now()

      if (qrCode.startsWith(BAR_WALLET_QR_PREFIX)) {
        const last = lastScanRef.current
        if (last?.code === qrCode && now - last.time < 2500) {
          requestRef.current = requestAnimationFrame(scanFrame)
          return
        }

        lastScanRef.current = { code: qrCode, time: now }
        processingRef.current = true
        onScan(qrCode)
        // Resume after a short cooldown so the same code is not scanned again
        setTimeout(() => {
          processingRef.current = false
        }, 800)
      }
    }

    requestRef.current = requestAnimationFrame(scanFrame)
  }, [status, onScan])

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [startCamera, stopCamera])

  useEffect(() => {
    if (status === 'scanning') {
      requestRef.current = requestAnimationFrame(scanFrame)
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [status, scanFrame])

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <div className="max-w-md w-full bg-neutral-900/80 border border-white/10 rounded-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold mb-2">Kamera konnte nicht gestartet werden</h2>
          <p className="text-white/60 mb-6">{errorMsg}</p>
          <button
            onClick={startCamera}
            className="flex items-center justify-center gap-2 w-full py-4 bg-red-500 hover:bg-red-600 rounded-xl font-semibold transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Erneut versuchen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {/* Video feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={cn(
          'absolute inset-0 w-full h-full object-cover',
          'brightness-[1.15] contrast-[1.1]'
        )}
      />

      {/* Hidden canvas for decoding */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Dark overlay with cutout */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-black/70" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 md:w-96 md:h-96">
          <div
            className="absolute -inset-[500px] bg-black/70"
            style={{ clipPath: 'inset(500px round 24px)' }}
          />
          {/* Corner brackets */}
          <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-red-500 rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-red-500 rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-red-500 rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-red-500 rounded-br-2xl" />
          {/* Scanning laser */}
          {status === 'scanning' && (
            <motion.div
              initial={{ top: '0%' }}
              animate={{ top: '100%' }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]"
            />
          )}
        </div>
      </div>

      {/* Top hint */}
      <div className="absolute top-20 left-0 right-0 z-10 text-center px-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full text-white/80 text-sm">
          <ScanLine className="w-4 h-4 text-red-500" />
          Wallet-QR-Code scannen
        </div>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-24 left-0 right-0 z-10 text-center px-6">
        <p className="text-white/50 text-sm">
          Halte den Kunden-QR-Code im roten Rahmen
        </p>
        {torchOn && (
          <p className="text-white/40 text-xs mt-1">Licht aktiviert</p>
        )}
      </div>

      {/* Loading state */}
      {status === 'starting' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80">
          <Camera className="w-12 h-12 text-red-500 animate-pulse mb-4" />
          <p className="text-white/80 font-medium">Kamera wird gestartet...</p>
        </div>
      )}
    </div>
  )
}
