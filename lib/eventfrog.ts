import { Event } from './database.types'

export interface EventfrogEvent {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  price: number
  currency: string
  image: string
  url: string
  soldOut: boolean
}

const EVENTFROG_API_URL = 'https://api.eventfrog.net/api/v1'
const API_KEY = process.env.EVENTFROG_API_KEY
const ORGANIZER_IDS = process.env.EVENTFROG_ORGANIZER_IDS?.split(',').map(id => id.trim()).filter(Boolean) || ['2807113']
const ORGANIZER_NAME_FILTER = process.env.EVENTFROG_ORGANIZER_NAME?.toLowerCase() || 'kinker'

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
    cache: 'no-store',
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`${response.status}: ${text.substring(0, 300)}`)
  }

  const text = await response.text()
  const data = parseSafeJson(text)
  return data.events || []
}

function extractImageUrl(event: any): string | undefined {
  const img = event.image || event.emblemToShow || event.imageToShow
  if (typeof img === 'string') return img
  if (img && typeof img === 'object') return img.url
  return undefined
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

function getEventTitle(event: any): string {
  if (typeof event.title === 'string') return event.title
  if (event.title && typeof event.title === 'object') {
    return event.title.de || event.title.en || ''
  }
  if (typeof event.name === 'string') return event.name
  if (typeof event.label === 'string') return event.label
  return ''
}

function transformEvent(event: any): EventfrogEvent {
  const { date, time } = getValidDate(event.begin)
  return {
    id: event.id?.toString(),
    title: getEventTitle(event) || 'Unnamed Event',
    description: event.descriptionAsHTML?.de || event.descriptionAsHTML?.en || event.shortDescription?.de || event.shortDescription?.en || '',
    date,
    time,
    location: event.locationText || event.location?.name || 'KINKER, Münchenstein',
    price: event.lowestTicketPrice || 0,
    currency: event.currency || 'CHF',
    image: extractImageUrl(event) || '',
    url: event.presaleLink || event.url,
    soldOut: event.soldOut || false,
  }
}

export async function getEventfrogEvents(): Promise<EventfrogEvent[]> {
  if (!API_KEY) {
    console.error('Eventfrog API key not configured')
    return []
  }

  const errors: string[] = []

  // --- STRATEGY 1: Use orgId parameter ---
  let organizerFilteredEvents: any[] = []

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

  // --- STRATEGY 2: Fetch all events without filter and match by organizerId ---
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

  // --- FILTERING: Match events by organizerId or organizerName ---
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

  // Remove duplicates and sort
  const uniqueEvents = matchedEvents
    .filter((event, index, self) =>
      index === self.findIndex((e) => e.id === event.id)
    )
    .sort((a, b) => new Date(a.begin).getTime() - new Date(b.begin).getTime())

  const events = uniqueEvents.map(transformEvent).filter((e: EventfrogEvent) =>
    e.title && e.title.trim() !== '' && e.title !== 'Unnamed Event'
  )

  // --- FILTER OUT PAST EVENTS ---
  const now = new Date()
  const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0]

  const upcomingEvents = events.filter(e => e.date >= todayStr)

  if (errors.length > 0 && upcomingEvents.length === 0) {
    console.error('Eventfrog fetch errors:', errors)
  }

  return upcomingEvents
}

export function mergeEvents(frogEvents: EventfrogEvent[], localEvents: Event[]): EventfrogEvent[] {
  const allEvents = [...frogEvents]
  const existingIds = new Set(allEvents.map(ev => ev.id))

  for (const e of localEvents) {
    if (!existingIds.has(e.id)) {
      allEvents.push({
        id: e.id,
        title: e.name,
        description: e.description || e.full_description || '',
        date: e.date,
        time: e.time,
        location: 'KINKER, Münchenstein',
        price: parseFloat(e.price?.replace(/[^0-9.]/g, '')) || 0,
        currency: 'CHF',
        image: e.image || '',
        url: e.ticket_url || '',
        soldOut: false,
      })
      existingIds.add(e.id)
    }
  }

  return allEvents
}
