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
    .select('id, order_id, amount, type, status, description, reference, created_at')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Load purchased items for payment transactions so the guest can see
  // which products were bought in each transaction.
  const orderIds = (transactions || [])
    .map((tx: any) => tx.order_id)
    .filter(Boolean)

  let itemsByOrderId = new Map<string, any[]>()
  if (orderIds.length > 0) {
    const { data: orderItems } = await supabaseAny
      .from('bar_order_items')
      .select('order_id, name, quantity, total')
      .in('order_id', orderIds)

    for (const item of orderItems || []) {
      const list = itemsByOrderId.get(item.order_id) || []
      list.push(item)
      itemsByOrderId.set(item.order_id, list)
    }
  }

  // Attach items directly to each transaction for the client view.
  const transactionsWithItems = (transactions || []).map((tx: any) => ({
    ...tx,
    items: tx.order_id ? (itemsByOrderId.get(tx.order_id) || []) : [],
  }))

  return (
    <WalletView
      wallet={wallet || null}
      transactions={transactionsWithItems}
    />
  )
}
