import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
const EVENTFROG_API_URL = process.env.EVENTFROG_API_URL || 'https://api.eventfrog.net'
const API_KEY = process.env.EVENTFROG_API_KEY
const ORGANIZER_ID = process.env.EVENTFROG_ORGANIZER_ID



function isAdmin(user: any) {
  return user?.role === 'admin'
}

// GET /api/eventfrog/sales - Fetch sales data (Organizer API required)
export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    if (!API_KEY) {
      return NextResponse.json(
        { error: 'Eventfrog API key not configured' },
        { status: 500 }
      )
    }

    if (!ORGANIZER_ID) {
      return NextResponse.json(
        { error: 'Eventfrog Organizer ID not configured' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    const from = searchParams.get('from') || ''
    const to = searchParams.get('to') || ''

    // Build query params
    const params = new URLSearchParams()
    params.append('organizerId', ORGANIZER_ID)
    if (eventId) params.append('eventId', eventId)
    if (from) params.append('from', from)
    if (to) params.append('to', to)

    // Fetch sales data from Eventfrog Organizer API
    const response = await fetch(
      `${EVENTFROG_API_URL}/organizer/v1/sales?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Eventfrog Organizer API error:', errorText)
      return NextResponse.json(
        { error: 'Failed to fetch sales data. Make sure you have Organizer API access.' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      sales: data.datasets || [],
      summary: {
        totalRevenue: data.totalRevenue,
        totalTickets: data.totalTickets,
        totalOrders: data.totalOrders,
      },
    })

  } catch (error: any) {
    console.error('Error fetching Eventfrog sales:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
