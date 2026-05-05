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

function getValidDate(begin: string | undefined): { date: string; time: string } {
  if (!begin) {
    const now = new Date()
    return { date: now.toISOString().split('T')[0], time: '22:00' }
  }
  const dateStr = begin.split('T')[0]
  const timeStr = begin.split('T')[1]?.slice(0, 5) || '22:00'
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { date: dateStr, time: timeStr }
  }
  const now = new Date()
  return { date: now.toISOString().split('T')[0], time: '22:00' }
}

function transformEvent(event: any) {
  const { date: dateStr, time: timeStr } = getValidDate(event.begin)
  const endTimeStr = event.end?.split('T')[1]?.slice(0, 5) || null
  const price = event.lowestTicketPrice || 0
  const name = event.title?.de || event.title?.en || event.title || ''

  return {
    id: event.id?.toString(),
    name: name || 'Unnamed Event',
    date: dateStr,
    time: timeStr,
    end_time: endTimeStr,
    description: event.shortDescription?.de || event.shortDescription?.en || event.shortDescription || event.description || '',
    full_description: event.descriptionAsHTML?.de || event.descriptionAsHTML?.en || event.shortDescription?.de || event.shortDescription?.en || event.description || '',
    lineup: [],
    image: extractImageUrl(event),
    ticket_url: event.presaleLink || event.url || '',
    type: 'clubnight' as const,
    price: price > 0 ? `CHF ${price}` : 'CHF 25',
    timetable: null,
  }
}

function isKinkerEvent(event: any): boolean {
  const eventOrgId = event.organizerId?.toString() || ''
  const eventOrgName = (event.organizerName || '').toLowerCase()
  const eventLocation = (event.locationText || event.location?.name || '').toLowerCase()
  const title = (event.title?.de || event.title?.en || event.title || '').toLowerCase()

  const idMatch = ORGANIZER_IDS.includes(eventOrgId)
  const nameMatch = eventOrgName.includes(ORGANIZER_NAME_FILTER)
  const locationMatch = eventLocation.includes('kinker') || eventLocation.includes('münchenstein')
  const titleMatch = title.includes('kinker')

  return idMatch || nameMatch || locationMatch || titleMatch
}

async function upsertEvent(supabase: any, event: any) {
  const transformed = transformEvent(event)
  if (!transformed.name || transformed.name === 'Unnamed Event') {
    return { action: 'skipped', error: null }
  }

  const { data: existing } = await supabase
    .from('events')
    .select('id')
    .eq('id', transformed.id)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('events')
      .update({
        name: transformed.name,
        date: transformed.date,
        time: transformed.time,
        end_time: transformed.end_time,
        description: transformed.description,
        full_description: transformed.full_description,
        image: transformed.image,
        ticket_url: transformed.ticket_url,
        price: transformed.price,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transformed.id)
    return { action: 'updated', error }
  } else {
    const { error } = await supabase
      .from('events')
      .insert([{
        ...transformed,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
    return { action: 'created', error }
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
    const body = await request.json().catch(() => ({}))

    // --- SINGLE EVENT SYNC by ID ---
    if (body.eventId) {
      const url = `${EVENTFROG_API_URL}/events.json?apiKey=${encodeURIComponent(API_KEY)}&id=${encodeURIComponent(body.eventId)}`
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

      const text = await response.text()
      const data = parseSafeJson(text)
      const events = data.events || []

      if (events.length === 0) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 })
      }

      const result = await upsertEvent(supabase, events[0])
      if (result.error) {
        return NextResponse.json({ error: result.error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        summary: { totalFetched: 1, created: result.action === 'created' ? 1 : 0, updated: result.action === 'updated' ? 1 : 0, failed: 0 },
        event: transformEvent(events[0]),
      })
    }

    // --- FULL SYNC: Try multiple strategies to find ALL Kinker events ---
    const allRawEvents: any[] = []
    const errors: string[] = []
    const attempts: any[] = []

    // Strategy 1: orgId parameter
    for (const orgId of ORGANIZER_IDS) {
      try {
        const url = `${EVENTFROG_API_URL}/events.json?apiKey=${encodeURIComponent(API_KEY)}&orgId=${encodeURIComponent(orgId)}&perPage=100`
        const events = await fetchEvents(url)
        attempts.push({ strategy: 'orgId', orgId, count: events.length })
        allRawEvents.push(...events)
      } catch (err: any) {
        attempts.push({ strategy: 'orgId', orgId, error: err.message })
        errors.push(`orgId=${orgId}: ${err.message}`)
      }
    }

    // Strategy 2: organizerId parameter (alternative name)
    for (const orgId of ORGANIZER_IDS) {
      try {
        const url = `${EVENTFROG_API_URL}/events.json?apiKey=${encodeURIComponent(API_KEY)}&organizerId=${encodeURIComponent(orgId)}&perPage=100`
        const events = await fetchEvents(url)
        attempts.push({ strategy: 'organizerId', orgId, count: events.length })
        allRawEvents.push(...events)
      } catch (err: any) {
        attempts.push({ strategy: 'organizerId', orgId, error: err.message })
        errors.push(`organizerId=${orgId}: ${err.message}`)
      }
    }

    // Strategy 3: Load all events without filter (many pages)
    // We load events from 2020 to 2027 in chunks to cover all Kinker events
    const years = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027]
    for (const year of years) {
      try {
        const fromDate = `${year}-01-01`
        const toDate = `${year}-12-31`
        const url = `${EVENTFROG_API_URL}/events.json?apiKey=${encodeURIComponent(API_KEY)}&from=${fromDate}&to=${toDate}&perPage=100`
        const events = await fetchEvents(url)
        attempts.push({ strategy: 'year-range', year, count: events.length })
        allRawEvents.push(...events)
      } catch (err: any) {
        attempts.push({ strategy: 'year-range', year, error: err.message })
      }
    }

    // Strategy 4: Fallback - load recent pages without date filter
    try {
      for (let page = 1; page <= 30; page++) {
        const url = `${EVENTFROG_API_URL}/events.json?apiKey=${encodeURIComponent(API_KEY)}&perPage=100&page=${page}`
        const events = await fetchEvents(url)
        attempts.push({ strategy: 'all-pages', page, count: events.length })
        allRawEvents.push(...events)
        if (events.length < 100) break
      }
    } catch (err: any) {
      errors.push(`all-pages: ${err.message}`)
    }

    // Deduplicate by ID
    const eventMap = new Map<string, any>()
    for (const event of allRawEvents) {
      const id = event.id?.toString()
      if (id && !eventMap.has(id)) {
        eventMap.set(id, event)
      }
    }

    // Filter for Kinker events (generous matching)
    const kinkerEvents = Array.from(eventMap.values()).filter(isKinkerEvent)

    // Sort by date
    kinkerEvents.sort((a, b) => new Date(a.begin || 0).getTime() - new Date(b.begin || 0).getTime())

    // Upsert all Kinker events
    let created = 0
    let updated = 0
    let skipped = 0
    let failed = 0
    const failDetails: string[] = []

    for (const event of kinkerEvents) {
      try {
        const result = await upsertEvent(supabase, event)
        if (result.error) {
          failed++
          failDetails.push(`${event.id}: ${result.error.message}`)
        } else if (result.action === 'created') {
          created++
        } else if (result.action === 'updated') {
          updated++
        } else {
          skipped++
        }
      } catch (err: any) {
        failed++
        failDetails.push(`${event.id}: ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalScanned: eventMap.size,
        kinkerEventsFound: kinkerEvents.length,
        created,
        updated,
        skipped,
        failed,
      },
      attempts,
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
