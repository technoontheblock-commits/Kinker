import { HeroSection } from '@/components/hero-section'
import { EventsSection } from '@/components/events-section'
import { AboutSection } from '@/components/about-section'
import { LocationPreview } from '@/components/location-preview'
import { NewsletterSection } from '@/components/newsletter-section'

export const revalidate = 60

export default function Home() {
  return (
    <>
      <HeroSection />
      <EventsSection />
      <AboutSection />
      <LocationPreview />
      <NewsletterSection />
    </>
  )
}
