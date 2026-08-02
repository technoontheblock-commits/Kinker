import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServerSupabase } from '@/lib/supabase'
import { generateBarOrderListPdfBuffer } from '@/lib/bar-order-list-pdf-buffer'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Load event
    const { data: event, error: eventError } = await (supabase as any)
      .from('bar_events')
      .select('*')
      .eq('id', id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: eventError?.message || 'Event nicht gefunden' }, { status: 500 })
    }

    // Load orders for this event
    const { data: orders, error: ordersError } = await (supabase as any)
      .from('bar_orders')
      .select('id')
      .eq('event_id', id)
      .eq('status', 'paid')

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 })
    }

    const orderIds = (orders || []).map((o: any) => o.id)

    let items: any[] = []
    if (orderIds.length > 0) {
      const { data: orderItems, error: itemsError } = await (supabase as any)
        .from('bar_order_items')
        .select('*')
        .in('order_id', orderIds)

      if (itemsError) {
        return NextResponse.json({ error: itemsError.message }, { status: 500 })
      }
      items = orderItems || []
    }

    // Aggregate by product name (snapshot at purchase time)
    const productIds = Array.from(new Set(items.map((i: any) => i.product_id).filter(Boolean)))

    let productCategories: Record<string, string> = {}
    if (productIds.length > 0) {
      const { data: products } = await (supabase as any)
        .from('bar_products')
        .select('id, category')
        .in('id', productIds)
      for (const p of products || []) {
        productCategories[p.id] = p.category || 'other'
      }
    }

    const productMap: Record<string, { name: string; quantity: number; total: number; category: string }> = {}
    for (const item of items) {
      const key = item.name
      if (!productMap[key]) {
        productMap[key] = {
          name: item.name,
          quantity: 0,
          total: 0,
          category: productCategories[item.product_id] || 'other',
        }
      }
      productMap[key].quantity += item.quantity || 0
      productMap[key].total += item.total || 0
    }

    // Load categories for grouping and labels
    const { data: categories } = await (supabase as any)
      .from('bar_product_categories')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true })

    const categoryMap: Record<string, string> = {}
    const categoryOrder: string[] = []
    for (const c of categories || []) {
      categoryMap[c.slug] = c.name
      categoryOrder.push(c.slug)
    }

    // Group products by category
    const grouped: Record<string, { name: string; quantity: number; total: number }[]> = {}
    for (const product of Object.values(productMap)) {
      const catSlug = product.category || 'other'
      if (!grouped[catSlug]) grouped[catSlug] = []
      grouped[catSlug].push(product)
    }

    // Sort categories by sort_order, then products by quantity desc
    const sortedCategories = Object.keys(grouped).sort((a, b) => {
      const orderA = categoryOrder.indexOf(a)
      const orderB = categoryOrder.indexOf(b)
      return (orderA === -1 ? 999 : orderA) - (orderB === -1 ? 999 : orderB)
    }).map(slug => ({
      name: categoryMap[slug] || slug,
      items: grouped[slug].sort((a, b) => b.quantity - a.quantity),
    }))

    const totalQuantity = Object.values(productMap).reduce((sum, p) => sum + p.quantity, 0)
    const totalRevenue = Object.values(productMap).reduce((sum, p) => sum + p.total, 0)

    const pdfBuffer = await generateBarOrderListPdfBuffer({
      eventName: event.name,
      eventDate: new Date(event.date).toLocaleDateString('de-CH'),
      createdAt: new Date().toLocaleString('de-CH', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      categories: sortedCategories,
      totalQuantity,
      totalRevenue,
      currency: 'CHF',
    })

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="bestellliste-${event.name.toLowerCase().replace(/\s+/g, '-')}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('Bar order list PDF error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
