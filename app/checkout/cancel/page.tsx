import Link from 'next/link'
import { XCircle, ArrowLeft } from 'lucide-react'

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <XCircle className="w-16 h-16 text-white/40 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">
          Zahlung abgebrochen
        </h1>
        <p className="text-white/60 mb-6">
          Die Zahlung wurde abgebrochen oder ist fehlgeschlagen. Dein
          Warenkorb ist noch verfügbar.
        </p>
        <Link
          href="/merch"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zum Warenkorb
        </Link>
      </div>
    </div>
  )
}
