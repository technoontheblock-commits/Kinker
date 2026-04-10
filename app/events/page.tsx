'use client'

import Script from 'next/script'

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Events</h1>
          <p className="text-white/60 text-lg">
            Unsere kommenden Veranstaltungen
          </p>
        </div>

        {/* EventFrog Embed */}
        <div className="bg-zinc-900 rounded-xl overflow-hidden" style={{ height: '800px' }}>
          <iframe 
            width="100%" 
            height="100%" 
            style={{ border: 'none' }} 
            src="https://embed.eventfrog.ch/en/events.html?key=22822770-327e-415e-9756-e9c7090dbe5e&color=FF4D00&showSearch=true&excludeOrgs=false&orgId=1824536&orgId=2096700&orgId=2807113&geoRadius=10"
            title="EventFrog Events"
          />
        </div>
      </div>

      {/* EventFrog Embed Script */}
      <Script 
        src="https://embed.eventfrog.ch/js/relaunch/embed/embed.js"
        strategy="lazyOnload"
      />
    </div>
  )
}
