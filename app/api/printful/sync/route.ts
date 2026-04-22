import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getPrintfulProducts, getPrintfulProduct } from '@/lib/printful'
import { requireAdmin } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const dynamic = 'force-dynamic'

// POST /api/printful/sync - Sync Printful products to local DB
export async function POST() {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) return auth.response

    // Check env vars
    if (!process.env.PRINTFUL_API_TOKEN) {
      console.error('PRINTFUL_API_TOKEN not set')
      return NextResponse.json({ error: 'Printful API token not configured on server' }, { status: 500 })
    }
    if (!process.env.PRINTFUL_STORE_ID) {
      console.error('PRINTFUL_STORE_ID not set')
      return NextResponse.json({ error: 'Printful Store ID not configured on server' }, { status: 500 })
    }

    const productsData = await getPrintfulProducts()
    const products = productsData.result || []

    if (products.length === 0) {
      return NextResponse.json({ success: true, synced: 0, products: [] })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const synced = []

    for (const product of products) {
      // Get full product details with variants
      const detail = await getPrintfulProduct(product.id)
      const syncProduct = detail.result?.sync_product || {}
      const syncVariants = detail.result?.sync_variants || []

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
        console.error('Sync insert error:', error)
      } else {
        synced.push(data)
      }
    }

    return NextResponse.json({
      success: true,
      synced: synced.length,
      products: synced,
    })
  } catch (error: any) {
    console.error('Printful sync error:', error)
    return NextResponse.json({ error: error.message || 'Sync failed' }, { status: 500 })
  }
}
