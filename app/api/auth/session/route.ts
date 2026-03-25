import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

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

// DELETE /api/auth/session - Logout
export async function DELETE() {
  cookies().delete('user_session')
  return NextResponse.json({ success: true })
}
