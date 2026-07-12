import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase'
import { normalizeNfcUid } from '@/lib/bar'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) {
      return auth.response
    }

    const supabase = createServerSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const { data, error } = await (supabase as any)
      .from('bar_bracelets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) {
      console.error('Bracelets fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ bracelets: data || [] })
  } catch (error: any) {
    console.error('Bracelets GET error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) {
      return auth.response
    }

    const body = await request.json()
    const { nfcUids, eventId } = body

    if (!Array.isArray(nfcUids) || nfcUids.length === 0) {
      return NextResponse.json({ error: 'Mindestens eine NFC-UID erforderlich' }, { status: 400 })
    }

    const normalizedUids = nfcUids
      .map((uid: string) => normalizeNfcUid(uid))
      .filter((uid): uid is string => Boolean(uid))

    if (normalizedUids.length === 0) {
      return NextResponse.json({ error: 'Keine gültigen NFC-UIDs' }, { status: 400 })
    }

    const supabase = createServerSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const inserts = normalizedUids.map((uid: string) => ({
      nfc_uid: uid,
      event_id: eventId || null,
      status: 'active',
      balance: 0,
      currency: 'CHF',
    }))

    const { data, error } = await (supabase as any)
      .from('bar_bracelets')
      .insert(inserts)
      .select('id, nfc_uid, status, balance')

    if (error) {
      console.error('Bracelets insert error:', error)
      if (error.message?.includes('duplicate')) {
        return NextResponse.json({ error: 'Eine oder mehrere NFC-UIDs existieren bereits' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ bracelets: data || [] })
  } catch (error: any) {
    console.error('Bracelets POST error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
