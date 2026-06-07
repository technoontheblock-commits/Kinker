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

    // Award referral points when payment is confirmed
    if (payment_status === 'paid' && card.referral_code_used) {
      try {
        // Check if points were already awarded for this card
        const { data: existingPoints } = await supabase
          .from('referral_points')
          .select('id')
          .eq('source_bonus_card_id', card.id)
          .single()

        if (!existingPoints) {
          // Get the referrer user_id from the referral code
          const { data: refCode } = await supabase
            .from('referral_codes')
            .select('user_id')
            .eq('id', card.referral_code_used)
            .single()

          if (refCode) {
            const referrerUserId = refCode.user_id

            // 1. Insert into referral_points
            await supabase
              .from('referral_points')
              .insert([{
                user_id: referrerUserId,
                points: 100,
                source_bonus_card_id: card.id
              }])

            // 2. Update or create user_rewards
            const { data: existingRewards } = await supabase
              .from('user_rewards')
              .select('id, points, lifetime_points')
              .eq('user_id', referrerUserId)
              .single()

            if (existingRewards) {
              await supabase
                .from('user_rewards')
                .update({
                  points: (existingRewards.points || 0) + 100,
                  lifetime_points: (existingRewards.lifetime_points || 0) + 100,
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingRewards.id)
            } else {
              await supabase
                .from('user_rewards')
                .insert({
                  user_id: referrerUserId,
                  points: 100,
                  lifetime_points: 200,
                  tier: 'Bronze'
                })
            }

            // 3. Insert into points_history
            await supabase
              .from('points_history')
              .insert({
                user_id: referrerUserId,
                points_change: 200,
                reason: 'Referral-Belohnung',
                reference_type: 'referral'
              })
          }
        }
      } catch (pointsError) {
        console.error('Referral points award error:', pointsError)
        // Don't fail the status update if points award fails
      }
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
