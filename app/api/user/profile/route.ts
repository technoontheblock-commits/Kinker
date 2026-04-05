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
    
    // Get user data from users table
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: userData?.name || user.name || '',
      phone: userData?.phone || '',
      avatar_url: userData?.avatar_url || user.avatar_url || null,
      created_at: userData?.created_at || user.created_at,
      updated_at: userData?.updated_at || null
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
    const { name, phone, address, preferences, date_of_birth, newsletter_opt_in, avatar_url } = body

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
    if (avatar_url !== undefined) updates.avatar_url = avatar_url

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update session cookie if name or avatar changed
    if (name || avatar_url) {
      const updatedUser = { ...user, name, avatar_url }
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
