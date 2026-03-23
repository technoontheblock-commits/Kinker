import { NextResponse } from 'next/server'

// Mock user data - in production this would come from a database
let users = [
  { id: 1, name: 'Max Mustermann', email: 'max@example.com', role: 'User', status: 'Active', joined: '2024-01-15' },
  { id: 2, name: 'Anna Schmidt', email: 'anna@example.com', role: 'User', status: 'Active', joined: '2024-02-20' },
  { id: 3, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active', joined: '2023-12-01' },
]

export async function GET() {
  return NextResponse.json(users)
}

export async function POST(request: Request) {
  const data = await request.json()
  const newUser = {
    id: users.length + 1,
    ...data,
    joined: new Date().toISOString().split('T')[0],
  }
  users.push(newUser)
  return NextResponse.json(newUser, { status: 201 })
}

export async function DELETE(request: Request) {
  const { id } = await request.json()
  users = users.filter(u => u.id !== id)
  return NextResponse.json({ success: true })
}
