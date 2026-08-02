import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: { id: string }
}

// DELETE /api/bar-product-categories/[id] - Deactivate category and migrate products
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) {
      return auth.response
    }

    const { id } = params
    if (!id) {
      return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })
    }

    const supabase = createServerSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    // Find the category slug
    const { data: category, error: fetchError } = await (supabase as any)
      .from('bar_product_categories')
      .select('slug')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching category for delete:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!category) {
      return NextResponse.json({ error: 'Kategorie nicht gefunden' }, { status: 404 })
    }

    // Ensure a fallback category exists
    const { data: fallback } = await (supabase as any)
      .from('bar_product_categories')
      .select('slug')
      .eq('slug', 'other')
      .single()

    if (!fallback) {
      return NextResponse.json(
        { error: 'Fallback-Kategorie "Sonstiges" nicht gefunden' },
        { status: 500 }
      )
    }

    // Migrate products using this category to fallback
    if (category.slug) {
      const { error: migrateError } = await (supabase as any)
        .from('bar_products')
        .update({ category: fallback.slug })
        .eq('category', category.slug)

      if (migrateError) {
        console.error('Error migrating products from deleted category:', migrateError)
        return NextResponse.json({ error: migrateError.message }, { status: 500 })
      }
    }

    // Deactivate the category (soft delete)
    const { error } = await (supabase as any)
      .from('bar_product_categories')
      .update({ active: false, sort_order: 9999 })
      .eq('id', id)

    if (error) {
      console.error('Error deactivating bar product category:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Bar product categories DELETE error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
