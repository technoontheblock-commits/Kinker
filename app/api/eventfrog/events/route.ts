import { NextRequest, NextResponse } from 'next/server'

const EVENTFROG_API_URL = process.env.EVENTFROG_API_URL || 'https://api.eventfrog.net'
const API_KEY = process.env.EVENTFROG_API_KEY
const ORGANIZER_ID = process.env.EVENTFROG_ORGANIZER_ID

// GET /api/eventfrog/events - Fetch events from Eventfrog
export async function GET(request: NextRequest) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'Eventfrog API key not configured' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from') 
    const to = searchParams.get('to') || ''
    const perPage = searchParams.get('limit') || '100'
    const page = searchParams.get('page') || '1'

    // Build params
    const params = new URLSearchParams()
    params.append('perPage', perPage)
    params.append('page', page)
    if (from) params.append('from', from)
    if (to) params.append('to', to)
    
    // Use Organizer API endpoint (not Public API)
    // The Organizer API returns events for the authenticated organizer
    const apiUrl = `${EVENTFROG_API_URL}/organizer/v1/events?${params.toString()}`
    
    console.log('Fetching from Eventfrog Organizer API:', apiUrl)

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Eventfrog API error:', response.status, errorText)
      return NextResponse.json(
        { 
          error: 'Failed to fetch events from Eventfrog',
          status: response.status,
          details: errorText,
          url: apiUrl.replace(API_KEY, '***')
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Eventfrog response:', {
      totalDatasets: data.totalDatasets,
      datasetsLength: data.datasets?.length,
    })

    // Transform events
    const events = data.datasets?.map((event: any) => ({
      id: event.id?.toString(),
      title: event.title?.de || event.title?.en || 'Unnamed Event',
      description: event.descriptionAsHTML?.de || event.descriptionAsHTML?.en || '',
      shortDescription: event.shortDescription?.de || event.shortDescription?.en || '',
      date: event.begin?.split('T')[0],
      time: event.begin?.split('T')[1]?.slice(0, 5),
      endTime: event.end?.split('T')[1]?.slice(0, 5),
      location: event.locationText,
      price: event.lowestTicketPrice,
      currency: event.currency,
      image: event.emblemToShow,
      url: event.url,
      presaleUrl: event.presaleLink,
      soldOut: event.soldOut,
      cancelled: event.cancelled,
      organizer: {
        id: event.organizerId,
        name: event.organizerName,
      },
    })) || []

    return NextResponse.json({
      events,
      debug: {
        organizerId: ORGANIZER_ID,
        apiType: 'Organizer API',
        totalFromApi: data.totalDatasets,
        returnedCount: events.length,
      },
      pagination: {
        page: data.page,
        perPage: data.perPage,
        total: data.totalDatasets,
        hasNextPage: data.hasNextPage,
        hasPrevPage: data.hasPrevPage,
      },
    })

  } catch (error: any) {
    console.error('Error fetching Eventfrog events:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
