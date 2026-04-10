import { NextRequest, NextResponse } from 'next/server'

const EVENTFROG_API_URL = 'https://api.eventfrog.net'
const API_KEY = process.env.EVENTFROG_API_KEY
const ORGANIZER_IDS = process.env.EVENTFROG_ORGANIZER_IDS?.split(',') || ['1824536', '2096700', '2807113']

export async function GET(request: NextRequest) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'Eventfrog API key not configured' },
        { status: 500 }
      )
    }

    const allEvents: any[] = []

    // Use Bearer Auth as shown in EventFrog documentation
    for (const orgId of ORGANIZER_IDS) {
      try {
        // Try the organizer endpoint with Bearer token
        const apiUrl = `${EVENTFROG_API_URL}/organizer/v1/events?perPage=100`
        
        console.log('Fetching with Bearer Auth:', apiUrl)

        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          next: { revalidate: 300 },
        })

        console.log('Response status:', response.status)

        if (response.ok) {
          const data = await response.json()
          console.log('Events found:', data.datasets?.length || 0)
          
          if (data.datasets) {
            allEvents.push(...data.datasets)
          }
        } else {
          const errorText = await response.text()
          console.error('API Error:', response.status, errorText.substring(0, 500))
        }
      } catch (err) {
        console.error(`Error fetching events:`, err)
      }
    }

    // Remove duplicates and sort by date
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
        totalRawEvents: allEvents.length,
      }
    })

  } catch (error: any) {
    console.error('Error fetching Eventfrog events:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
