import { NextRequest, NextResponse } from 'next/server'
import { requireTopUp } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase'
import { normalizeNfcUid, formatNfcUidForDisplay } from '@/lib/bar'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireTopUp()
    if (!auth.authorized) {
      return auth.response
    }

    const body = await request.json()
    const { nfc_uid } = body

    const normalizedUid = normalizeNfcUid(nfc_uid)
    if (!normalizedUid) {
      return NextResponse.json({ error: 'NFC-UID fehlt' }, { status: 400 })
    }

    const supabase = createServerSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const { data: bracelet, error: braceletError } = await (supabase as any)
      .rpc('get_bracelet_by_nfc_uid', { p_nfc_uid: normalizedUid })

    if (braceletError) {
      console.error('Bracelet lookup error:', braceletError)
      return NextResponse.json({ error: braceletError.message }, { status: 500 })
    }

    if (!bracelet || bracelet.length === 0) {
      return NextResponse.json({ error: 'Armband nicht gefunden' }, { status: 404 })
    }

    const b = bracelet[0]

    if (b.status !== 'active') {
      return NextResponse.json(
        { error: `Armband ist ${b.status === 'disabled' ? 'gesperrt' : b.status === 'lost' ? 'als verloren gemeldet' : 'nicht aktiv'}` },
        { status: 403 }
      )
    }

    return NextResponse.json({
      bracelet: {
        id: b.id,
        nfcUid: b.nfc_uid,
        displayUid: formatNfcUidForDisplay(b.nfc_uid),
        balance: Number(b.balance),
        currency: b.currency,
        status: b.status,
        eventId: b.event_id,
      }
    })
  } catch (error: any) {
    console.error('Top-up scan error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
