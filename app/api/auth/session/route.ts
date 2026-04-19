import { NextResponse } from 'next/server'
import { getCurrentUser, clearSessionCookie } from '@/lib/auth'

// GET /api/auth/session - Get current session
export async function GET() {
  try {
    const user = getCurrentUser()
    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json({ user: null })
  }
}

// DELETE /api/auth/session - Logout
export async function DELETE() {
  clearSessionCookie()
  return NextResponse.json({ success: true })
}
