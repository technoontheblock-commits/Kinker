import { getEventfrogEvents, mergeEvents } from '@/lib/eventfrog'
import { getEvents } from '@/lib/events'
import { EventsGrid } from './events-grid'

export const dynamic = 'force-dynamic'

export default async function EventsPage() {
  const [frogEvents, localEvents] = await Promise.all([
    getEventfrogEvents(),
    getEvents(),
  ])

  const mergedEvents = mergeEvents(frogEvents, localEvents)

  const validEvents = mergedEvents.filter(
    e => e.title && e.title.trim() !== '' && e.title !== 'Unnamed Event'
  )

  validEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Events</h1>
          <p className="text-white/60 text-lg">
            Unsere kommenden Veranstaltungen
          </p>
        </div>

        {/* Events Grid */}
        {validEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60">Keine Events gefunden</p>
          </div>
        ) : (
          <EventsGrid events={validEvents} />
        )}
      </div>
    </div>
  )
}
