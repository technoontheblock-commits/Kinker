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

// GET /api/applications/user - Get user's job applications
export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: applications, error } = await supabase
      .from('job_applications')
      .select(`
        *,
        job:jobs(title, department)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching applications:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ applications: applications || [] })
  } catch (error: any) {
    console.error('Error fetching applications:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
