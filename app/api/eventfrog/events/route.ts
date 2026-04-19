import { NextRequest, NextResponse } from 'next/server'

const EVENTFROG_API_URL = 'https://api.eventfrog.net/api/v1'
const API_KEY = process.env.EVENTFROG_API_KEY
const ORGANIZER_IDS = process.env.EVENTFROG_ORGANIZER_IDS?.split(',').map(id => id.trim()).filter(Boolean) || []

export const dynamic = 'force-dynamic'

async function fetchEvents(url: string): Promise<any[]> {
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`${response.status}: ${text.substring(0, 300)}`)
  }

  const data = await response.json()
  return data.events || []
}

export async function GET(request: NextRequest) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'Eventfrog API key not configured' },
        { status: 500 }
      )
    }

    const allEvents: any[] = []
    const errors: string[] = []

    // Strategy 1: Try with each organizerId
    if (ORGANIZER_IDS.length > 0) {
      for (const orgId of ORGANIZER_IDS) {
        try {
          const url = `${EVENTFROG_API_URL}/events.json?apiKey=${encodeURIComponent(API_KEY)}&organizerId=${encodeURIComponent(orgId)}&perPage=100&from=${new Date().toISOString().split('T')[0]}`
          const events = await fetchEvents(url)
          allEvents.push(...events)
        } catch (err: any) {
          errors.push(`organizerId=${orgId}: ${err.message}`)
        }
      }
    }

    // Strategy 2: If no events found with organizerIds, try without filter
    if (allEvents.length === 0) {
      try {
        const url = `${EVENTFROG_API_URL}/events.json?apiKey=${encodeURIComponent(API_KEY)}&perPage=100&from=${new Date().toISOString().split('T')[0]}`
        const events = await fetchEvents(url)
        allEvents.push(...events)
      } catch (err: any) {
        errors.push(`no-filter: ${err.message}`)
      }
    }

    // Strategy 3: If still no events, try with search term "kinker"
    if (allEvents.length === 0) {
      try {
        const url = `${EVENTFROG_API_URL}/events.json?apiKey=${encodeURIComponent(API_KEY)}&perPage=100&search=kinker`
        const events = await fetchEvents(url)
        allEvents.push(...events)
      } catch (err: any) {
        errors.push(`search=kinker: ${err.message}`)
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
      description: event.descriptionAsHTML?.de || event.descriptionAsHTML?.en || event.shortDescription?.de || event.shortDescription?.en || '',
      date: event.begin?.split('T')[0],
      time: event.begin?.split('T')[1]?.slice(0, 5),
      location: event.locationText || event.location?.name || 'KINKER, Münchenstein',
      price: event.lowestTicketPrice || 0,
      currency: event.currency || 'CHF',
      image: event.emblemToShow || event.imageToShow,
      url: event.presaleLink || event.url,
      soldOut: event.soldOut || false,
      organizerId: event.organizerId,
      organizerName: event.organizerName,
    }))

    return NextResponse.json({
      events,
      count: events.length,
      strategies: {
        organizerIdsTried: ORGANIZER_IDS.length,
        fallbackUsed: allEvents.length > 0 && errors.length > 0,
      },
      errors: errors.length > 0 ? errors : undefined,
    })

  } catch (error: any) {
    console.error('Error fetching Eventfrog events:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
