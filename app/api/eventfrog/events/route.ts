import { NextRequest, NextResponse } from 'next/server'

const EVENTFROG_API_URL = 'https://api.eventfrog.net'
const API_KEY = process.env.EVENTFROG_API_KEY
const ORGANIZER_IDS = process.env.EVENTFROG_ORGANIZER_IDS?.split(',') || ['1824536', '2096700', '2807113']

export async function GET(request: NextRequest) {
  try {
    console.log('EventFrog API Key exists:', !!API_KEY)
    console.log('EventFrog Organizer IDs:', ORGANIZER_IDS)

    if (!API_KEY) {
      return NextResponse.json(
        { error: 'Eventfrog API key not configured' },
        { status: 500 }
      )
    }

    const allEvents: any[] = []

    // Fetch events from all organizers
    for (const orgId of ORGANIZER_IDS) {
      try {
        const today = new Date().toISOString().split('T')[0]
        const apiUrl = `${EVENTFROG_API_URL}/organizer/v1/events?orgId=${orgId.trim()}&perPage=100&from=${today}`
        
        console.log('Fetching from:', apiUrl.replace(API_KEY, '***'))

        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
          next: { revalidate: 300 },
        })

        console.log('Response status for org', orgId, ':', response.status)

        if (response.ok) {
          const data = await response.json()
          console.log('Events found for org', orgId, ':', data.datasets?.length || 0)
          if (data.datasets) {
            allEvents.push(...data.datasets)
          }
        } else {
          const errorText = await response.text()
          console.error('Error for org', orgId, ':', errorText)
        }
      } catch (err) {
        console.error(`Error fetching events for org ${orgId}:`, err)
      }
    }

    console.log('Total events before dedup:', allEvents.length)

    // Remove duplicates and sort by date
    const uniqueEvents = allEvents
      .filter((event, index, self) => 
        index === self.findIndex((e) => e.id === event.id)
      )
      .sort((a, b) => new Date(a.begin).getTime() - new Date(b.begin).getTime())

    console.log('Total events after dedup:', uniqueEvents.length)

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
    console.error('Error fetching Eventfrog events:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
