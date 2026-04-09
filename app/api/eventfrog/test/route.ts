import { NextRequest, NextResponse } from 'next/server'

const EVENTFROG_API_URL = process.env.EVENTFROG_API_URL || 'https://api.eventfrog.net'
const API_KEY = process.env.EVENTFROG_API_KEY

// GET /api/eventfrog/test - Test the API without organizer filter
export async function GET(request: NextRequest) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'Eventfrog API key not configured' },
        { status: 500 }
      )
    }

    // Load events without organizer filter (all events in Switzerland)
    const response = await fetch(
      `${EVENTFROG_API_URL}/public/v1/events?country=CH&perPage=10&from=2024-01-01`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { 
          error: 'API request failed',
          status: response.status,
          details: errorText
        },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: 'API is working!',
      totalEvents: data.totalDatasets,
      sampleEvents: data.datasets?.slice(0, 3).map((e: any) => ({
        id: e.id,
        title: e.title?.de || e.title?.en,
        organizerId: e.organizerId,
        organizerName: e.organizerName,
        date: e.begin,
      })) || [],
      allOrganizers: [...new Set(data.datasets?.map((e: any) => `${e.organizerName} (ID: ${e.organizerId})`))].slice(0, 10),
    })

  } catch (error: any) {
    console.error('Error testing Eventfrog API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
