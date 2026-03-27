import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Get or create session ID
function getSessionId(): string {
  const cookieStore = cookies()
  let sessionId = cookieStore.get('session_id')?.value
  
  if (!sessionId) {
    sessionId = randomUUID()
    cookieStore.set('session_id', sessionId, { 
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    })
  }
  
  return sessionId
}

// GET /api/cart - Get cart items
export async function GET() {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    
    const sessionId = getSessionId()
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        product:merchandise(id, name, price, image),
        event_ticket:event_tickets(id, name, price, event_id)
      `)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('GET cart error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate totals
    const subtotal = data?.reduce((sum: number, item: any) => {
      const price = item.product?.price || item.event_ticket?.price || 0
      return sum + (price * item.quantity)
    }, 0) || 0

    return NextResponse.json({
      items: data || [],
      subtotal,
      itemCount: data?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0
    })
  } catch (error: any) {
    console.error('GET cart exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    
    const body = await request.json()
    const sessionId = getSessionId()
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Check if item already exists in cart
    const { data: existing } = await supabase
      .from('cart_items')
      .select('*')
      .eq('session_id', sessionId)
      .eq(body.product_id ? 'product_id' : 'event_ticket_id', body.product_id || body.event_ticket_id)
      .eq('selected_size', body.selected_size || 'One Size')
      .single()

    if (existing) {
      // Update quantity
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + (body.quantity || 1) })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(data)
    }

    // Insert new item
    const { data, error } = await supabase
      .from('cart_items')
      .insert([{
        session_id: sessionId,
        product_id: body.product_id || null,
        event_ticket_id: body.event_ticket_id || null,
        quantity: body.quantity || 1,
        selected_size: body.selected_size || 'One Size'
      }])
      .select()
      .single()

    if (error) {
      console.error('POST cart error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('POST cart exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/cart - Update cart item quantity
export async function PUT(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    
    const body = await request.json()
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    if (body.quantity <= 0) {
      // Remove item
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', body.id)

      if (error) throw error
      return NextResponse.json({ success: true, removed: true })
    }

    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity: body.quantity })
      .eq('id', body.id)
      .select()
      .single()

    if (error) {
      console.error('PUT cart error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('PUT cart exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/cart - Clear cart or remove item
export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('id')
    const sessionId = getSessionId()
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    if (itemId) {
      // Remove specific item
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
    } else {
      // Clear entire cart
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('session_id', sessionId)

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE cart exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
