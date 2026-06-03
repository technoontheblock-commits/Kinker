import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractTokenFromQR } from '@/lib/bonuscard'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { qr_code } = body

    if (!qr_code || typeof qr_code !== 'string') {
      return NextResponse.json(
        { valid: false, message: 'QR-Code fehlt' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Extract token from QR code data
    const token = extractTokenFromQR(qr_code)
    if (!token) {
      return NextResponse.json(
        { valid: false, message: 'Ungültiger QR-Code' },
        { status: 400 }
      )
    }

    // Find bonus card by token
    const { data: card, error: cardError } = await supabase
      .from('bonus_cards')
      .select('*')
      .eq('qr_token', token)
      .single()

    if (cardError || !card) {
      return NextResponse.json(
        { valid: false, message: 'Karte nicht gefunden' },
        { status: 404 }
      )
    }

    // Determine scan result
    let scanResult: 'valid' | 'already_used' | 'invalid' | 'cancelled' | 'payment_pending' | 'suspended' = 'valid'
    let message = 'Bonuscard gültig'
    let valid = false

    if (card.status === 'suspended') {
      scanResult = 'suspended'
      message = 'Karte gesperrt'
    } else if (card.status === 'expired') {
      scanResult = 'invalid'
      message = 'Karte abgelaufen'
    } else if (card.payment_status === 'cancelled' || card.payment_status === 'refunded') {
      scanResult = 'cancelled'
      message = 'Karte storniert'
    } else if (card.payment_status === 'pending') {
      scanResult = 'payment_pending'
      message = 'Zahlung ausstehend'
    } else {
      // Card is valid
      valid = true
      scanResult = 'valid'
      message = 'BONUSCARD GÜLTIG'
    }

    // Log scan
    try {
      await supabase.from('bonus_card_scans').insert([{
        bonus_card_id: card.id,
        scan_result: scanResult,
        device_info: request.headers.get('user-agent') || null
      }])

      // Update scan count and last scanned if valid
      if (valid) {
        await supabase
          .from('bonus_cards')
          .update({
            scan_count: (card.scan_count || 0) + 1,
            last_scanned_at: new Date().toISOString()
          })
          .eq('id', card.id)
      }
    } catch (logError) {
      console.error('Scan log error:', logError)
    }

    return NextResponse.json({
      valid,
      message,
      card: valid ? {
        id: card.id,
        card_number: card.card_number,
        holder_name: card.holder_name,
        holder_email: card.holder_email,
        scan_count: (card.scan_count || 0) + (valid ? 1 : 0)
      } : undefined,
      payment_status: card.payment_status,
      status: card.status
    })
  } catch (error) {
    console.error('Bonus card validation error:', error)
    return NextResponse.json(
      { valid: false, message: 'Validierung fehlgeschlagen' },
      { status: 500 }
    )
  }
}
