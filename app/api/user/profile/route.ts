import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function getCurrentUser() {
  const session = cookies().get('user_session')?.value
  if (!session) return null
  return JSON.parse(session)
}

// GET /api/user/profile - Get user profile
export async function GET() {
  try {
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get user profile
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: profile?.name || user.name || '',
      phone: profile?.phone || '',
      address: profile?.address || {},
      preferences: profile?.preferences || {},
      date_of_birth: profile?.date_of_birth || null,
      newsletter_opt_in: profile?.newsletter_opt_in ?? true,
      created_at: profile?.created_at || user.created_at,
      updated_at: profile?.updated_at || null
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/user/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { name, phone, address, preferences, date_of_birth, newsletter_opt_in } = body

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const updates: any = {
      id: user.id,
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updates.name = name
    if (phone !== undefined) updates.phone = phone
    if (address !== undefined) updates.address = address
    if (preferences !== undefined) updates.preferences = preferences
    if (date_of_birth !== undefined) updates.date_of_birth = date_of_birth
    if (newsletter_opt_in !== undefined) updates.newsletter_opt_in = newsletter_opt_in

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(updates)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update session cookie if name changed
    if (name) {
      const updatedUser = { ...user, name }
      cookies().set('user_session', JSON.stringify(updatedUser), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })
    }

    return NextResponse.json({ success: true, profile: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/user/profile - Delete account
export async function DELETE() {
  try {
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Delete user data (cascade will handle related records)
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', user.id)

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Delete auth user (requires admin privileges)
    const { error: authError } = await supabase.auth.admin.deleteUser(user.id)

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // Clear session
    cookies().delete('user_session')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
