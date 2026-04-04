import { NextResponse } from 'next/server'

export async function GET() {
  const sumupApiKey = process.env.SUMUP_API_KEY
  const sumupMerchantCode = process.env.SUMUP_MERCHANT_CODE

  return NextResponse.json({
    hasApiKey: !!sumupApiKey,
    hasMerchantCode: !!sumupMerchantCode,
    apiKeyPrefix: sumupApiKey ? `${sumupApiKey.slice(0, 10)}...` : null,
    merchantCode: sumupMerchantCode || null
  })
}
