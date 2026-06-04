import { NextRequest, NextResponse } from 'next/server'
import { getSumUp, handleSumUpError } from '@/lib/sumup'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Checkout ID is required' },
        { status: 400 }
      )
    }

    const sumup = getSumUp()
    const checkout = await sumup.checkouts.get(id)

    return NextResponse.json({
      id: checkout.id,
      status: checkout.status,
      amount: checkout.amount,
      currency: checkout.currency,
      checkout_reference: checkout.checkout_reference,
      description: checkout.description,
      transaction_code: checkout.transactions?.[0]?.transaction_code,
      transaction_id: checkout.transactions?.[0]?.id,
    })
  } catch (err) {
    return handleSumUpError(err)
  }
}
