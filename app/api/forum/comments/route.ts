import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/auth'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''



function isAdmin(user: any) {
  return user?.role === 'admin'
}

// POST /api/forum/comments - Create new comment
export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    const body = await request.json()
    const { content, post_id, parent_id } = body

    if (!content || !post_id) {
      return NextResponse.json(
        { error: 'Inhalt und Post ID sind erforderlich' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if post exists and is not locked
    const { data: post, error: postError } = await supabase
      .from('forum_posts')
      .select('is_locked')
      .eq('id', post_id)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: 'Post nicht gefunden' }, { status: 404 })
    }

    if (post.is_locked) {
      return NextResponse.json(
        { error: 'Dieser Post ist geschlossen' },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('forum_comments')
      .insert({
        content: content.trim(),
        post_id,
        user_id: user.id,
        parent_id: parent_id || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating comment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get user info
    const { data: userData } = await supabase
      .from('users')
      .select('name, email, avatar_url')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      comment: {
        ...data,
        user: userData || { name: 'Anonym', email: '', avatar_url: null }
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error in comments POST:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/forum/comments - Update comment
export async function PUT(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    const body = await request.json()
    const { id, content } = body

    if (!id || !content) {
      return NextResponse.json(
        { error: 'ID und Inhalt sind erforderlich' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check ownership
    const { data: comment } = await supabase
      .from('forum_comments')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!comment) {
      return NextResponse.json({ error: 'Kommentar nicht gefunden' }, { status: 404 })
    }

    if (comment.user_id !== user.id && !isAdmin(user)) {
      return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('forum_comments')
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ comment: data })

  } catch (error: any) {
    console.error('Error in comments PUT:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/forum/comments - Delete comment
export async function DELETE(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID erforderlich' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check ownership
    const { data: comment } = await supabase
      .from('forum_comments')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!comment) {
      return NextResponse.json({ error: 'Kommentar nicht gefunden' }, { status: 404 })
    }

    // Only author or admin can delete
    if (comment.user_id !== user.id && !isAdmin(user)) {
      return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 403 })
    }

    // Soft delete for regular users, hard delete for admin
    if (isAdmin(user)) {
      const { error } = await supabase
        .from('forum_comments')
        .delete()
        .eq('id', id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      const { error } = await supabase
        .from('forum_comments')
        .update({ is_deleted: true })
        .eq('id', id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Error in comments DELETE:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
