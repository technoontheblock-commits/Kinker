import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function GET() {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json([])
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('GET products error:', error)
      return NextResponse.json([])
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('GET products exception:', error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    
    const body = await request.json()
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data, error } = await supabase
      .from('products')
      .insert([body])
      .select()
      .single()

    if (error) {
      console.error('POST product error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('POST product exception:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
