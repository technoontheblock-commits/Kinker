import { redirect } from 'next/navigation'
import { requireTopUp } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase'
import { TopUpPage } from './components/topup-page'
import type { BarEvent, EventBar } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

export default async function TopUpRoute() {
  const auth = await requireTopUp()
  if (!auth.authorized) {
    redirect('/login?error=topup')
  }

  const supabase = createServerSupabase()
  if (!supabase) {
    redirect('/login?error=server')
  }

  // Load active event, or next upcoming event
  const { data: activeEvents } = await (supabase as any)
    .from('bar_events')
    .select('*')
    .eq('status', 'active')
    .order('date', { ascending: true })

  let currentEvent: BarEvent | null = activeEvents?.[0] || null

  if (!currentEvent) {
    const { data: upcomingEvents } = await (supabase as any)
      .from('bar_events')
      .select('*')
      .eq('status', 'upcoming')
      .order('date', { ascending: true })
      .limit(1)
    currentEvent = upcomingEvents?.[0] || null
  }

  let bars: EventBar[] = []
  if (currentEvent) {
    const { data: eventBars } = await (supabase as any)
      .from('event_bars')
      .select('*')
      .eq('event_id', currentEvent.id)
      .eq('active', true)
      .order('sort_order', { ascending: true })
    bars = eventBars || []
  }

  return (
    <TopUpPage
      staffName={auth.user.name}
      currentEvent={currentEvent}
      bars={bars}
    />
  )
}
