import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// POST /api/forum/reactions - Add or toggle a reaction
export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    const body = await request.json()
    const { post_id, emoji } = body

    if (!post_id || !emoji) {
      return NextResponse.json({ error: 'Post ID und Emoji erforderlich' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if reaction already exists
    const { data: existing } = await supabase
      .from('post_reactions')
      .select('id')
      .eq('post_id', post_id)
      .eq('user_id', user.id)
      .eq('emoji', emoji)
      .single()

    if (existing) {
      // Remove reaction (toggle off)
      const { error } = await supabase
        .from('post_reactions')
        .delete()
        .eq('id', existing.id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ added: false, emoji })
    }

    // Add reaction
    const { data, error } = await supabase
      .from('post_reactions')
      .insert({ post_id, user_id: user.id, emoji })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ added: true, reaction: data })

  } catch (error: any) {
    console.error('Error in reaction POST:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
