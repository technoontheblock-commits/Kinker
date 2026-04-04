import { NextResponse } from 'next/server'

const sumupApiKey = process.env.SUMUP_API_KEY

// GET /api/sumup/merchant - Get merchant info
export async function GET() {
  try {
    if (!sumupApiKey) {
      return NextResponse.json({ error: 'SUMUP_API_KEY not configured' }, { status: 500 })
    }

    // Call SumUp API to get merchant info
    const response = await fetch('https://api.sumup.com/v0.1/me', {
      headers: {
        'Authorization': `Bearer ${sumupApiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('SumUp API error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch merchant info',
        details: error 
      }, { status: response.status })
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      merchant: {
        merchant_code: data.merchant_code,
        merchant_name: data.merchant_name,
        email: data.email
      }
    })
  } catch (error: any) {
    console.error('Error fetching merchant:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}
