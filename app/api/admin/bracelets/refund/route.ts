import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase'
import { normalizeNfcUid } from '@/lib/bar'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) {
      return auth.response
    }

    const body = await request.json()
    const { nfcUid, reference } = body

    const normalizedUid = normalizeNfcUid(nfcUid)
    if (!normalizedUid) {
      return NextResponse.json({ error: 'NFC-UID fehlt' }, { status: 400 })
    }

    const supabase = createServerSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const { data, error } = await (supabase as any).rpc('refund_bracelet_balance', {
      p_nfc_uid: normalizedUid,
      p_staff_id: auth.user.id,
      p_reference: reference || null,
    })

    if (error) {
      console.error('Refund bracelet error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ result: data })
  } catch (error: any) {
    console.error('Bracelet refund error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
