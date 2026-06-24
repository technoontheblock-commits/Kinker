import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase'
import { WalletView } from './components/wallet-view'

export const dynamic = 'force-dynamic'

export default async function WalletPage() {
  const auth = await requireAuth()
  if (!auth.authorized) {
    redirect('/login?redirect=/dashboard/wallet')
  }

  const supabase = createServerSupabase()
  if (!supabase) {
    redirect('/login?error=server')
  }

  const supabaseAny = supabase as any

  const { data: wallet } = await supabaseAny
    .from('bar_wallets')
    .select('id, balance, currency, qr_token')
    .eq('user_id', auth.user.id)
    .single()

  const { data: transactions } = await supabaseAny
    .from('bar_wallet_transactions')
    .select('id, amount, type, status, description, reference, created_at')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <WalletView
      wallet={wallet || null}
      transactions={(transactions || []) as any[]}
    />
  )
}
