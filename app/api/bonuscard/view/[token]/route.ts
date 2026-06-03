import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const { token } = params
    if (!token) {
      return NextResponse.json({ error: 'Token fehlt' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: card, error } = await supabase
      .from('bonus_cards')
      .select('*')
      .eq('qr_token', token)
      .single()

    if (error || !card) {
      return NextResponse.json(
        { error: 'Karte nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({ card })
  } catch (error) {
    console.error('Bonus card view error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
