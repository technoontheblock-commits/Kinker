import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Mock users storage (shared with main route)
let mockUsers = [
  { id: '1', name: 'Max Mustermann', email: 'max@example.com', role: 'user', status: 'active', created_at: '2024-01-15T00:00:00Z' },
  { id: '2', name: 'Anna Schmidt', email: 'anna@example.com', role: 'user', status: 'active', created_at: '2024-02-20T00:00:00Z' },
  { id: '3', name: 'John Doe', email: 'john@example.com', role: 'admin', status: 'active', created_at: '2023-12-01T00:00:00Z' },
  { id: '4', name: 'Lisa Müller', email: 'lisa@example.com', role: 'user', status: 'inactive', created_at: '2024-03-10T00:00:00Z' },
]

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // Use Supabase if configured
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      
      const updatePayload: any = {}
      
      if (body.name !== undefined) updatePayload.name = body.name
      if (body.email !== undefined) updatePayload.email = body.email
      if (body.role !== undefined) updatePayload.role = body.role
      if (body.status !== undefined) updatePayload.status = body.status
      
      updatePayload.updated_at = new Date().toISOString()
      
      const { data, error } = await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', params.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(data)
    }

    // Mock update if Supabase is not configured
    const userIndex = mockUsers.findIndex(u => u.id === params.id)
    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      ...(body.name !== undefined && { name: body.name }),
      ...(body.email !== undefined && { email: body.email }),
      ...(body.role !== undefined && { role: body.role }),
      ...(body.status !== undefined && { status: body.status }),
    }
    
    return NextResponse.json(mockUsers[userIndex])
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Use Supabase if configured
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', params.id)

      if (error) {
        console.error('DELETE user error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    // Mock delete if Supabase is not configured
    const userIndex = mockUsers.findIndex(u => u.id === params.id)
    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    mockUsers = mockUsers.filter(u => u.id !== params.id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE user exception:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
