import { redirect } from 'next/navigation'
import { requireBar } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase'
import { BarPage } from './components/bar-page'
import type { BarProduct } from '@/lib/database.types'

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

  return (
    <BarPage
      staffName={auth.user.name}
      initialProducts={(products || []) as BarProduct[]}
    />
  )
}
