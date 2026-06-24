'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Loader2, Phone, Mail, User } from 'lucide-react'
import { formatChf, getFirstName } from '@/lib/bar'
import type { Customer } from './types'

interface CustomerSearchProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (customer: Customer) => void
  searchEndpoint: string
}

export function CustomerSearch({ isOpen, onClose, onSelect, searchEndpoint }: CustomerSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value)
      setResults([])
      setError(null)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)

      if (value.trim().length < 2) {
        setLoading(false)
        return
      }

      setLoading(true)
      timeoutRef.current = setTimeout(async () => {
        try {
          const response = await fetch(searchEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: value.trim() }),
          })
          const data = await response.json()
          if (!response.ok) {
            setError(data.error || 'Suche fehlgeschlagen')
            setResults([])
          } else {
            setResults(data.customers || [])
            setError(null)
          }
        } catch (err: any) {
          setError(err.message || 'Netzwerkfehler bei der Suche')
          setResults([])
        } finally {
          setLoading(false)
        }
      }, 250)
    },
    [searchEndpoint]
  )

  const handleClose = useCallback(() => {
    setQuery('')
    setResults([])
    setError(null)
    setLoading(false)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    onClose()
  }, [onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-neutral-900 rounded-2xl p-6 w-full max-w-md border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-bold">Kunde suchen</h2>
              <button
                onClick={handleClose}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                autoFocus
                placeholder="Name, E-Mail oder Telefon"
                value={query}
                onChange={e => handleChange(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            <div className="min-h-[120px]">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
                </div>
              )}

              {!loading && error && (
                <p className="text-center text-red-400 py-6 text-sm px-4">{error}</p>
              )}

              {!loading && !error && query.trim().length < 2 && (
                <p className="text-center text-white/40 py-8 text-sm">
                  Mindestens 2 Zeichen eingeben
                </p>
              )}

              {!loading && !error && query.trim().length >= 2 && results.length === 0 && (
                <p className="text-center text-white/40 py-8 text-sm">Keine Kunden gefunden</p>
              )}

              {!loading && results.length > 0 && (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {results.map(customer => (
                    <button
                      key={customer.id}
                      onClick={() => {
                        onSelect(customer)
                        handleClose()
                      }}
                      className="w-full text-left p-3 bg-black/40 hover:bg-white/10 border border-white/5 rounded-xl transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium flex items-center gap-2">
                          <User className="w-4 h-4 text-red-500" />
                          {customer.name}
                        </p>
                        <p className="font-display font-bold text-green-400">
                          {formatChf(customer.balance)}
                        </p>
                      </div>
                      <div className="text-sm text-white/50 mt-1 space-y-0.5">
                        {customer.email && (
                          <p className="flex items-center gap-2">
                            <Mail className="w-3 h-3" />
                            {customer.email}
                          </p>
                        )}
                        {customer.phone && (
                          <p className="flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            {customer.phone}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
