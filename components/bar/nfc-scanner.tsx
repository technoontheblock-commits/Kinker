'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Wifi, Nfc, SkipForward } from 'lucide-react'

interface NfcScannerProps {
  onScan: (nfcUid: string) => void
  disabled?: boolean
  onSkip?: () => void
}

export function NfcScanner({ onScan, disabled, onSkip }: NfcScannerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [rawInput, setRawInput] = useState('')

  const focusInput = useCallback(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus()
    }
  }, [disabled])

  useEffect(() => {
    focusInput()
    const interval = setInterval(focusInput, 500)
    window.addEventListener('click', focusInput)
    window.addEventListener('touchstart', focusInput)

    return () => {
      clearInterval(interval)
      window.removeEventListener('click', focusInput)
      window.removeEventListener('touchstart', focusInput)
    }
  }, [focusInput])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRawInput(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const value = rawInput.trim()
      if (value.length > 0) {
        onScan(value)
        setRawInput('')
      }
    }
  }

  return (
    <div className="h-full flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="w-24 h-24 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center">
          <Nfc className="w-12 h-12 text-red-400" />
        </div>

        <h2 className="text-3xl font-display font-bold mb-2">Armband scannen</h2>
        <p className="text-white/50 mb-8">
          NFC-Armband an den Reader halten oder UID manuell eingeben.
        </p>

        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={rawInput}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            autoFocus
            autoComplete="off"
            spellCheck={false}
            className="w-full px-5 py-5 bg-neutral-900/60 border border-white/10 rounded-2xl text-center text-xl font-mono tracking-wider focus:outline-none focus:border-red-500/50 text-white placeholder:text-white/20"
            placeholder="NFC-UID..."
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Wifi className="w-5 h-5 text-white/20 animate-pulse" />
          </div>
        </div>

        <p className="mt-4 text-xs text-white/30">
          Reader im Tastatur-Modus: UID wird automatisch übernommen.
        </p>

        {onSkip && (
          <button
            onClick={onSkip}
            type="button"
            className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white/70 transition-colors"
          >
            <SkipForward className="w-4 h-4" />
            NFC-Scan überspringen
          </button>
        )}
      </div>
    </div>
  )
}
