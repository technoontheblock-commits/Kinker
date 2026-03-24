import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// GET /api/applications - Get all job applications
export async function GET(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    let query = supabase
      .from('job_applications')
      .select('*, jobs(title)')
      .order('created_at', { ascending: false })
    
    if (jobId) {
      query = query.eq('job_id', jobId)
    }
    
    const { data, error } = await query

    if (error) {
      console.error('GET applications error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('GET applications exception:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// POST /api/applications - Create new job application
export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    
    const body = await request.json()
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data, error } = await supabase
      .from('job_applications')
      .insert([{
        job_id: body.jobId,
        name: body.name,
        email: body.email,
        phone: body.phone,
        message: body.message,
        cv_url: body.cvUrl,
        status: 'new'
      }])
      .select()
      .single()

    if (error) {
      console.error('POST application error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get job title for notification
    const { data: job } = await supabase
      .from('jobs')
      .select('title')
      .eq('id', body.jobId)
      .single()

    // Create notification for admin
    await supabase.from('notifications').insert([{
      type: 'career',
      title: 'Neue Bewerbung',
      message: `Bewerbung als ${job?.title || 'Position'} von ${body.name}`,
      read: false
    }])

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('POST application exception:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
