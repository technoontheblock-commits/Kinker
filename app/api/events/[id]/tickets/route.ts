import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// PUT /api/events/[id]/tickets - Update ticket types for an event
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }
    
    const body = await request.json()
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // First, deactivate existing tickets
    await supabase
      .from('event_tickets')
      .update({ active: false })
      .eq('event_id', params.id)
    
    // Then insert/update new ticket types
    for (const ticket of body.ticketTypes) {
      // Check if ticket type already exists
      const { data: existing } = await supabase
        .from('event_tickets')
        .select('id')
        .eq('event_id', params.id)
        .eq('name', ticket.name)
        .single()
      
      if (existing) {
        // Update existing
        await supabase
          .from('event_tickets')
          .update({
            price: ticket.price,
            description: ticket.description,
            max_quantity: ticket.max_quantity,
            active: ticket.active,
            sale_start: new Date().toISOString(),
            sale_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
          .eq('id', existing.id)
      } else {
        // Insert new
        await supabase
          .from('event_tickets')
          .insert({
            event_id: params.id,
            name: ticket.name,
            price: ticket.price,
            description: ticket.description,
            max_quantity: ticket.max_quantity,
            active: ticket.active,
            sale_start: new Date().toISOString(),
            sale_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
      }
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('PUT event tickets error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
