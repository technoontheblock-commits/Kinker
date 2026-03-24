import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// GET /api/merchandise - Get all merchandise items
export async function GET() {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data, error } = await supabase
      .from('merchandise')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('GET merchandise error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('GET merchandise exception:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// POST /api/merchandise - Create new merchandise item (Admin only)
export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    
    const body = await request.json()
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data, error } = await supabase
      .from('merchandise')
      .insert([{
        name: body.name,
        description: body.description,
        price: body.price,
        image: body.image,
        category: body.category,
        sizes: body.sizes || [],
        stock: body.stock || 0,
        active: true
      }])
      .select()
      .single()

    if (error) {
      console.error('POST merchandise error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('POST merchandise exception:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
