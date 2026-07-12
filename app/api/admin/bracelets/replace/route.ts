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
    const { oldNfcUid, newNfcUid, reference } = body

    const normalizedOld = normalizeNfcUid(oldNfcUid)
    const normalizedNew = normalizeNfcUid(newNfcUid)

    if (!normalizedOld || !normalizedNew) {
      return NextResponse.json({ error: 'Beide NFC-UIDs sind erforderlich' }, { status: 400 })
    }

    const supabase = createServerSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const { data, error } = await (supabase as any).rpc('replace_bracelet', {
      p_old_nfc_uid: normalizedOld,
      p_new_nfc_uid: normalizedNew,
      p_staff_id: auth.user.id,
      p_reference: reference || null,
    })

    if (error) {
      console.error('Replace bracelet error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ result: data })
  } catch (error: any) {
    console.error('Bracelet replace error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
