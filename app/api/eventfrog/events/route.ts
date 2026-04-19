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
    image: event.emblemToShow || event.imageToShow,
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
    const allEvents: any[] = []
    const errors: string[] = []
    const attempts: any[] = []

    // Strategy 1: Try organizerId with various date ranges
    for (const orgId of ORGANIZER_IDS) {
      const variations = [
        { from: new Date().toISOString().split('T')[0], label: 'today' },
        { from: '2020-01-01', label: 'all-time' },
        { from: undefined, label: 'no-date-filter' },
      ]

      for (const variant of variations) {
        try {
          let url = `${EVENTFROG_API_URL}/events.json?apiKey=${encodeURIComponent(API_KEY)}&organizerId=${encodeURIComponent(orgId)}&perPage=100`
          if (variant.from) {
            url += `&from=${variant.from}`
          }

          const events = await fetchEvents(url)
          attempts.push({ orgId, variant: variant.label, count: events.length })

          if (events.length > 0) {
            allEvents.push(...events)
            break // Found events for this orgId, stop trying variants
          }
        } catch (err: any) {
          errors.push(`organizerId=${orgId} (${variant.label}): ${err.message}`)
          attempts.push({ orgId, variant: variant.label, error: err.message })
        }
      }
    }

    // Strategy 2: If no results, try without organizerId filter and filter by name
    let rawEvents: any[] = []
    if (allEvents.length === 0 || debug) {
      try {
        const url = `${EVENTFROG_API_URL}/events.json?apiKey=${encodeURIComponent(API_KEY)}&perPage=100&from=2025-01-01`
        rawEvents = await fetchEvents(url)
      } catch (err: any) {
        errors.push(`all-events: ${err.message}`)
      }
    }

    // Combine organizer-filtered + raw events for debug
    const combinedEvents = [...allEvents]
    if (debug) {
      combinedEvents.push(...rawEvents)
    }

    // If we got no events via organizerId but have raw events, filter by organizer name
    if (allEvents.length === 0 && rawEvents.length > 0) {
      const filteredByName = rawEvents.filter((e: any) => {
        const orgName = (e.organizerName || '').toLowerCase()
        return orgName.includes(ORGANIZER_NAME_FILTER)
      })
      combinedEvents.push(...filteredByName)
    }

    // Remove duplicates
    const uniqueEvents = combinedEvents
      .filter((event, index, self) =>
        index === self.findIndex((e) => e.id === event.id)
      )
      .sort((a, b) => new Date(a.begin).getTime() - new Date(b.begin).getTime())

    const events = uniqueEvents.map(transformEvent)

    // Extract unique organizers for debug
    const organizers = new Map()
    rawEvents.forEach((e: any) => {
      if (e.organizerId && !organizers.has(e.organizerId)) {
        organizers.set(e.organizerId, {
          id: e.organizerId,
          name: e.organizerName,
        })
      }
    })

    const response: any = {
      events,
      count: events.length,
      filter: {
        organizerIdsTried: ORGANIZER_IDS,
        organizerNameFilter: ORGANIZER_NAME_FILTER,
        totalRawEvents: rawEvents.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    }

    if (debug) {
      response.debug = {
        attempts,
        allOrganizersFound: Array.from(organizers.values()),
        sampleRawEvents: rawEvents.slice(0, 3).map(transformEvent),
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
