import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// POST /api/unsubscribe - Unsubscribe from newsletter
export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Datenbank nicht konfiguriert' }, { status: 500 })
    }

    const body = await request.json()
    const { email } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Gültige E-Mail-Adresse erforderlich' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { error } = await supabase
      .from('newsletter_subscribers')
      .delete()
      .eq('email', email.toLowerCase())

    if (error) {
      console.error('Unsubscribe error:', error)
      return NextResponse.json({ error: 'Abmeldung fehlgeschlagen' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Du wurdest erfolgreich abgemeldet.' })
  } catch (error: any) {
    console.error('Unsubscribe exception:', error)
    return NextResponse.json({ error: error.message || 'Interner Serverfehler' }, { status: 500 })
  }
}

// GET /api/unsubscribe?email=xxx - Also allow GET for one-click unsubscribe
export async function GET(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Datenbank nicht konfiguriert' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Gültige E-Mail-Adresse erforderlich' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { error } = await supabase
      .from('newsletter_subscribers')
      .delete()
      .eq('email', email.toLowerCase())

    if (error) {
      console.error('Unsubscribe error:', error)
      return NextResponse.json({ error: 'Abmeldung fehlgeschlagen' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Du wurdest erfolgreich abgemeldet.' })
  } catch (error: any) {
    console.error('Unsubscribe exception:', error)
    return NextResponse.json({ error: error.message || 'Interner Serverfehler' }, { status: 500 })
  }
}
