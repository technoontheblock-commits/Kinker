import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// GET /api/admin/newsletter/subscribers - Get subscriber count
export async function GET() {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) return auth.response

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { count, error } = await supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('confirmed', true)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ count: count || 0 })
  } catch (error: any) {
    console.error('Error fetching subscribers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
