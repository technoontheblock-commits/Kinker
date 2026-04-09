import { NextRequest, NextResponse } from 'next/server'

const EVENTFROG_API_URL = process.env.EVENTFROG_API_URL || 'https://api.eventfrog.net'
const API_KEY = process.env.EVENTFROG_API_KEY

// GET /api/eventfrog/organizers - Find your organizer ID
export async function GET(request: NextRequest) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'Eventfrog API key not configured' },
        { status: 500 }
      )
    }

    // Try to get organizers from the API
    // Note: This endpoint might require Organizer API permissions
    const response = await fetch(
      `${EVENTFROG_API_URL}/public/v1/organizers`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      // If public endpoint doesn't work, try alternative approach
      // Fetch events and extract unique organizers
      const eventsResponse = await fetch(
        `${EVENTFROG_API_URL}/public/v1/events?perPage=100&country=CH`,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!eventsResponse.ok) {
        return NextResponse.json(
          { error: 'Could not fetch organizers' },
          { status: 500 }
        )
      }

      const eventsData = await eventsResponse.json()
      
      // Extract unique organizers from events
      const organizers = new Map()
      eventsData.datasets?.forEach((event: any) => {
        if (event.organizerId && !organizers.has(event.organizerId)) {
          organizers.set(event.organizerId, {
            id: event.organizerId,
            name: event.organizerName,
          })
        }
      })

      return NextResponse.json({
        organizers: Array.from(organizers.values()),
        note: 'These are organizers found in recent events. Look for "Kinker" or your venue name.'
      })
    }

    const data = await response.json()
    
    return NextResponse.json({
      organizers: data.datasets || [],
      note: 'Select the organizer ID for Kinker Basel'
    })

  } catch (error: any) {
    console.error('Error fetching organizers:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
