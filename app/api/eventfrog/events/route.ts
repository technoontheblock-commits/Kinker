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

    // Fetch events from all organizers
    for (const orgId of ORGANIZER_IDS) {
      try {
        const apiUrl = `${EVENTFROG_API_URL}/organizer/v1/events?orgId=${orgId}&perPage=100&from=${new Date().toISOString().split('T')[0]}`
        
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
          next: { revalidate: 300 }, // Cache for 5 minutes
        })

        if (response.ok) {
          const data = await response.json()
          if (data.datasets) {
            allEvents.push(...data.datasets)
          }
        }
      } catch (err) {
        console.error(`Error fetching events for org ${orgId}:`, err)
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
    })

  } catch (error: any) {
    console.error('Error fetching Eventfrog events:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
