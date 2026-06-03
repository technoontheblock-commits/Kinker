import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { Resend } from 'resend'
import { 
  generateBonusCardToken, 
  generateCardNumber, 
  generateQRCodeDataUrl,
  generateCardViewUrl 
} from '@/lib/bonuscard'
import { generateBonusCardEmail } from '@/lib/email-bonuscard'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { holder_name, holder_email, holder_phone, payment_method } = body

    // Validation
    if (!holder_name || !holder_email || !payment_method) {
      return NextResponse.json(
        { error: 'Pflichtfelder fehlen: Name, E-Mail, Zahlungsmethode' },
        { status: 400 }
      )
    }

    if (!['twint', 'bank_transfer', 'sepa', 'cash'].includes(payment_method)) {
      return NextResponse.json(
        { error: 'Ungültige Zahlungsmethode' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const cookieStore = cookies()

    // Try to link to logged-in user
    let userId: string | null = null
    try {
      const userSession = cookieStore.get('user_session')?.value
      if (userSession) {
        const user = JSON.parse(userSession)
        userId = user.id || null
      }
    } catch {
      // Ignore parse errors
    }

    // Generate unique card number and token
    const cardNumber = await generateCardNumber(supabase)
    const qrToken = generateBonusCardToken()

    // Create bonus card
    const { data: bonusCard, error: insertError } = await supabase
      .from('bonus_cards')
      .insert([{
        user_id: userId,
        card_number: cardNumber,
        qr_token: qrToken,
        holder_name: holder_name.trim(),
        holder_email: holder_email.trim().toLowerCase(),
        purchase_price: 10000,
        payment_method,
        payment_status: 'pending',
        status: 'suspended'
      }])
      .select()
      .single()

    if (insertError || !bonusCard) {
      console.error('Bonus card creation error:', insertError)
      return NextResponse.json(
        { error: 'Karte konnte nicht erstellt werden' },
        { status: 500 }
      )
    }

    // Generate QR code for email
    let qrCodeDataUrl: string | undefined
    try {
      qrCodeDataUrl = await generateQRCodeDataUrl(qrToken)
    } catch (err) {
      console.error('QR generation error:', err)
    }

    // Send confirmation email
    if (resend) {
      try {
        const emailHtml = generateBonusCardEmail({
          holderName: holder_name.trim(),
          cardNumber,
          cardViewUrl: generateCardViewUrl(qrToken),
          paymentMethod: payment_method,
          paymentStatus: 'pending',
          qrCodeDataUrl
        })

        await resend.emails.send({
          from: `${process.env.RESEND_FROM_NAME || 'KINKER Basel'} <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
          to: holder_email.trim().toLowerCase(),
          subject: 'Deine KINKER Bonuscard',
          html: emailHtml
        })
      } catch (emailErr) {
        console.error('Bonus card email error:', emailErr)
        // Don't fail the purchase if email fails
      }
    }

    return NextResponse.json({
      success: true,
      card: {
        id: bonusCard.id,
        card_number: cardNumber,
        view_url: generateCardViewUrl(qrToken)
      }
    })
  } catch (error) {
    console.error('Bonus card purchase error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
