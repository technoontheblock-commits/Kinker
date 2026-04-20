import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// GET /api/dj-roster - Get all DJ applications (admin only)
export async function GET() {
  try {
    const user = getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from('dj_applications')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/dj-roster - Submit new DJ application (public, no auth required)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const requiredFields = ['artist_name', 'first_name', 'last_name', 'email', 'presskit_url']
    for (const field of requiredFields) {
      if (!body[field] || String(body[field]).trim() === '') {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Validate image size (base64 max ~2MB)
    if (body.artist_image && body.artist_image.length > 3_000_000) {
      return NextResponse.json({ error: 'Image too large. Max 2MB allowed.' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from('dj_applications')
      .insert({
        artist_name: body.artist_name.trim(),
        first_name: body.first_name.trim(),
        last_name: body.last_name.trim(),
        age: body.age ? parseInt(body.age) : null,
        city: body.city?.trim() || null,
        country: body.country?.trim() || null,
        email: body.email.trim().toLowerCase(),
        phone: body.phone?.trim() || null,
        country_code: body.country_code?.trim() || null,
        genre: body.genre?.trim() || null,
        experience: body.experience?.trim() || null,
        artist_image: body.artist_image || null,
        instagram: body.instagram?.trim() || null,
        soundcloud: body.soundcloud?.trim() || null,
        presskit_url: body.presskit_url.trim(),
        standard_gage: body.standard_gage?.trim() || null,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('DJ roster insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, application: data })
  } catch (error: any) {
    console.error('DJ roster POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
