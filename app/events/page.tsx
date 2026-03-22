import { Metadata } from 'next'
import { getEvents } from '@/lib/events'
import { EventsClient } from './events-client'

export const metadata: Metadata = {
  title: 'Events | KINKER BASEL',
  description: 'Upcoming techno events at KINKER Basel. Hard techno, club nights, and festivals.',
}

export const revalidate = 60

export default async function EventsPage() {
  const events = await getEvents()

  return <EventsClient events={events} />
}
