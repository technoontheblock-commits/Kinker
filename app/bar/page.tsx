import { redirect } from 'next/navigation'
import { requireBar } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase'
import { BarPage } from './components/bar-page'
import type { BarProduct, BarEvent, EventBar, BarProductCategory } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

export default async function BarRoute() {
  const auth = await requireBar()
  if (!auth.authorized) {
    redirect('/login?error=bar')
  }

  const supabase = createServerSupabase()
  if (!supabase) {
    redirect('/login?error=server')
  }

  const { data: products } = await (supabase as any)
    .from('bar_products')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  const { data: categories } = await (supabase as any)
    .from('bar_product_categories')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

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
    <BarPage
      staffName={auth.user.name}
      initialProducts={(products || []) as BarProduct[]}
      initialCategories={(categories || []) as BarProductCategory[]}
      currentEvent={currentEvent}
      bars={bars}
    />
  )
}
