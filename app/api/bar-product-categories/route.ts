import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// GET /api/bar-product-categories - List all categories
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
      .from('bar_product_categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching bar product categories:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ categories: data || [] })
  } catch (error: any) {
    console.error('Bar product categories GET error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// POST /api/bar-product-categories - Create a new category
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) {
      return auth.response
    }

    const body = await request.json()
    const { name, slug, sort_order, active } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name ist erforderlich' }, { status: 400 })
    }

    const finalSlug = slug && typeof slug === 'string' && slug.trim().length > 0
      ? slug.trim()
      : slugify(name)

    if (finalSlug.length === 0) {
      return NextResponse.json({ error: 'Ungültiger Slug' }, { status: 400 })
    }

    const supabase = createServerSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const { data, error } = await (supabase as any)
      .from('bar_product_categories')
      .insert({
        name: name.trim(),
        slug: finalSlug,
        sort_order: typeof sort_order === 'number' ? sort_order : 0,
        active: typeof active === 'boolean' ? active : true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating bar product category:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ category: data }, { status: 201 })
  } catch (error: any) {
    console.error('Bar product categories POST error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/bar-product-categories - Bulk update sort order
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) {
      return auth.response
    }

    const body = await request.json()
    const { categories } = body

    if (!Array.isArray(categories)) {
      return NextResponse.json({ error: 'Kategorien-Array erforderlich' }, { status: 400 })
    }

    const supabase = createServerSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i]
      if (!cat.id) continue

      const { error } = await (supabase as any)
        .from('bar_product_categories')
        .update({
          sort_order: typeof cat.sort_order === 'number' ? cat.sort_order : i,
          name: typeof cat.name === 'string' ? cat.name.trim() : undefined,
          active: typeof cat.active === 'boolean' ? cat.active : undefined,
        })
        .eq('id', cat.id)

      if (error) {
        console.error('Error updating bar product category:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Bar product categories PUT error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
