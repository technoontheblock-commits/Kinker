import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// GET /api/orders - Get all orders (admin only)
export async function GET() {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // First get all orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('Orders error:', ordersError)
      return NextResponse.json({ error: ordersError.message }, { status: 500 })
    }

    // Then get order items for each order
    const ordersWithItems = await Promise.all(
      (orders || []).map(async (order) => {
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id)
        
        if (itemsError) {
          console.error('Items error for order', order.id, itemsError)
        }
        
        return {
          ...order,
          items: items || []
        }
      })
    )

    return NextResponse.json(ordersWithItems)
  } catch (error: any) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
