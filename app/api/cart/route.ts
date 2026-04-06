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
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
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
    
    // Get cart items without relationships first
    const { data: cartItems, error } = await supabase
      .from('cart_items')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('GET cart error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch related data manually
    const data = await Promise.all((cartItems || []).map(async (item: any) => {
      const result: any = { ...item }
      
      if (item.product_id) {
        const { data: product } = await supabase
          .from('merchandise')
          .select('id, name, price, image')
          .eq('id', item.product_id)
          .single()
        result.product = product
      }
      
      if (item.event_ticket_id) {
        const { data: ticket } = await supabase
          .from('event_tickets')
          .select('id, name, price, event:events(id, name, date)')
          .eq('id', item.event_ticket_id)
          .single()
        result.event_ticket = ticket
      }
      
      if (item.vip_booking_id) {
        const { data: vip } = await supabase
          .from('vip_bookings')
          .select('id, package, status, event:events(id, name, date)')
          .eq('id', item.vip_booking_id)
          .single()
        result.vip_booking = vip
      }
      
      return result
    }))

    // Filter out invalid items (products, tickets, or vip bookings that no longer exist)
    const validItems = data.filter((item: any) => {
      const hasProduct = item.product_id && item.product
      const hasEventTicket = item.event_ticket_id && item.event_ticket
      const hasVIPBooking = item.vip_booking_id && item.vip_booking
      const hasMetadataVIP = item.metadata?.type === 'vip_booking'
      return hasProduct || hasEventTicket || hasVIPBooking || hasMetadataVIP
    })

    // Remove invalid items from cart
    const invalidItems = data.filter((item: any) => {
      const hasProduct = item.product_id && item.product
      const hasEventTicket = item.event_ticket_id && item.event_ticket
      const hasVIPBooking = item.vip_booking_id && item.vip_booking
      const hasMetadataVIP = item.metadata?.type === 'vip_booking'
      return !hasProduct && !hasEventTicket && !hasVIPBooking && !hasMetadataVIP
    })

    if (invalidItems.length > 0) {
      await supabase
        .from('cart_items')
        .delete()
        .in('id', invalidItems.map((item: any) => item.id))
    }

    // Calculate totals
    const subtotal = validItems.reduce((sum: number, item: any) => {
      let price = 0
      if (item.product?.price) {
        price = item.product.price
      } else if (item.event_ticket?.price) {
        price = item.event_ticket.price
      } else if (item.metadata?.price) {
        price = item.metadata.price
      }
      return sum + (price * item.quantity)
    }, 0)

    // Get discount from cookie
    const discountCookie = cookies().get('cart_discount')?.value
    let discount = null
    let discountAmount = 0
    let total = subtotal

    console.log('Cart API - Discount cookie:', discountCookie)

    if (discountCookie) {
      try {
        discount = JSON.parse(discountCookie)
        console.log('Cart API - Parsed discount:', discount)
        console.log('Cart API - Discount value:', discount.value)
        
        // Calculate discount based on type
        if (discount.type === 'discount') {
          // Handle both object and number formats
          let discountPercent = 0
          if (typeof discount.value === 'object' && discount.value?.discount_percent) {
            discountPercent = discount.value.discount_percent
          } else if (typeof discount.value === 'number') {
            discountPercent = discount.value
          } else if (typeof discount.value === 'string') {
            discountPercent = parseInt(discount.value, 10) || 0
          }
          
          console.log('Cart API - Discount percent:', discountPercent)
          
          if (discountPercent > 0) {
            discountAmount = (subtotal * discountPercent) / 100
            total = Math.max(0, subtotal - discountAmount)
            console.log('Cart API - Calculated discount:', discountAmount, 'New total:', total)
          }
        } else if (discount.type === 'free_ticket') {
          // Free ticket - find cheapest ticket and make it free
          const tickets = validItems.filter((item: any) => item.event_ticket)
          if (tickets.length > 0) {
            const cheapestTicket = tickets.reduce((min: any, item: any) => 
              item.event_ticket.price < min.event_ticket.price ? item : min
            )
            discountAmount = cheapestTicket.event_ticket.price * cheapestTicket.quantity
            total = Math.max(0, subtotal - discountAmount)
          }
        }
      } catch (error) {
        console.error('Cart API - Error parsing discount:', error)
      }
    }

    return NextResponse.json({
      items: validItems,
      subtotal,
      discount: discount ? { ...discount, amount: discountAmount } : null,
      discountAmount,
      total,
      itemCount: validItems.reduce((sum: number, item: any) => sum + item.quantity, 0)
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
    let existingQuery = supabase
      .from('cart_items')
      .select('*')
      .eq('session_id', sessionId)
      .eq('selected_size', body.selected_size || 'One Size')
    
    if (body.product_id) {
      existingQuery = existingQuery.eq('product_id', body.product_id)
    } else if (body.event_ticket_id) {
      existingQuery = existingQuery.eq('event_ticket_id', body.event_ticket_id)
    } else if (body.vip_booking_id) {
      existingQuery = existingQuery.eq('vip_booking_id', body.vip_booking_id)
    }
    
    const { data: existingItems } = await existingQuery
    const existing = existingItems && existingItems.length > 0 ? existingItems[0] : null

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
    const insertData: any = {
      session_id: sessionId,
      product_id: body.product_id || null,
      event_ticket_id: body.event_ticket_id || null,
      vip_booking_id: body.vip_booking_id || null,
      quantity: body.quantity || 1,
      selected_size: body.selected_size || 'One Size',
      metadata: body.metadata || null
    }
    
    const { data, error } = await supabase
      .from('cart_items')
      .insert([insertData])
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
