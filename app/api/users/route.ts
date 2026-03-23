import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Mock users for development without Supabase
let mockUsers = [
  { id: '1', name: 'Max Mustermann', email: 'max@example.com', role: 'user', status: 'active', created_at: '2024-01-15T00:00:00Z' },
  { id: '2', name: 'Anna Schmidt', email: 'anna@example.com', role: 'user', status: 'active', created_at: '2024-02-20T00:00:00Z' },
  { id: '3', name: 'John Doe', email: 'john@example.com', role: 'admin', status: 'active', created_at: '2023-12-01T00:00:00Z' },
  { id: '4', name: 'Lisa Müller', email: 'lisa@example.com', role: 'user', status: 'inactive', created_at: '2024-03-10T00:00:00Z' },
]

// GET /api/users - Get all users
export async function GET() {
  try {
    // Use Supabase if configured, otherwise use mock data
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('GET users error:', error)
        return NextResponse.json(mockUsers)
      }

      return NextResponse.json(data || mockUsers)
    }

    // Return mock data if Supabase is not configured
    return NextResponse.json(mockUsers)
  } catch (error: any) {
    console.error('GET users exception:', error)
    return NextResponse.json(mockUsers)
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Use Supabase if configured
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      
      const { data, error } = await supabase
        .from('users')
        .insert([{
          name: body.name,
          email: body.email,
          role: body.role || 'user',
          status: body.status || 'active',
        }])
        .select()
        .single()

      if (error) {
        console.error('POST user error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(data)
    }

    // Mock user creation if Supabase is not configured
    const newUser = {
      id: String(mockUsers.length + 1),
      name: body.name,
      email: body.email,
      role: body.role || 'user',
      status: body.status || 'active',
      created_at: new Date().toISOString(),
    }
    mockUsers.push(newUser)
    return NextResponse.json(newUser)
  } catch (error: any) {
    console.error('POST user exception:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
