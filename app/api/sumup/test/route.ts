import { NextResponse } from 'next/server'

const sumupApiKey = process.env.SUMUP_API_KEY
const sumupMerchantCode = process.env.SUMUP_MERCHANT_CODE

export async function GET() {
  try {
    if (!sumupApiKey) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'SUMUP_API_KEY not configured' 
      }, { status: 500 })
    }

    if (!sumupMerchantCode) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'SUMUP_MERCHANT_CODE not configured' 
      }, { status: 500 })
    }

    // Test SumUp API - Get merchant info
    const response = await fetch('https://api.sumup.com/v0.1/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sumupApiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ 
        status: 'error', 
        message: 'SumUp API error',
        httpStatus: response.status,
        error 
      }, { status: 500 })
    }

    const data = await response.json()
    
    console.log('SumUp /me response:', data)

    // Extract data from the nested merchant_profile structure
    const merchantProfile = data.merchant_profile || {}
    const merchantCode = merchantProfile.merchant_code || data.merchant_code
    const merchantName = merchantProfile.company_name || merchantProfile.doing_business_as?.business_name
    const email = merchantProfile.doing_business_as?.email || data.account?.username
    const accountStatus = data.details_submitted ? 'active' : 'pending'

    return NextResponse.json({
      status: 'success',
      message: 'SumUp API connection successful',
      merchant: {
        merchant_code: merchantCode,
        merchant_name: merchantName,
        email: email,
        status: accountStatus
      },
      configuredMerchantCode: sumupMerchantCode,
      match: merchantCode === sumupMerchantCode,
      is_active: data.details_submitted && merchantProfile.complete,
      raw_response: data
    })

  } catch (error: any) {
    return NextResponse.json({ 
      status: 'error', 
      message: error.message 
    }, { status: 500 })
  }
}

// Test checkout creation
export async function POST() {
  try {
    if (!sumupApiKey || !sumupMerchantCode) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'SumUp not configured' 
      }, { status: 500 })
    }

    // First, check if merchant is properly configured
    const merchantCheck = await fetch('https://api.sumup.com/v0.1/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sumupApiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!merchantCheck.ok) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Invalid API credentials',
        httpStatus: merchantCheck.status
      }, { status: 500 })
    }

    const merchantData = await merchantCheck.json()
    
    console.log('Merchant data:', merchantData)

    // According to SumUp SDK docs:
    // - amount must be in CENTS (100 = 1.00)
    // - pay_to_email is required
    // - We need to use the Card Widget on our own page, not an external URL
    
    const merchantProfile = merchantData.merchant_profile || {}
    const payToEmail = merchantProfile.doing_business_as?.email || merchantData.account?.username
    
    console.log('Using pay_to_email:', payToEmail)

    // Create checkout for Card Widget (amount as DECIMAL!)
    const testCheckout = await fetch('https://api.sumup.com/v0.1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sumupApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        checkout_reference: `TEST-${Date.now()}`,
        amount: 1.00,  // SumUp v0.1 expects decimal (e.g. 1.00), not cents!
        currency: 'CHF',
        description: 'Test Checkout - KINKER Basel',
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout/success`,
        merchant_code: sumupMerchantCode,
        pay_to_email: payToEmail
      })
    })

    if (!testCheckout.ok) {
      const error = await testCheckout.json()
      return NextResponse.json({ 
        status: 'error', 
        message: 'Failed to create test checkout',
        httpStatus: testCheckout.status,
        merchant: merchantData,
        error 
      }, { status: 500 })
    }

    const data = await testCheckout.json()
    
    console.log('SumUp checkout response:', data)

    const checkoutId = data.id
    
    // For SumUp Online Payments, we need to use the Card Widget
    // The checkout.id is used with the SumUp JS SDK on the frontend
    // See: https://developer.sumup.com/online-payments/sdks/js
    
    let checkoutData = data
    
    // Get checkout details
    const checkoutDetails = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkoutId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sumupApiKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (checkoutDetails.ok) {
      const details = await checkoutDetails.json()
      console.log('Checkout details:', details)
      checkoutData = { ...checkoutData, ...details }
    }

    console.log('Checkout created for Card Widget:', checkoutData)

    // For SumUp Online Payments, the flow is:
    // 1. Create checkout (done) -> get checkout.id
    // 2. On frontend, load SumUp Card Widget with checkout.id
    // 3. Customer enters card details in widget
    // 4. Payment is processed
    
    return NextResponse.json({
      status: 'success',
      message: 'Checkout created for Card Widget',
      checkout: {
        id: checkoutId,
        amount: checkoutData.amount,
        currency: checkoutData.currency,
        status: checkoutData.status,
        merchant: merchantData,
        raw_response: checkoutData,
        note: 'Use checkout.id with SumUp Card Widget JS SDK on frontend'
      }
    })

  } catch (error: any) {
    return NextResponse.json({ 
      status: 'error', 
      message: error.message 
    }, { status: 500 })
  }
}
