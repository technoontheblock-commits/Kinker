import { NextRequest, NextResponse } from 'next/server'
import { requireTopUp } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase'
import { generateTopUpReference, normalizeNfcUid } from '@/lib/bar'

export const dynamic = 'force-dynamic'

const VALID_PAYMENT_METHODS = ['cash', 'card', 'terminal']

export async function POST(request: NextRequest) {
  try {
    const auth = await requireTopUp()
    if (!auth.authorized) {
      return auth.response
    }

    const body = await request.json()
    const { nfcUid, amount, paymentMethod, reference, eventId, barId } = body

    const normalizedUid = normalizeNfcUid(nfcUid)
    if (!normalizedUid) {
      return NextResponse.json({ error: 'NFC-UID fehlt' }, { status: 400 })
    }

    if (typeof amount !== 'number' || amount <= 0 || !Number.isFinite(amount)) {
      return NextResponse.json({ error: 'Betrag muss grösser als 0 sein' }, { status: 400 })
    }

    if (!paymentMethod || !VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json({ error: 'Ungültige Zahlungsart' }, { status: 400 })
    }

    const supabase = createServerSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const topUpReference = typeof reference === 'string' && reference.trim().length > 0
      ? reference.trim()
      : generateTopUpReference()

    const { data, error } = await (supabase as any).rpc('process_bracelet_topup', {
      p_nfc_uid: normalizedUid,
      p_staff_id: auth.user.id,
      p_amount: amount,
      p_payment_method: paymentMethod,
      p_reference: topUpReference,
      p_event_id: eventId || null,
      p_bar_id: barId || null,
    } as any)

    if (error) {
      console.error('Top-up RPC error:', error)
      const message = error.message || 'Aufladung fehlgeschlagen'
      if (message.includes('Bracelet is not active')) {
        return NextResponse.json({ error: 'Armband ist nicht aktiv' }, { status: 403 })
      }
      return NextResponse.json({ error: message }, { status: 500 })
    }

    return NextResponse.json({ result: data })
  } catch (error: any) {
    console.error('Top-up route error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
