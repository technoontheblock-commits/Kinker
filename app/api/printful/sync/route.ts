import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getPrintfulProducts, getPrintfulProduct } from '@/lib/printful'
import { requireAdmin } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const dynamic = 'force-dynamic'

// POST /api/printful/sync - Sync Printful products to local DB
export async function POST() {
  // Debug step 1: immediate response test
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized', detail: 'Admin required' }, { status: 401 })
    }

    // Debug step 2: check env
    const token = process.env.PRINTFUL_API_TOKEN
    const storeId = process.env.PRINTFUL_STORE_ID
    if (!token) {
      return NextResponse.json({ error: 'PRINTFUL_API_TOKEN not set' }, { status: 500 })
    }
    if (!storeId) {
      return NextResponse.json({ error: 'PRINTFUL_STORE_ID not set' }, { status: 500 })
    }

    // Debug step 3: fetch from Printful
    let productsData
    try {
      productsData = await getPrintfulProducts()
    } catch (e: any) {
      return NextResponse.json({ error: 'Printful API failed', detail: e.message }, { status: 500 })
    }

    const products = productsData?.result || []

    if (products.length === 0) {
      return NextResponse.json({ success: true, synced: 0, products: [], message: 'No products in Printful store' })
    }

    // Debug step 4: connect to Supabase
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const synced = []

    for (const product of products) {
      let detail
      try {
        detail = await getPrintfulProduct(product.id)
      } catch (e: any) {
        return NextResponse.json({ error: 'Failed to fetch product detail', productId: product.id, detail: e.message }, { status: 500 })
      }

      const syncProduct = detail?.result?.sync_product || {}
      const syncVariants = detail?.result?.sync_variants || []

      const variants = syncVariants.map((v: any) => ({
        id: v.id,
        variant_id: v.variant_id,
        name: v.name,
        sku: v.sku,
        price: v.retail_price,
        size: v.size || '',
        color: v.color || '',
        image: v.product?.image || v.files?.[0]?.preview_url || product.thumbnail_url,
      }))

      const { data, error } = await supabase
        .from('printful_products')
        .upsert({
          printful_id: product.id,
          name: product.name,
          description: syncProduct.description || '',
          thumbnail_url: product.thumbnail_url,
          variants: variants,
          synced_at: new Date().toISOString(),
        }, { onConflict: 'printful_id' })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: 'Supabase upsert failed', detail: error }, { status: 500 })
      }
      synced.push(data)
    }

    return NextResponse.json({
      success: true,
      synced: synced.length,
      products: synced,
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Top-level catch', detail: error?.message || String(error) }, { status: 500 })
  }
}
