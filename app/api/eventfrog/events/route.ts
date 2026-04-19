import { NextRequest, NextResponse } from 'next/server'

const EVENTFROG_API_URL = 'https://api.eventfrog.net'
const API_KEY = process.env.EVENTFROG_API_KEY
const ORGANIZER_IDS = process.env.EVENTFROG_ORGANIZER_IDS?.split(',').map(id => id.trim()).filter(Boolean) || ['1824536', '2096700', '2807113']

export const dynamic = 'force-dynamic'

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

    // Try each organizer ID
    for (const orgId of ORGANIZER_IDS) {
      try {
        // Public API endpoint with organizer filter
        const apiUrl = `${EVENTFROG_API_URL}/event/v1/events?perPage=100&organizerId=${encodeURIComponent(orgId)}`
        
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          next: { revalidate: 300 },
        })

        if (response.ok) {
          const data = await response.json()
          
          if (data.datasets && Array.isArray(data.datasets)) {
            allEvents.push(...data.datasets)
          }
        } else {
          const errorText = await response.text()
          errors.push(`Public API orgId=${orgId}: ${response.status} ${errorText.substring(0, 200)}`)
          
          // Fallback: try organizer API endpoint
          const orgApiUrl = `${EVENTFROG_API_URL}/organizer/v1/events?perPage=100&organizerId=${encodeURIComponent(orgId)}`
          
          const orgResponse = await fetch(orgApiUrl, {
            headers: {
              'Authorization': `Bearer ${API_KEY}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            next: { revalidate: 300 },
          })
          
          if (orgResponse.ok) {
            const orgData = await orgResponse.json()
            if (orgData.datasets && Array.isArray(orgData.datasets)) {
              allEvents.push(...orgData.datasets)
            }
          } else {
            const orgErrorText = await orgResponse.text()
            errors.push(`Organizer API orgId=${orgId}: ${orgResponse.status} ${orgErrorText.substring(0, 200)}`)
          }
        }
      } catch (err: any) {
        errors.push(`Fetch error orgId=${orgId}: ${err.message}`)
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
