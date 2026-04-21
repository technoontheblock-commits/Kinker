import { NextRequest, NextResponse } from 'next/server'
import { getPrintfulProducts, getPrintfulProduct } from '@/lib/printful'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/printful/products - List Printful store products
export async function GET() {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) return auth.response

    const data = await getPrintfulProducts()
    return NextResponse.json(data.data || [])
  } catch (error: any) {
    console.error('Printful products error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
