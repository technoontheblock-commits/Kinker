import { cookies } from 'next/headers'
import Link from 'next/link'
import { CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { getSumUp } from '@/lib/sumup'

export default async function CheckoutSuccessPage() {
  const cookieStore = cookies()
  const checkoutId = cookieStore.get('sumup_checkout_id')?.value

  if (!checkoutId) {
    return (
      <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            Ungültige Anfrage
          </h1>
          <p className="text-white/60 mb-6">
            Keine Checkout-ID gefunden.
          </p>
          <Link
            href="/merch"
            className="inline-flex items-center gap-2 text-red-500 hover:text-red-400"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zum Shop
          </Link>
        </div>
      </div>
    )
  }

  try {
    const sumup = getSumUp()
    const checkout = await sumup.checkouts.get(checkoutId)

    if (checkout.status === 'PAID') {
      return (
        <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">
              Zahlung erfolgreich!
            </h1>
            <p className="text-white/60 mb-2">
              Vielen Dank für deine Bestellung bei KINKER.
            </p>
            <div className="bg-white/5 rounded-lg p-4 mb-6 text-left">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/60">Referenz:</span>
                <span className="text-white font-mono">
                  {checkout.checkout_reference}
                </span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/60">Betrag:</span>
                <span className="text-white">
                  {checkout.amount?.toFixed(2)} {checkout.currency}
                </span>
              </div>
              {checkout.transactions?.[0]?.transaction_code && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Transaktion:</span>
                  <span className="text-white font-mono">
                    {checkout.transactions[0].transaction_code}
                  </span>
                </div>
              )}
            </div>
            <Link
              href="/merch"
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Weiter einkaufen
            </Link>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            Zahlungsstatus unklar
          </h1>
          <p className="text-white/60 mb-6">
            Status: {checkout.status}. Bitte kontaktiere uns, falls du
            Hilfe benötigst.
          </p>
          <Link
            href="/merch"
            className="inline-flex items-center gap-2 text-red-500 hover:text-red-400"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zum Shop
          </Link>
        </div>
      </div>
    )
  } catch {
    return (
      <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            Verifizierung fehlgeschlagen
          </h1>
          <p className="text-white/60 mb-6">
            Die Zahlung konnte nicht verifiziert werden. Falls du eine
            Bestätigungsmail erhalten hast, ist alles in Ordnung.
          </p>
          <Link
            href="/merch"
            className="inline-flex items-center gap-2 text-red-500 hover:text-red-400"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zum Shop
          </Link>
        </div>
      </div>
    )
  }
}
