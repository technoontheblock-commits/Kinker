import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getPrintfulOrders, getPrintfulOrder } from '@/lib/printful'
import { requireAdmin } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const dynamic = 'force-dynamic'

// GET /api/printful/orders - List Printful orders
export async function GET() {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) return auth.response

    const data = await getPrintfulOrders()
    return NextResponse.json(data.data || [])
  } catch (error: any) {
    console.error('Printful orders error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
