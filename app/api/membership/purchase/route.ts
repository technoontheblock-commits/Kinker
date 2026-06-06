import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { Resend } from 'resend'
import { renderToBuffer } from '@react-pdf/renderer'
import { 
  generateBonusCardToken, 
  generateCardNumber, 
  generateQRCodeDataUrl,
  generateQRCodeBuffer,
  generateCardViewUrl 
} from '@/lib/bonuscard'
import { generateBonusCardEmail } from '@/lib/email-bonuscard'
import { BonusCardPDF } from '@/lib/bonuscard-pdf'
import { verifySignedSession } from '@/lib/auth'
import { wrapEmail } from '@/lib/email-layout'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { holder_name, holder_email, holder_phone, payment_method, referral_code } = body

    // Validation
    if (!holder_name || !holder_email || !payment_method) {
      return NextResponse.json(
        { error: 'Pflichtfelder fehlen: Name, E-Mail, Zahlungsmethode' },
        { status: 400 }
      )
    }

    if (!['card', 'cash', 'twint'].includes(payment_method)) {
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
        const user = verifySignedSession(userSession)
        userId = user?.id || null
      }
    } catch {
      // Ignore parse errors
    }

    // Validate referral code if provided
    let referralCodeId: string | null = null
    let purchasePrice = 10000 // 100 CHF in Rappen

    if (referral_code) {
      const { data: refCode } = await supabase
        .from('referral_codes')
        .select('id, user_id')
        .eq('code', referral_code.trim().toUpperCase())
        .single()

      if (refCode) {
        // Prevent self-referral
        if (refCode.user_id !== userId) {
          referralCodeId = refCode.id
          purchasePrice = 9000 // 90 CHF in Rappen (10% Rabatt)
        }
      }
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
        purchase_price: purchasePrice,
        payment_method,
        payment_status: 'pending',
        status: 'suspended',
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        referral_code_used: referralCodeId
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

    // Create admin notification for new membership purchase
    try {
      await supabase.from('notifications').insert([{
        type: 'membership',
        title: 'Neue Membership-Bestellung',
        message: `${holder_name.trim()} hat eine Membership (${cardNumber}) per ${payment_method.toUpperCase()} bestellt.`,
        read: false
      }])
    } catch (notifErr) {
      console.error('Notification creation error:', notifErr)
    }

    // Send email notification to all admins
    if (resend) {
      try {
        const { data: admins, error: adminsError } = await supabase
          .from('users')
          .select('email')
          .eq('role', 'admin')

        if (!adminsError && admins && admins.length > 0) {
          const adminEmails = admins.map((a: any) => a.email).filter(Boolean)
          if (adminEmails.length > 0) {
            const priceChf = (purchasePrice / 100).toFixed(2)
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kinker.ch'
            const emailHtml = wrapEmail(
              `<tr>
                <td style="padding: 40px 32px; text-align: left;">
                  <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #111111; font-family: sans-serif;">
                    Neue Membership-Bestellung
                  </h2>
                  <p style="margin: 0 0 24px; font-size: 15px; color: #666666; line-height: 1.5; font-family: sans-serif;">
                    Es wurde eine neue Membership im KINKER Shop bestellt.
                  </p>
                  <div style="background-color: #fafafa; border: 1px solid #e5e5e5; border-radius: 12px; padding: 24px;">
                    <p style="margin: 0 0 8px; font-size: 15px; color: #111111; font-family: sans-serif;">
                      <strong>Name:</strong> ${holder_name.trim()}
                    </p>
                    <p style="margin: 0 0 8px; font-size: 15px; color: #111111; font-family: sans-serif;">
                      <strong>E-Mail:</strong> ${holder_email.trim().toLowerCase()}
                    </p>
                    <p style="margin: 0 0 8px; font-size: 15px; color: #111111; font-family: sans-serif;">
                      <strong>Kartennummer:</strong> ${cardNumber}
                    </p>
                    <p style="margin: 0 0 8px; font-size: 15px; color: #111111; font-family: sans-serif;">
                      <strong>Zahlungsmethode:</strong> ${payment_method.toUpperCase()}
                    </p>
                    <p style="margin: 0; font-size: 15px; color: #111111; font-family: sans-serif;">
                      <strong>Preis:</strong> ${priceChf} CHF
                    </p>
                  </div>
                  <p style="margin: 24px 0 0; font-size: 14px; color: #666666; font-family: sans-serif;">
                    <a href="${siteUrl}/admin/memberships" style="color: #dc2626; text-decoration: none; font-weight: 600;">
                      Zur Membership-Verwaltung →
                    </a>
                  </p>
                </td>
              </tr>`,
              'Neue Membership-Bestellung'
            )

            await resend.emails.send({
              from: `${process.env.RESEND_FROM_NAME || 'KINKER Basel'} <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
              to: adminEmails,
              subject: `Neue Membership-Bestellung von ${holder_name.trim()}`,
              html: emailHtml
            })
          }
        }
      } catch (adminEmailErr) {
        console.error('Admin email notification error:', adminEmailErr)
      }
    }

    // Generate QR code for PDF and email
    let qrCodeDataUrl: string | undefined
    let qrCodeBuffer: Buffer | undefined
    try {
      [qrCodeDataUrl, qrCodeBuffer] = await Promise.all([
        generateQRCodeDataUrl(qrToken),
        generateQRCodeBuffer(qrToken)
      ])
    } catch (err) {
      console.error('QR generation error:', err)
    }

    // Send confirmation email with PDF attachment
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

        // Generate PDF
        let pdfBuffer: Buffer | undefined
        try {
          if (qrCodeBuffer) {
            const pdfElement = BonusCardPDF({
              holderName: holder_name.trim(),
              cardNumber,
              purchaseDate: new Date().toLocaleDateString('de-CH'),
              qrCodeSrc: { data: qrCodeBuffer, format: 'png' },
              paymentMethod: payment_method,
              isPaid: false,
            })
            pdfBuffer = await renderToBuffer(pdfElement)
          }
        } catch (pdfErr) {
          console.error('PDF generation error:', pdfErr)
        }

        const attachments = pdfBuffer
          ? [{ filename: `KINKER-Membership-${cardNumber}.pdf`, content: pdfBuffer }]
          : undefined

        const { data: emailData, error: emailError } = await resend.emails.send({
          from: `${process.env.RESEND_FROM_NAME || 'KINKER Basel'} <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
          to: holder_email.trim().toLowerCase(),
          subject: 'Deine Kinker Membership',
          html: emailHtml,
          attachments
        })

        if (emailError) {
          console.error('Resend email error:', emailError)
        } else {
          console.log('Email sent successfully:', emailData)
        }
      } catch (emailErr) {
        console.error('Bonus card email error:', emailErr)
        // Don't fail the purchase if email fails
      }
    } else {
      console.warn('Resend not configured, skipping email')
    }

    const priceChf = purchasePrice / 100
    const paymentPurpose = cardNumber
    const twintUrl = `https://go.twint.ch/1/e/tw?tw=acq.1QpEtdXaTp67RTtZAon-LmYwb6Dc4bSzry9O70XYAuuhdI6rCR5vezGx9qyHMQfc&amount=${priceChf.toFixed(2)}&trxInfo=${encodeURIComponent(paymentPurpose)}`

    return NextResponse.json({
      success: true,
      card: {
        id: bonusCard.id,
        card_number: cardNumber,
        view_url: generateCardViewUrl(qrToken)
      },
      price: priceChf,
      payment_purpose: paymentPurpose,
      payment_url: twintUrl,
      product_name: 'Membership'
    })
  } catch (error) {
    console.error('Bonus card purchase error:', error)
    return NextResponse.json(
      { error: 'Ein unerwarteter Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
