import { NextRequest, NextResponse } from 'next/server'

const EVENTFROG_API_URL = 'https://api.eventfrog.net/api/v1'
const API_KEY = process.env.EVENTFROG_API_KEY

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'Eventfrog API key not configured' },
        { status: 500 }
      )
    }

    const { id } = params

    // Fetch single event from Eventfrog
    const url = `${EVENTFROG_API_URL}/events.json?apiKey=${encodeURIComponent(API_KEY)}&id=${encodeURIComponent(id)}`

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    })

    if (!response.ok) {
      const text = await response.text()
      return NextResponse.json(
        { error: `Eventfrog API error: ${response.status}`, details: text.substring(0, 500) },
        { status: response.status }
      )
    }

    const data = await response.json()
    const events = data.events || []

    if (events.length === 0) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    const event = events[0]

    // Extract image URL (Eventfrog returns image as object { url, width, height })
    const img = event.image || event.emblemToShow || event.imageToShow
    const imageUrl = typeof img === 'string' ? img : img?.url

    // Transform to consistent format
    const transformed = {
      id: event.id?.toString(),
      title: event.title?.de || event.title?.en || 'Unnamed Event',
      description: event.descriptionAsHTML?.de || event.descriptionAsHTML?.en || event.shortDescription?.de || event.shortDescription?.en || '',
      date: event.begin?.split('T')[0],
      time: event.begin?.split('T')[1]?.slice(0, 5),
      endDate: event.end?.split('T')[0],
      endTime: event.end?.split('T')[1]?.slice(0, 5),
      location: event.locationText || event.location?.name || 'KINKER, Münchenstein',
      price: event.lowestTicketPrice || 0,
      currency: event.currency || 'CHF',
      image: imageUrl,
      url: event.presaleLink || event.url,
      soldOut: event.soldOut || false,
      organizerId: event.organizerId,
      organizerName: event.organizerName,
      cancelled: event.cancelled,
    }

    return NextResponse.json({ event: transformed })

  } catch (error: any) {
    console.error('Error fetching Eventfrog event:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
