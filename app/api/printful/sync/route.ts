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

    const productsData = await getPrintfulProducts()
    const products = productsData.data || []

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const synced = []

    for (const product of products) {
      // Get full product details with variants
      const detail = await getPrintfulProduct(product.id)
      const fullProduct = detail.data

      const variants = fullProduct.variants?.map((v: any) => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        price: v.retail_price,
        size: v.size,
        color: v.color,
        image: v.preview_url || v.file?.preview_url,
      })) || []

      const { data, error } = await supabase
        .from('printful_products')
        .upsert({
          printful_id: product.id,
          name: product.name,
          description: fullProduct.description || '',
          thumbnail_url: product.thumbnail_url || fullProduct.thumbnail_url,
          variants: variants,
          synced_at: new Date().toISOString(),
        }, { onConflict: 'printful_id' })
        .select()
        .single()

      if (!error) {
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
