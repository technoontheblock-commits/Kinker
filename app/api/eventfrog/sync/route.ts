import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/auth'

const EVENTFROG_API_URL = 'https://api.eventfrog.net/api/v1'
const API_KEY = process.env.EVENTFROG_API_KEY
const ORGANIZER_IDS = process.env.EVENTFROG_ORGANIZER_IDS?.split(',').map(id => id.trim()).filter(Boolean) || ['2807113']
const ORGANIZER_NAME_FILTER = process.env.EVENTFROG_ORGANIZER_NAME?.toLowerCase() || 'kinker'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const dynamic = 'force-dynamic'

function parseSafeJson(text: string): any {
  // Eventfrog returns very large IDs (e.g. 7456707453478002840) which exceed
  // JavaScript's Number.MAX_SAFE_INTEGER. We convert them to strings.
  const safeText = text
    .replace(/"id"\s*:\s*(\d{16,})/g, '"id":"$1"')
    .replace(/"organizerId"\s*:\s*(\d{16,})/g, '"organizerId":"$1"')
  return JSON.parse(safeText)
}

async function fetchEvents(url: string): Promise<any[]> {
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`${response.status}: ${text.substring(0, 300)}`)
  }

  const text = await response.text()
  const data = parseSafeJson(text)
  return data.events || []
}

function extractImageUrl(event: any): string {
  const img = event.image || event.emblemToShow || event.imageToShow
  if (typeof img === 'string') return img
  if (img && typeof img === 'object') return img.url || ''
  return ''
}

function transformEvent(event: any) {
  const dateStr = event.begin?.split('T')[0] || ''
  const timeStr = event.begin?.split('T')[1]?.slice(0, 5) || ''
  const endTimeStr = event.end?.split('T')[1]?.slice(0, 5) || null
  const price = event.lowestTicketPrice || 0

  return {
    id: event.id?.toString(),
    name: event.title?.de || event.title?.en || 'Unnamed Event',
    date: dateStr,
    time: timeStr,
    end_time: endTimeStr,
    description: event.shortDescription?.de || event.shortDescription?.en || '',
    full_description: event.descriptionAsHTML?.de || event.descriptionAsHTML?.en || event.shortDescription?.de || event.shortDescription?.en || '',
    lineup: [],
    image: extractImageUrl(event),
    ticket_url: event.presaleLink || event.url || '',
    type: 'clubnight' as const,
    price: price > 0 ? `CHF ${price}` : 'CHF 25',
    timetable: null,
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) return auth.response

    if (!API_KEY) {
      return NextResponse.json(
        { error: 'Eventfrog API key not configured' },
        { status: 500 }
      )
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch events from Eventfrog (same logic as /api/eventfrog/events)
    let organizerFilteredEvents: any[] = []
    const errors: string[] = []

    for (const orgId of ORGANIZER_IDS) {
      try {
        const url = `${EVENTFROG_API_URL}/events.json?apiKey=${encodeURIComponent(API_KEY)}&orgId=${encodeURIComponent(orgId)}&perPage=100`
        const events = await fetchEvents(url)
        const validEvents = events.filter((e: any) =>
          ORGANIZER_IDS.includes(e.organizerId?.toString())
        )
        if (validEvents.length > 0) {
          organizerFilteredEvents.push(...validEvents)
        }
      } catch (err: any) {
        errors.push(`orgId=${orgId}: ${err.message}`)
      }
    }

    let allEvents: any[] = []
    if (organizerFilteredEvents.length === 0) {
      try {
        const pagesToLoad = 20
        for (let page = 1; page <= pagesToLoad; page++) {
          const url = `${EVENTFROG_API_URL}/events.json?apiKey=${encodeURIComponent(API_KEY)}&perPage=100&page=${page}`
          const events = await fetchEvents(url)
          allEvents.push(...events)
          if (events.length < 100) break
        }
      } catch (err: any) {
        errors.push(`all-events: ${err.message}`)
      }
    }

    let matchedEvents: any[] = []
    if (organizerFilteredEvents.length > 0) {
      matchedEvents = organizerFilteredEvents
    } else if (allEvents.length > 0) {
      matchedEvents = allEvents.filter((e: any) => {
        const eventOrgId = e.organizerId?.toString()
        const eventOrgName = (e.organizerName || '').toLowerCase()
        const idMatch = ORGANIZER_IDS.includes(eventOrgId)
        const nameMatch = eventOrgName.includes(ORGANIZER_NAME_FILTER)
        return idMatch || nameMatch
      })
    }

    // Remove duplicates
    const uniqueEvents = matchedEvents
      .filter((event, index, self) =>
        index === self.findIndex((e) => e.id === event.id)
      )
      .sort((a, b) => new Date(a.begin).getTime() - new Date(b.begin).getTime())

    // Upsert into database
    const transformedEvents = uniqueEvents.map(transformEvent)
    let created = 0
    let updated = 0
    let failed = 0
    const failDetails: string[] = []

    for (const event of transformedEvents) {
      try {
        // Check if event already exists
        const { data: existing } = await supabase
          .from('events')
          .select('id')
          .eq('id', event.id)
          .single()

        if (existing) {
          // Update
          const { error } = await supabase
            .from('events')
            .update({
              name: event.name,
              date: event.date,
              time: event.time,
              end_time: event.end_time,
              description: event.description,
              full_description: event.full_description,
              image: event.image,
              ticket_url: event.ticket_url,
              price: event.price,
              updated_at: new Date().toISOString(),
            })
            .eq('id', event.id)

          if (error) {
            failed++
            failDetails.push(`Update ${event.id}: ${error.message}`)
          } else {
            updated++
          }
        } else {
          // Insert
          const { error } = await supabase
            .from('events')
            .insert([{
              ...event,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }])

          if (error) {
            failed++
            failDetails.push(`Insert ${event.id}: ${error.message}`)
          } else {
            created++
          }
        }
      } catch (err: any) {
        failed++
        failDetails.push(`Event ${event.id}: ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalFetched: uniqueEvents.length,
        created,
        updated,
        failed,
      },
      errors: errors.length > 0 ? errors : undefined,
      failDetails: failDetails.length > 0 ? failDetails : undefined,
    })

  } catch (error: any) {
    console.error('Error syncing Eventfrog events:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
