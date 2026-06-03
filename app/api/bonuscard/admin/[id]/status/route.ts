import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) {
      return auth.response
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const { id } = params
    const body = await request.json()
    const { status, payment_status } = body

    if (!id) {
      return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const updateData: any = { updated_at: new Date().toISOString() }

    if (status && ['active', 'suspended', 'expired'].includes(status)) {
      updateData.status = status
    }

    if (payment_status && ['pending', 'paid', 'cancelled', 'refunded'].includes(payment_status)) {
      updateData.payment_status = payment_status
      if (payment_status === 'paid') {
        updateData.paid_at = new Date().toISOString()
        updateData.status = 'active'
      }
      if (payment_status === 'cancelled' || payment_status === 'refunded') {
        updateData.status = 'suspended'
      }
    }

    const { data: card, error } = await supabase
      .from('bonus_cards')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error || !card) {
      console.error('Update bonus card status error:', error)
      return NextResponse.json(
        { error: 'Karte konnte nicht aktualisiert werden' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, card })
  } catch (error) {
    console.error('Update bonus card status error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
