import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerSupabase } from './supabase'
import crypto from 'crypto'

const SESSION_SECRET = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-dev-secret-change-in-production'
const COOKIE_NAME = 'user_session'

export interface SessionUser {
  id: string
  email: string
  name: string
  role: string
  type: 'user' | 'staff'
  avatar_url?: string | null
  created_at?: string
  updated_at?: string
  phone?: string
}

function signPayload(payload: string): string {
  return crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url')
}

export function createSignedSession(user: SessionUser): string {
  const payload = Buffer.from(JSON.stringify(user)).toString('base64url')
  const signature = signPayload(payload)
  return `${payload}.${signature}`
}

export function verifySignedSession(token: string): SessionUser | null {
  try {
    const [payload, signature] = token.split('.')
    if (!payload || !signature) return null

    const expectedSignature = signPayload(payload)
    // Timing-safe comparison
    if (!crypto.timingSafeEqual(
      Buffer.from(signature, 'base64url'),
      Buffer.from(expectedSignature, 'base64url')
    )) {
      return null
    }

    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as SessionUser
  } catch {
    return null
  }
}

export function getCurrentUser(): SessionUser | null {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySignedSession(token)
}

export function setSessionCookie(user: SessionUser): void {
  const token = createSignedSession(user)
  cookies().set(COOKIE_NAME, token, {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  })
}

export function clearSessionCookie(): void {
  cookies().delete(COOKIE_NAME)
}

export function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function forbidden(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 })
}

export async function requireAdmin() {
  const user = getCurrentUser()
  if (!user) {
    return { authorized: false as const, response: unauthorized('Not authenticated') }
  }

  // Verify user still exists and has admin role in database
  const supabase = createServerSupabase()
  if (!supabase) {
    return { authorized: false as const, response: NextResponse.json({ error: 'Server not configured' }, { status: 500 }) }
  }

  let dbUser: any = null
  
  if (user.type === 'staff') {
    const { data } = await supabase
      .from('scanner_users')
      .select('role, active')
      .eq('id', user.id)
      .single()
    dbUser = data
  } else {
    const { data } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', user.id)
      .single()
    dbUser = data
  }

  const isActive = user.type === 'staff' ? dbUser?.active === true : dbUser?.status === 'active'
  
  if (!dbUser || dbUser.role !== 'admin' || !isActive) {
    return { authorized: false as const, response: forbidden('Admin access required') }
  }

  return { authorized: true as const, user }
}

export async function requireAuth() {
  const user = getCurrentUser()
  if (!user) {
    return { authorized: false as const, response: unauthorized('Not authenticated') }
  }

  // Verify user still exists and is active
  const supabase = createServerSupabase()
  if (!supabase) {
    return { authorized: false as const, response: NextResponse.json({ error: 'Server not configured' }, { status: 500 }) }
  }

  let dbUser: any = null
  
  if (user.type === 'staff') {
    const { data } = await supabase
      .from('scanner_users')
      .select('active')
      .eq('id', user.id)
      .single()
    dbUser = data
  } else {
    const { data } = await supabase
      .from('users')
      .select('status')
      .eq('id', user.id)
      .single()
    dbUser = data
  }

  const isActive = user.type === 'staff' ? dbUser?.active === true : dbUser?.status === 'active'
  
  if (!dbUser || !isActive) {
    return { authorized: false as const, response: unauthorized('Session invalid') }
  }

  return { authorized: true as const, user }
}
