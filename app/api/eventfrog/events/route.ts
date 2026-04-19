import { NextRequest, NextResponse } from 'next/server'

const EVENTFROG_API_URL = 'https://api.eventfrog.net/api/v1'
const API_KEY = process.env.EVENTFROG_API_KEY
const ORGANIZER_IDS = process.env.EVENTFROG_ORGANIZER_IDS?.split(',').map(id => id.trim()).filter(Boolean) || ['2807113']
const ORGANIZER_NAME_FILTER = process.env.EVENTFROG_ORGANIZER_NAME?.toLowerCase() || 'kinker'

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

function extractImageUrl(event: any): string | undefined {
  // Eventfrog returns image as an object { url, width, height }
  // or as a string in emblemToShow / imageToShow
  const img = event.image || event.emblemToShow || event.imageToShow
  if (typeof img === 'string') return img
  if (img && typeof img === 'object') return img.url
  return undefined
}

function transformEvent(event: any) {
  return {
    id: event.id?.toString(),
    title: event.title?.de || event.title?.en || 'Unnamed Event',
    description: event.descriptionAsHTML?.de || event.descriptionAsHTML?.en || event.shortDescription?.de || event.shortDescription?.en || '',
    date: event.begin?.split('T')[0],
    time: event.begin?.split('T')[1]?.slice(0, 5),
    location: event.locationText || event.location?.name || 'KINKER, Münchenstein',
    price: event.lowestTicketPrice || 0,
    currency: event.currency || 'CHF',
    image: extractImageUrl(event),
    url: event.presaleLink || event.url,
    soldOut: event.soldOut || false,
    organizerId: event.organizerId,
    organizerName: event.organizerName,
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'Eventfrog API key not configured' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const debug = searchParams.get('debug') === 'true'
    const errors: string[] = []
    const attempts: any[] = []

    // --- STRATEGY 1: Use orgId parameter (official Eventfrog API parameter name) ---
    let organizerFilteredEvents: any[] = []
    
    for (const orgId of ORGANIZER_IDS) {
      try {
        // Eventfrog API uses 'orgId' not 'organizerId'
        // Documentation: https://docs.api.eventfrog.net/
        const url = `${EVENTFROG_API_URL}/events.json?apiKey=${encodeURIComponent(API_KEY)}&orgId=${encodeURIComponent(orgId)}&perPage=100`
        const events = await fetchEvents(url)
        
        // Validate: do returned events actually have the correct organizerId?
        const validEvents = events.filter((e: any) => 
          ORGANIZER_IDS.includes(e.organizerId?.toString())
        )
        
        attempts.push({ 
          strategy: 'orgId', 
          orgId, 
          rawCount: events.length, 
          validCount: validEvents.length 
        })
        
        if (validEvents.length > 0) {
          organizerFilteredEvents.push(...validEvents)
        }
      } catch (err: any) {
        attempts.push({ strategy: 'orgId', orgId, error: err.message })
        errors.push(`orgId=${orgId}: ${err.message}`)
      }
    }

    // --- STRATEGY 2: Fetch all events without filter and match by organizerId ---
    let allEvents: any[] = []
    if (organizerFilteredEvents.length === 0) {
      try {
        // Load multiple pages to get as many events as possible
        const pagesToLoad = 5
        for (let page = 1; page <= pagesToLoad; page++) {
          const url = `${EVENTFROG_API_URL}/events.json?apiKey=${encodeURIComponent(API_KEY)}&perPage=100&page=${page}&from=2020-01-01`
          const events = await fetchEvents(url)
          attempts.push({ strategy: 'all-events', page, count: events.length })
          allEvents.push(...events)
          if (events.length < 100) break // Last page
        }
      } catch (err: any) {
        errors.push(`all-events: ${err.message}`)
      }
    }

    // --- FILTERING: Match events by organizerId or organizerName ---
    let matchedEvents: any[] = []

    if (organizerFilteredEvents.length > 0) {
      // Strategy 1 worked
      matchedEvents = organizerFilteredEvents
    } else if (allEvents.length > 0) {
      // Strategy 2: Filter by organizerId
      matchedEvents = allEvents.filter((e: any) => {
        const eventOrgId = e.organizerId?.toString()
        const eventOrgName = (e.organizerName || '').toLowerCase()
        const idMatch = ORGANIZER_IDS.includes(eventOrgId)
        const nameMatch = eventOrgName.includes(ORGANIZER_NAME_FILTER)
        return idMatch || nameMatch
      })
    }

    // Remove duplicates and sort
    const uniqueEvents = matchedEvents
      .filter((event, index, self) =>
        index === self.findIndex((e) => e.id === event.id)
      )
      .sort((a, b) => new Date(a.begin).getTime() - new Date(b.begin).getTime())

    const events = uniqueEvents.map(transformEvent)

    // For debug: collect all organizers seen
    const allOrganizers = new Map()
    allEvents.forEach((e: any) => {
      if (e.organizerId && !allOrganizers.has(e.organizerId)) {
        allOrganizers.set(e.organizerId, {
          id: e.organizerId,
          name: e.organizerName,
        })
      }
    })

    const response: any = {
      events,
      count: events.length,
      filter: {
        organizerIds: ORGANIZER_IDS,
        organizerNameFilter: ORGANIZER_NAME_FILTER,
        strategyUsed: organizerFilteredEvents.length > 0 ? 'organizerId-filter' : 'client-side-filter',
        totalScanned: allEvents.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    }

    if (debug) {
      response.debug = {
        attempts,
        allOrganizersFound: Array.from(allOrganizers.values()),
        sampleScannedEvents: allEvents.slice(0, 3).map(transformEvent),
      }
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Error fetching Eventfrog events:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
