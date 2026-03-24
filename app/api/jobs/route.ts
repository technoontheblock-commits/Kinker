import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// GET /api/jobs - Get all jobs with applicant count
export async function GET() {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get jobs with applicant count
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('GET jobs error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get applicant counts for each job
    const { data: applications, error: appError } = await supabase
      .from('job_applications')
      .select('job_id')

    if (appError) {
      console.error('GET applications error:', appError)
    }

    // Count applications per job
    const applicantCounts: { [key: string]: number } = {}
    applications?.forEach((app: any) => {
      applicantCounts[app.job_id] = (applicantCounts[app.job_id] || 0) + 1
    })

    // Add applicant count to each job
    const jobsWithCounts = jobs?.map((job: any) => ({
      ...job,
      applicants: applicantCounts[job.id] || 0
    }))

    return NextResponse.json(jobsWithCounts || [])
  } catch (error: any) {
    console.error('GET jobs exception:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// POST /api/jobs - Create new job
export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    
    const body = await request.json()
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data, error } = await supabase
      .from('jobs')
      .insert([{
        title: body.title,
        department: body.department,
        type: body.type,
        location: body.location,
        description: body.description,
        status: 'Active'
      }])
      .select()
      .single()

    if (error) {
      console.error('POST job error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('POST job exception:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
