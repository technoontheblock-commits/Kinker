import { redirect } from 'next/navigation'
import { requireTopUp } from '@/lib/auth'
import { TopUpPage } from './components/topup-page'

export const dynamic = 'force-dynamic'

export default async function TopUpRoute() {
  const auth = await requireTopUp()
  if (!auth.authorized) {
    redirect('/login?error=topup')
  }

  return <TopUpPage staffName={auth.user.name} />
}
