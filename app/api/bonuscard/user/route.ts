import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function GET(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const cookieStore = cookies()
    const userSession = cookieStore.get('user_session')?.value

    if (!userSession) {
      return NextResponse.json(
        { error: 'Nicht eingeloggt' },
        { status: 401 }
      )
    }

    let userId: string
    try {
      const user = JSON.parse(userSession)
      userId = user.id
      if (!userId) throw new Error('No user id')
    } catch {
      return NextResponse.json(
        { error: 'Ungültige Session' },
        { status: 401 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: cards, error } = await supabase
      .from('bonus_cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch bonus cards error:', error)
      return NextResponse.json(
        { error: 'Karten konnten nicht geladen werden' },
        { status: 500 }
      )
    }

    return NextResponse.json({ cards: cards || [] })
  } catch (error) {
    console.error('Bonus card user fetch error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
