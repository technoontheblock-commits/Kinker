import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) {
      return auth.response
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const cardId = searchParams.get('card_id')

    if (!cardId) {
      return NextResponse.json(
        { error: 'card_id ist erforderlich' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: scans, error } = await supabase
      .from('bonus_card_scans')
      .select('*')
      .eq('bonus_card_id', cardId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch scan history error:', error)
      return NextResponse.json(
        { error: 'Scan-History konnte nicht geladen werden' },
        { status: 500 }
      )
    }

    return NextResponse.json({ scans: scans || [] })
  } catch (error) {
    console.error('Scan history fetch error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
