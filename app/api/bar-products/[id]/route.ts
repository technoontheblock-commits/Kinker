import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: { id: string }
}

// PUT /api/bar-products/[id] - Update a bar product
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) {
      return auth.response
    }

    const { id } = params
    if (!id) {
      return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })
    }

    const body = await request.json()
    const { name, price, category, sort_order, active } = body

    const updateData: Record<string, any> = {}

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: 'Name ist erforderlich' }, { status: 400 })
      }
      updateData.name = name.trim()
    }

    if (price !== undefined) {
      if (typeof price !== 'number' || price < 0) {
        return NextResponse.json({ error: 'Ungültiger Preis' }, { status: 400 })
      }
      updateData.price = price
    }

    if (category !== undefined) {
      const validCategories = ['drink', 'shot', 'snack', 'other']
      if (!validCategories.includes(category)) {
        return NextResponse.json({ error: 'Ungültige Kategorie' }, { status: 400 })
      }
      updateData.category = category
    }

    if (sort_order !== undefined) {
      if (typeof sort_order !== 'number') {
        return NextResponse.json({ error: 'Ungültige Sortierung' }, { status: 400 })
      }
      updateData.sort_order = sort_order
    }

    if (active !== undefined) {
      if (typeof active !== 'boolean') {
        return NextResponse.json({ error: 'Ungültiger Aktiv-Status' }, { status: 400 })
      }
      updateData.active = active
    }

    const supabase = createServerSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const { data, error } = await (supabase as any)
      .from('bar_products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating bar product:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Produkt nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json({ product: data })
  } catch (error: any) {
    console.error('Bar products PUT error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/bar-products/[id] - Delete a bar product
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

    const { error } = await (supabase as any)
      .from('bar_products')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting bar product:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Bar products DELETE error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
