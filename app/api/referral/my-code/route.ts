import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function generateCodeFromName(name: string): string {
  const prefix = name.trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'USER'
  const year = new Date().getFullYear()
  const random = randomBytes(2).toString('hex').toUpperCase()
  return `${prefix}-${year}-${random}`
}

export async function GET(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const cookieStore = cookies()
    const userSession = cookieStore.get('user_session')?.value

    if (!userSession) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    let userId: string
    let userName: string
    try {
      const user = JSON.parse(userSession)
      userId = user.id
      userName = user.name || 'USER'
      if (!userId) throw new Error('No user id')
    } catch {
      return NextResponse.json({ error: 'Ungültige Session' }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if user already has a referral code
    const { data: existingCode } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (existingCode) {
      // Get total points earned
      const { data: pointsData } = await supabase
        .from('referral_points')
        .select('points')
        .eq('user_id', userId)

      const totalPoints = pointsData?.reduce((sum, p) => sum + p.points, 0) || 0

      return NextResponse.json({
        code: existingCode.code,
        total_points: totalPoints
      })
    }

    // Generate unique code
    let code = generateCodeFromName(userName)
    let attempts = 0
    let isUnique = false

    while (!isUnique && attempts < 10) {
      const { data: existing } = await supabase
        .from('referral_codes')
        .select('id')
        .eq('code', code)
        .single()

      if (!existing) {
        isUnique = true
      } else {
        const random = randomBytes(2).toString('hex').toUpperCase()
        code = `${code.split('-').slice(0, 2).join('-')}-${random}`
        attempts++
      }
    }

    if (!isUnique) {
      return NextResponse.json({ error: 'Code konnte nicht generiert werden' }, { status: 500 })
    }

    const { data: newCode, error: insertError } = await supabase
      .from('referral_codes')
      .insert([{ user_id: userId, code }])
      .select()
      .single()

    if (insertError || !newCode) {
      console.error('Referral code creation error:', insertError)
      return NextResponse.json({ error: 'Code konnte nicht erstellt werden' }, { status: 500 })
    }

    return NextResponse.json({
      code: newCode.code,
      total_points: 0
    })
  } catch (error) {
    console.error('Referral my-code error:', error)
    return NextResponse.json({ error: 'Ein unerwarteter Fehler ist aufgetreten' }, { status: 500 })
  }
}
