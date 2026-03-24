'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Camera, Check, X, Ticket } from 'lucide-react'

export default function ScannerPage() {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (scanning) {
      startCamera()
    } else {
      stopCamera()
    }
  }, [scanning])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      scanLoop()
    } catch (err) {
      setError('Kamera konnte nicht gestartet werden')
      setScanning(false)
    }
  }

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream
    stream?.getTracks().forEach(track => track.stop())
  }

  const scanLoop = () => {
    if (!scanning) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    
    if (video && canvas && video.readyState === 4) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)
        
        // Simple QR detection simulation
        // In production, use a library like jsQR
      }
    }
    
    requestAnimationFrame(scanLoop)
  }

  const validateTicket = async (qrCode: string) => {
    try {
      const response = await fetch('/api/tickets/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_code: qrCode })
      })
      
      const data = await response.json()
      setResult(data)
      
      if (data.valid) {
        setScanning(false)
      }
    } catch (err) {
      setError('Validierung fehlgeschlagen')
    }
  }

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <h1 className="text-3xl font-bold text-white text-center mb-8">
            Ticket Scanner
          </h1>

          {!scanning && !result && (
            <button
              onClick={() => setScanning(true)}
              className="w-full py-6 bg-red-500 hover:bg-red-600 rounded-xl flex items-center justify-center gap-3 text-white font-semibold"
            >
              <Camera className="w-6 h-6" />
              Scanner starten
            </button>
          )}

          {scanning && (
            <div className="relative aspect-square bg-neutral-900 rounded-xl overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Scanner overlay */}
              <div className="absolute inset-0 border-2 border-red-500/50 rounded-xl">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-red-500 rounded-lg" />
              </div>
              
              <button
                onClick={() => setScanning(false)}
                className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Manual input fallback */}
              <div className="absolute bottom-4 left-4 right-4">
                <input
                  type="text"
                  placeholder="QR-Code manuell eingeben"
                  className="w-full px-4 py-3 bg-black/80 text-white rounded-lg"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      validateTicket(e.currentTarget.value)
                    }
                  }}
                />
              </div>
            </div>
          )}

          {result && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`p-8 rounded-xl text-center ${
                result.valid ? 'bg-green-500/20 border-2 border-green-500' : 'bg-red-500/20 border-2 border-red-500'
              }`}
            >
              {result.valid ? (
                <>
                  <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {result.message}
                  </h2>
                  <div className="text-white/70 mt-4">
                    <p className="font-semibold">{result.ticket?.event}</p>
                    <p>{result.ticket?.holder}</p>
                    <p className="text-sm mt-2">{result.ticket?.number}</p>
                  </div>
                </>
              ) : (
                <>
                  <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white">
                    {result.message}
                  </h2>
                  {result.used_at && (
                    <p className="text-white/60 mt-2">
                      Bereits verwendet am: {new Date(result.used_at).toLocaleString('de-CH')}
                    </p>
                  )}
                </>
              )}
              
              <button
                onClick={() => {
                  setResult(null)
                  setScanning(true)
                }}
                className="mt-6 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg"
              >
                Nächstes Ticket
              </button>
            </motion.div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-500/20 text-red-400 rounded-lg text-center">
              {error}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
