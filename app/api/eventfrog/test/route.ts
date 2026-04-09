import { NextRequest, NextResponse } from 'next/server'

const EVENTFROG_API_URL = process.env.EVENTFROG_API_URL || 'https://api.eventfrog.net'
const API_KEY = process.env.EVENTFROG_API_KEY

// GET /api/eventfrog/test - Test the API with various parameters
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

    // Test 1: No date filter, just country
    try {
      const res1 = await fetch(
        `${EVENTFROG_API_URL}/public/v1/events?country=CH&perPage=20`,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      )
      const data1 = await res1.json()
      results.tests.push({
        name: 'No date filter (country=CH)',
        status: res1.status,
        totalEvents: data1.totalDatasets,
        eventsCount: data1.datasets?.length || 0
      })
      results.test1Data = data1.datasets?.slice(0, 3).map((e: any) => ({
        id: e.id,
        title: e.title?.de || e.title?.en,
        organizerId: e.organizerId,
        organizerName: e.organizerName,
        begin: e.begin,
        end: e.end,
      }))
      results.allOrganizers = Array.from(new Set(data1.datasets?.map((e: any) => `${e.organizerName} (ID: ${e.organizerId})`))).slice(0, 20)
    } catch (e: any) {
      results.tests.push({ name: 'No date filter', error: e.message })
    }

    // Test 2: With from date (past)
    try {
      const fromDate = '2023-01-01'
      const res2 = await fetch(
        `${EVENTFROG_API_URL}/public/v1/events?country=CH&from=${fromDate}&perPage=20`,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      )
      const data2 = await res2.json()
      results.tests.push({
        name: `With from=${fromDate}`,
        status: res2.status,
        totalEvents: data2.totalDatasets,
        eventsCount: data2.datasets?.length || 0
      })
    } catch (e: any) {
      results.tests.push({ name: 'With from date', error: e.message })
    }

    // Test 3: With to date (future)
    try {
      const toDate = '2027-12-31'
      const res3 = await fetch(
        `${EVENTFROG_API_URL}/public/v1/events?country=CH&to=${toDate}&perPage=20`,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      )
      const data3 = await res3.json()
      results.tests.push({
        name: `With to=${toDate}`,
        status: res3.status,
        totalEvents: data3.totalDatasets,
        eventsCount: data3.datasets?.length || 0
      })
    } catch (e: any) {
      results.tests.push({ name: 'With to date', error: e.message })
    }

    // Test 4: With organizer ID
    const organizerId = process.env.EVENTFROG_ORGANIZER_ID
    if (organizerId) {
      try {
        const res4 = await fetch(
          `${EVENTFROG_API_URL}/public/v1/events?country=CH&orgId=${organizerId}&perPage=20`,
          {
            headers: {
              'Authorization': `Bearer ${API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        )
        const data4 = await res4.json()
        results.tests.push({
          name: `With organizer ID ${organizerId}`,
          status: res4.status,
          totalEvents: data4.totalDatasets,
          eventsCount: data4.datasets?.length || 0
        })
      } catch (e: any) {
        results.tests.push({ name: 'With organizer ID', error: e.message })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'API tests completed',
      organizerId,
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
