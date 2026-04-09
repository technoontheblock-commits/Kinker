import { NextRequest, NextResponse } from 'next/server'

const EVENTFROG_API_URL = process.env.EVENTFROG_API_URL || 'https://api.eventfrog.net'
const API_KEY = process.env.EVENTFROG_API_KEY

// GET /api/eventfrog/test - Test the Organizer API
export async function GET(request: NextRequest) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'Eventfrog API key not configured' },
        { status: 500 }
      )
    }

    const results: any = {
      apiKeyPresent: true,
      tests: []
    }

    // Test 1: Organizer API - all events
    try {
      const res1 = await fetch(
        `${EVENTFROG_API_URL}/organizer/v1/events?perPage=20`,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      )
      const data1 = await res1.json()
      results.tests.push({
        name: 'Organizer API - All events',
        status: res1.status,
        totalEvents: data1.totalDatasets,
        eventsCount: data1.datasets?.length || 0
      })
      results.test1Data = data1.datasets?.slice(0, 5).map((e: any) => ({
        id: e.id,
        title: e.title?.de || e.title?.en,
        organizerId: e.organizerId,
        organizerName: e.organizerName,
        begin: e.begin,
        end: e.end,
        status: e.status,
        visible: e.visible,
        published: e.published,
      }))
    } catch (e: any) {
      results.tests.push({ name: 'Organizer API - All events', error: e.message })
    }

    // Test 2: Organizer API - with from date
    try {
      const fromDate = '2023-01-01'
      const res2 = await fetch(
        `${EVENTFROG_API_URL}/organizer/v1/events?from=${fromDate}&perPage=20`,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      )
      const data2 = await res2.json()
      results.tests.push({
        name: `Organizer API - from=${fromDate}`,
        status: res2.status,
        totalEvents: data2.totalDatasets,
        eventsCount: data2.datasets?.length || 0
      })
    } catch (e: any) {
      results.tests.push({ name: 'Organizer API - with from date', error: e.message })
    }

    // Test 3: Try Public API (might fail with 403 for Organizer keys)
    try {
      const res3 = await fetch(
        `${EVENTFROG_API_URL}/public/v1/events?country=CH&perPage=10`,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      )
      const data3 = await res3.json()
      results.tests.push({
        name: 'Public API (should fail for Organizer keys)',
        status: res3.status,
        totalEvents: data3.totalDatasets,
        eventsCount: data3.datasets?.length || 0
      })
    } catch (e: any) {
      results.tests.push({ name: 'Public API', error: e.message })
    }

    return NextResponse.json({
      success: true,
      message: 'API tests completed',
      organizerId: process.env.EVENTFROG_ORGANIZER_ID,
      results
    })

  } catch (error: any) {
    console.error('Error testing Eventfrog API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
