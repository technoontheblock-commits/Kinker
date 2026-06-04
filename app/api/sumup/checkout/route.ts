import { NextRequest, NextResponse } from 'next/server'
import { getSumUp, getMerchantCode, getAppUrl, handleSumUpError } from '@/lib/sumup'

interface CheckoutRequestBody {
  amount: number
  description?: string
  checkout_reference: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CheckoutRequestBody

    if (!body.amount || typeof body.amount !== 'number' || body.amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      )
    }

    if (!body.checkout_reference || typeof body.checkout_reference !== 'string') {
      return NextResponse.json(
        { error: 'checkout_reference is required' },
        { status: 400 }
      )
    }

    const sumup = getSumUp()
    const merchantCode = getMerchantCode()
    const appUrl = getAppUrl()

    const checkout = await sumup.checkouts.create({
      checkout_reference: body.checkout_reference,
      amount: body.amount,
      currency: 'CHF',
      merchant_code: merchantCode,
      description: body.description || 'KINKER Order',
      redirect_url: `${appUrl}/checkout/success`,
    })

    return NextResponse.json({
      id: checkout.id,
      status: checkout.status,
      checkout_reference: checkout.checkout_reference,
      amount: checkout.amount,
      currency: checkout.currency,
    })
  } catch (err) {
    return handleSumUpError(err)
  }
}
