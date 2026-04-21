import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// GET /api/merchandise - Get all merchandise items (local + Printful)
export async function GET() {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get local merchandise
    const { data: localProducts, error: localError } = await supabase
      .from('merchandise')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })

    if (localError) {
      console.error('GET merchandise error:', localError)
    }

    // Get Printful products
    const { data: printfulProducts, error: printfulError } = await supabase
      .from('printful_products')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })

    if (printfulError) {
      console.error('GET printful products error:', printfulError)
    }

    // Transform Printful products to match local format
    const transformedPrintful = (printfulProducts || []).map((p: any) => ({
      id: p.id,
      printful_id: p.printful_id,
      name: p.name,
      description: p.description,
      price: p.variants?.[0]?.price || 0,
      image: p.thumbnail_url,
      category: 'printful',
      sizes: p.variants?.map((v: any) => `${v.size}${v.color ? ` / ${v.color}` : ''}`).filter(Boolean) || [],
      variants: p.variants || [],
      stock: 999,
      type: 'printful',
      active: p.active,
    }))

    // Transform local products
    const transformedLocal = (localProducts || []).map((p: any) => ({
      ...p,
      type: 'local',
    }))

    return NextResponse.json([...transformedLocal, ...transformedPrintful])
  } catch (error: any) {
    console.error('GET merchandise exception:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// POST /api/merchandise - Create new merchandise item (admin only)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) return auth.response

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
