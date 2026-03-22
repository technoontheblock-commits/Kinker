import { createClient } from '@supabase/supabase-js'
import { Database, Event } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create client
const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null

// Fallback events for when Supabase is not configured
const fallbackEvents: Event[] = [
  {
    id: 'techno-tuesday-001',
    name: 'TECHNO TUESDAY',
    date: '2026-04-07',
    time: '23:00',
    end_time: '06:00',
    description: 'Weekly underground techno session with local and international DJs.',
    full_description: 'Join us every Tuesday for the darkest techno night in Basel. Our residents and guest DJs deliver uncompromising hard techno in an intimate warehouse setting.',
    lineup: ['Marco Bailey', 'Basel Underground Collective', 'KINKER Residents'],
    image: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?q=80&w=2070&auto=format&fit=crop',
    ticket_url: '#tickets',
    type: 'clubnight',
    price: 'CHF 25',
    timetable: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'hard-sessions-042',
    name: 'HARD SESSIONS #42',
    date: '2026-04-12',
    time: '22:00',
    end_time: '08:00',
    description: 'Industrial hard techno all night long. Bring your energy.',
    full_description: 'Hard Sessions returns for its 42nd edition. We are bringing the hardest industrial techno to Basel.',
    lineup: ['SNTS', 'Somniac One', 'Nico Moreno', 'KOR'],
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop',
    ticket_url: '#tickets',
    type: 'special',
    price: 'CHF 35',
    timetable: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export async function getEvents(): Promise<Event[]> {
  if (!supabase) {
    console.warn('Supabase not configured, using fallback events')
    return fallbackEvents
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching events:', error)
    return fallbackEvents
  }

  return data || fallbackEvents
}

export async function getEventById(id: string): Promise<Event | null> {
  if (!supabase) {
    return fallbackEvents.find(e => e.id === id) || null
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching event:', error)
    return fallbackEvents.find(e => e.id === id) || null
  }

  return data
}

export async function getEventsByType(type: Event['type']): Promise<Event[]> {
  if (!supabase) {
    return fallbackEvents.filter(e => e.type === type)
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('type', type)
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching events by type:', error)
    return fallbackEvents.filter(e => e.type === type)
  }

  return data || fallbackEvents
}

export async function getUpcomingEvents(limit: number = 4): Promise<Event[]> {
  if (!supabase) {
    return fallbackEvents.slice(0, limit)
  }

  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Error fetching upcoming events:', error)
    return fallbackEvents.slice(0, limit)
  }

  return data?.length ? data : fallbackEvents.slice(0, limit)
}
