import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// POST /api/auth/login - Login user
export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { email, password } = body

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check scanner_users for staff login
    const { data: scannerUser } = await supabase
      .from('scanner_users')
      .select('*')
      .eq('email', email)
      .eq('password_hash', password) // In production: use bcrypt
      .eq('active', true)
      .single()

    if (scannerUser) {
      // Update last login
      await supabase
        .from('scanner_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', scannerUser.id)

      // Set session cookie
      cookies().set('user_session', JSON.stringify({
        id: scannerUser.id,
        email: scannerUser.email,
        name: scannerUser.name,
        role: scannerUser.role,
        type: 'staff'
      }), {
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
      })

      return NextResponse.json({
        user: {
          id: scannerUser.id,
          email: scannerUser.email,
          name: scannerUser.name,
          role: scannerUser.role
        },
        role: scannerUser.role
      })
    }

    // Check regular users table
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('status', 'active')
      .single()

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Set session cookie
    cookies().set('user_session', JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      type: 'user'
    }), {
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      role: user.role
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET /api/auth/session - Get current session
export async function GET() {
  try {
    const session = cookies().get('user_session')?.value
    
    if (!session) {
      return NextResponse.json({ user: null })
    }

    const userData = JSON.parse(session)
    return NextResponse.json({ user: userData })
  } catch (error) {
    return NextResponse.json({ user: null })
  }
}

// DELETE /api/auth/logout - Logout
export async function DELETE() {
  cookies().delete('user_session')
  return NextResponse.json({ success: true })
}
