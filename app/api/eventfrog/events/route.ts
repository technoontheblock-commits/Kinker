import { NextRequest, NextResponse } from 'next/server'

const EVENTFROG_API_URL = 'https://api.eventfrog.net'
const API_KEY = process.env.EVENTFROG_API_KEY
const ORGANIZER_IDS = process.env.EVENTFROG_ORGANIZER_IDS?.split(',') || ['1824536', '2096700', '2807113']

export async function GET(request: NextRequest) {
  try {
    console.log('API Key exists:', !!API_KEY)
    console.log('Organizer IDs:', ORGANIZER_IDS)

    if (!API_KEY) {
      return NextResponse.json(
        { error: 'Eventfrog API key not configured' },
        { status: 500 }
      )
    }

    const allEvents: any[] = []

    // Try different API endpoints
    for (const orgId of ORGANIZER_IDS) {
      const endpoints = [
        // Try organizer endpoint with X-API-Key header
        {
          url: `${EVENTFROG_API_URL}/organizer/v1/events?perPage=100`,
          headers: { 'X-API-Key': API_KEY }
        },
        // Try with Authorization Bearer
        {
          url: `${EVENTFROG_API_URL}/organizer/v1/events?perPage=100`,
          headers: { 'Authorization': `Bearer ${API_KEY}` }
        },
        // Try public endpoint
        {
          url: `${EVENTFROG_API_URL}/public/v1/events?organizerId=${orgId.trim()}&perPage=100`,
          headers: { 'X-API-Key': API_KEY }
        },
      ]

      for (const endpoint of endpoints) {
        try {
          console.log('Trying:', endpoint.url)
          
          const response = await fetch(endpoint.url, {
            headers: {
              ...endpoint.headers,
              'Content-Type': 'application/json',
            },
            next: { revalidate: 300 },
          })

          console.log('Status:', response.status)

          if (response.ok) {
            const data = await response.json()
            console.log('Success! Events found:', data.datasets?.length || 0)
            
            if (data.datasets && data.datasets.length > 0) {
              allEvents.push(...data.datasets)
              break // Stop trying other endpoints for this org
            }
          } else {
            const errorText = await response.text()
            console.log('Error:', errorText.substring(0, 200))
          }
        } catch (err) {
          console.error('Fetch error:', err)
        }
      }
    }

    console.log('Total events found:', allEvents.length)

    // Remove duplicates and sort
    const uniqueEvents = allEvents
      .filter((event, index, self) => 
        index === self.findIndex((e) => e.id === event.id)
      )
      .sort((a, b) => new Date(a.begin).getTime() - new Date(b.begin).getTime())

    // Transform events
    const events = uniqueEvents.map((event: any) => ({
      id: event.id?.toString(),
      title: event.title?.de || event.title?.en || 'Unnamed Event',
      description: event.descriptionAsHTML?.de || event.descriptionAsHTML?.en || '',
      date: event.begin?.split('T')[0],
      time: event.begin?.split('T')[1]?.slice(0, 5),
      location: event.locationText || 'KINKER, Münchenstein',
      price: event.lowestTicketPrice || 0,
      currency: event.currency || 'CHF',
      image: event.emblemToShow || event.imageToShow,
      url: event.presaleLink || event.url,
      soldOut: event.soldOut || false,
    }))

    return NextResponse.json({
      events,
      count: events.length,
      debug: {
        organizerIds: ORGANIZER_IDS,
        apiKeyExists: !!API_KEY,
      }
    })

  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
