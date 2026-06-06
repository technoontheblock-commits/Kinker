import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { Resend } from 'resend'
import { renderToBuffer } from '@react-pdf/renderer'
import {
  generateCardNumber,
  generateBonusCardToken,
  generateQRCodeDataUrl,
  generateQRCodeBuffer,
  generateCardViewUrl,
} from '@/lib/bonuscard'
import { generateBonusCardEmail } from '@/lib/email-bonuscard'
import { BonusCardPDF } from '@/lib/bonuscard-pdf'
import { wrapEmail } from '@/lib/email-layout'
import { createSignedSession, setSessionCookie, getCurrentUser } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { token, holder_name, holder_email, auth_mode, email, password, name, newsletter } = body

    if (!token || !holder_name || !holder_email) {
      return NextResponse.json({ error: 'Token, holder name and email are required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Validate token
    const { data: claim, error: claimError } = await supabase
      .from('membership_claims')
      .select('*')
      .eq('token', token)
      .single()

    if (claimError || !claim) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    }

    if (claim.claimed_at) {
      return NextResponse.json({ error: 'Token already redeemed' }, { status: 400 })
    }

    if (new Date(claim.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 400 })
    }

    let userId: string | null = null

    if (auth_mode === 'new') {
      if (!name || !email || !password) {
        return NextResponse.json({ error: 'Name, email and password required' }, { status: 400 })
      }

      if (password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
      }

      const hashedPassword = await bcrypt.hash(password, 12)

      // Check if email exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .single()

      if (existingUser) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
      }

      // Create user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password_hash: hashedPassword,
          role: 'user',
          status: 'active',
          email_verified: true,
        }])
        .select()
        .single()

      if (createError || !newUser) {
        console.error('User creation error:', createError)
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
      }

      userId = newUser.id
      console.log('Created new user:', newUser.id, newUser.email)

      // Create related records (best effort - don't fail the whole request)
      try {
        await supabase.from('user_profiles').insert([{
          user_id: newUser.id,
          newsletter_opt_in: newsletter === true,
        }])
      } catch (err) {
        console.error('user_profiles insert error:', err)
      }

      try {
        await supabase.from('user_wallets').insert([{
          user_id: newUser.id,
          balance: 0,
        }])
      } catch (err) {
        console.error('user_wallets insert error:', err)
      }

      try {
        await supabase.from('user_rewards').insert([{
          user_id: newUser.id,
          points: 0,
          lifetime_points: 0,
          tier: 'Bronze',
        }])
      } catch (err) {
        console.error('user_rewards insert error:', err)
      }

      if (newsletter === true) {
        try {
          await supabase.from('newsletter_subscribers').upsert([{
            email: email.trim().toLowerCase(),
            name: name.trim(),
            subscribed: true,
          }], { onConflict: 'email' })
        } catch (err) {
          console.error('newsletter_subscribers upsert error:', err)
        }
      }

      // Create session
      const sessionUser = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: 'user',
        type: 'user' as const,
      }
      setSessionCookie(sessionUser)
      console.log('Session cookie set for new user:', newUser.id)
    } else if (auth_mode === 'existing') {
      // Check if already logged in
      const currentUser = getCurrentUser()
      if (currentUser) {
        userId = currentUser.id
        console.log('Using existing logged-in user:', currentUser.id)
      } else {
        if (!email || !password) {
          return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
        }

        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, email, password_hash, status, email_verified, name')
          .eq('email', email.trim().toLowerCase())
          .single()

        if (userError || !user) {
          return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
        }

        if (user.status !== 'active') {
          return NextResponse.json({ error: 'Account inactive' }, { status: 403 })
        }

        const validPassword = await bcrypt.compare(password, user.password_hash)
        if (!validPassword) {
          return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
        }

        userId = user.id

        // Create session
        const sessionUser = {
          id: user.id,
          email: user.email,
          name: user.name || '',
          role: 'user',
          type: 'user' as const,
        }
        setSessionCookie(sessionUser)
        console.log('Session cookie set for existing user:', user.id)
      }
    } else {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 500 })
    }

    // Generate card number and token
    const cardNumber = await generateCardNumber(supabase)
    const qrToken = generateBonusCardToken()

    // Create bonus card (auto-confirmed / paid)
    const { data: bonusCard, error: cardError } = await supabase
      .from('bonus_cards')
      .insert([{
        user_id: userId,
        card_number: cardNumber,
        qr_token: qrToken,
        holder_name: holder_name.trim(),
        holder_email: holder_email.trim().toLowerCase(),
        purchase_price: 0,
        payment_method: 'cash',
        payment_status: 'paid',
        status: 'active',
        paid_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      }])
      .select()
      .single()

    if (cardError || !bonusCard) {
      console.error('Bonus card creation error:', cardError)
      return NextResponse.json({ error: 'Failed to create membership card' }, { status: 500 })
    }

    // Mark claim as redeemed
    const { error: updateError } = await supabase
      .from('membership_claims')
      .update({
        claimed_at: new Date().toISOString(),
        claimed_by_user_id: userId,
        bonus_card_id: bonusCard.id,
      })
      .eq('id', claim.id)

    if (updateError) {
      console.error('Claim update error:', updateError)
    }

    // Create admin notification
    try {
      await supabase.from('notifications').insert([{
        type: 'membership',
        title: 'Neue Membership (Claim)',
        message: `${holder_name.trim()} hat eine Membership (${cardNumber}) via QR-Claim erhalten.`,
        read: false,
      }])
    } catch (notifErr) {
      console.error('Notification creation error:', notifErr)
    }

    // Send admin emails
    if (resend) {
      try {
        const { data: admins, error: adminsError } = await supabase
          .from('users')
          .select('email')
          .eq('role', 'admin')

        if (!adminsError && admins && admins.length > 0) {
          const adminEmails = admins.map((a: any) => a.email).filter(Boolean)
          if (adminEmails.length > 0) {
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kinker.ch'
            const emailHtml = wrapEmail(
              `<tr>
                <td style="padding: 40px 32px; text-align: left;">
                  <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #111111; font-family: sans-serif;">
                    Neue Membership (QR-Claim)
                  </h2>
                  <p style="margin: 0 0 24px; font-size: 15px; color: #666666; line-height: 1.5; font-family: sans-serif;">
                    Eine Membership wurde via QR-Code Claim aktiviert.
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
                    <p style="margin: 0; font-size: 15px; color: #111111; font-family: sans-serif;">
                      <strong>Status:</strong> Aktiviert (bezahlt)
                    </p>
                  </div>
                  <p style="margin: 24px 0 0; font-size: 14px; color: #666666; font-family: sans-serif;">
                    <a href="${siteUrl}/admin/memberships" style="color: #dc2626; text-decoration: none; font-weight: 600;">
                      Zur Membership-Verwaltung →
                    </a>
                  </p>
                </td>
              </tr>`,
              'Neue Membership (QR-Claim)'
            )

            await resend.emails.send({
              from: `${process.env.RESEND_FROM_NAME || 'KINKER Basel'} <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
              to: adminEmails,
              subject: `Neue Membership via Claim: ${holder_name.trim()}`,
              html: emailHtml,
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
        generateQRCodeBuffer(qrToken),
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
          paymentMethod: 'cash',
          paymentStatus: 'paid',
          qrCodeDataUrl,
        })

        let pdfBuffer: Buffer | undefined
        try {
          if (qrCodeBuffer) {
            const pdfElement = BonusCardPDF({
              holderName: holder_name.trim(),
              cardNumber,
              purchaseDate: new Date().toLocaleDateString('de-CH'),
              qrCodeSrc: { data: qrCodeBuffer, format: 'png' },
              paymentMethod: 'cash',
              isPaid: true,
            })
            pdfBuffer = await renderToBuffer(pdfElement)
          }
        } catch (pdfErr) {
          console.error('PDF generation error:', pdfErr)
        }

        const attachments = pdfBuffer
          ? [{ filename: `KINKER-Membership-${cardNumber}.pdf`, content: pdfBuffer }]
          : undefined

        const { error: emailError } = await resend.emails.send({
          from: `${process.env.RESEND_FROM_NAME || 'KINKER Basel'} <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
          to: holder_email.trim().toLowerCase(),
          subject: 'Deine Kinker Membership ist aktiv',
          html: emailHtml,
          attachments,
        })

        if (emailError) {
          console.error('Resend email error:', emailError)
        }
      } catch (emailErr) {
        console.error('Bonus card email error:', emailErr)
      }
    } else {
      console.warn('Resend not configured, skipping email')
    }

    return NextResponse.json({
      success: true,
      card: {
        id: bonusCard.id,
        card_number: cardNumber,
        view_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://kinker.ch'}/membership/card/${qrToken}`,
      },
    })
  } catch (error) {
    console.error('Membership claim redeem error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
