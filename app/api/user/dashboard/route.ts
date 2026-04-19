import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/auth'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''



// GET /api/user/dashboard - Get dashboard overview data
export async function GET() {
  try {
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get stats in parallel
    const [
      ticketsRes,
      ordersRes,
      walletRes,
      rewardsRes
    ] = await Promise.all([
      // Count valid tickets
      supabase
        .from('tickets')
        .select('id', { count: 'exact' })
        .eq('holder_email', user.email)
        .eq('status', 'valid'),
      
      // Count orders
      supabase
        .from('orders')
        .select('id', { count: 'exact' })
        .eq('customer_email', user.email),
      
      // Get wallet balance
      supabase
        .from('user_wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single(),
      
      // Get rewards points
      supabase
        .from('user_rewards')
        .select('points')
        .eq('user_id', user.id)
        .single()
    ])

    // Get recent tickets with event details
    const { data: recentTickets } = await supabase
      .from('tickets')
      .select(`
        *,
        event:events(name, date, time, image)
      `)
      .eq('holder_email', user.email)
      .order('created_at', { ascending: false })
      .limit(3)

    // Get recent orders
    const { data: recentOrders } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .eq('customer_email', user.email)
      .order('created_at', { ascending: false })
      .limit(3)

    return NextResponse.json({
      stats: {
        tickets: ticketsRes.count || 0,
        orders: ordersRes.count || 0,
        balance: walletRes.data?.balance || 0,
        points: rewardsRes.data?.points || 0
      },
      recentTickets: recentTickets || [],
      recentOrders: recentOrders || []
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
