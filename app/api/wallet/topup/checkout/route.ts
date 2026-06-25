import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getSumUp, getMerchantCode, getAppUrl, handleSumUpError } from '@/lib/sumup'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if (!auth.authorized) {
      return auth.response
    }

    const body = await request.json()
    const amount = typeof body.amount === 'number' ? body.amount : parseFloat(body.amount)

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Bitte einen gültigen Betrag eingeben' }, { status: 400 })
    }

    // Round to 2 decimals
    const roundedAmount = Math.round(amount * 100) / 100

    const MAX_TOP_UP_AMOUNT = 500
    if (roundedAmount > MAX_TOP_UP_AMOUNT) {
      return NextResponse.json(
        { error: `Maximaler Aufladebetrag ist CHF ${MAX_TOP_UP_AMOUNT.toFixed(2)}` },
        { status: 400 }
      )
    }

    const checkoutReference = `WALLET-TOPUP-${auth.user.id}-${Date.now()}`

    const sumup = getSumUp()
    const merchantCode = getMerchantCode()
    const appUrl = getAppUrl()

    const checkout = await sumup.checkouts.create({
      checkout_reference: checkoutReference,
      amount: roundedAmount,
      currency: 'CHF',
      merchant_code: merchantCode,
      description: 'KINKER Wallet Aufladung',
      redirect_url: `${appUrl}/checkout/success`,
      hosted_checkout: {
        enabled: true,
      },
    })

    const response = NextResponse.json({
      id: checkout.id,
      status: checkout.status,
      hosted_checkout_url: checkout.hosted_checkout_url,
      checkout_reference: checkout.checkout_reference,
      amount: checkout.amount,
      currency: checkout.currency,
    })

    response.cookies.set('sumup_checkout_id', checkout.id ?? '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 30, // 30 minutes
      path: '/',
    })

    return response
  } catch (err) {
    return handleSumUpError(err)
  }
}
