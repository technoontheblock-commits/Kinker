import { HeroSection } from '@/components/hero-section'
import { EventsSection } from '@/components/events-section'
import { AboutSection } from '@/components/about-section'
import { LocationPreview } from '@/components/location-preview'
import { NewsletterSection } from '@/components/newsletter-section'
import { getEventfrogEvents, mergeEvents } from '@/lib/eventfrog'
import { getUpcomingEvents } from '@/lib/events'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [frogEvents, localEvents] = await Promise.all([
    getEventfrogEvents(),
    getUpcomingEvents(10),
  ])

  const merged = mergeEvents(frogEvents, localEvents)

  const validEvents = merged.filter(
    e => e.title && e.title.trim() !== '' && e.title !== 'Unnamed Event'
  )

  validEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const upcoming = validEvents.slice(0, 4)

  return (
    <>
      <HeroSection />
      <EventsSection events={upcoming} />
      <AboutSection />
      <LocationPreview />
      <NewsletterSection />
    </>
  )
}
