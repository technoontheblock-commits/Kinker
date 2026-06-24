import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET /api/bar-products - List all bar products
export async function GET() {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) {
      return auth.response
    }

    const supabase = createServerSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const { data, error } = await (supabase as any)
      .from('bar_products')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching bar products:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ products: data || [] })
  } catch (error: any) {
    console.error('Bar products GET error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// POST /api/bar-products - Create a new bar product
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) {
      return auth.response
    }

    const body = await request.json()
    const { name, price, category, sort_order, active } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name ist erforderlich' }, { status: 400 })
    }

    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json({ error: 'Ungültiger Preis' }, { status: 400 })
    }

    const validCategories = ['drink', 'shot', 'snack', 'other']
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Ungültige Kategorie' }, { status: 400 })
    }

    const supabase = createServerSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const { data, error } = await (supabase as any)
      .from('bar_products')
      .insert({
        name: name.trim(),
        price,
        category,
        sort_order: typeof sort_order === 'number' ? sort_order : 0,
        active: typeof active === 'boolean' ? active : true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating bar product:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ product: data })
  } catch (error: any) {
    console.error('Bar products POST error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
