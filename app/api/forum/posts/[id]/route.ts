import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function getCurrentUser() {
  const session = cookies().get('user_session')?.value
  if (!session) return null
  try {
    return JSON.parse(session)
  } catch {
    return null
  }
}

function isAdmin(user: any) {
  return user?.role === 'admin'
}

// GET /api/forum/posts/[id] - Get single post with comments
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get post with subcategory and category info
    const { data: post, error: postError } = await supabase
      .from('forum_posts')
      .select(`
        *,
        subcategory:forum_subcategories(
          *,
          category:forum_categories(*)
        )
      `)
      .eq('id', id)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: 'Post nicht gefunden' }, { status: 404 })
    }

    // Get post author
    const { data: postUser } = await supabase
      .from('users')
      .select('name, email, avatar_url')
      .eq('id', post.user_id)
      .single()

    // Increment view count
    supabase.rpc('increment_post_view', { post_uuid: id }).catch(() => {})

    // Get comments
    const { data: comments, error: commentsError } = await supabase
      .from('forum_comments')
      .select('*')
      .eq('post_id', id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })

    if (commentsError) {
      console.error('Error fetching comments:', commentsError)
    }

    // Get comment authors
    const commentsWithUsers = await Promise.all(
      (comments || []).map(async (comment: any) => {
        const { data: userData } = await supabase
          .from('users')
          .select('name, email, avatar_url')
          .eq('id', comment.user_id)
          .single()
        
        return {
          ...comment,
          user: userData || { name: 'Anonym', email: '', avatar_url: null }
        }
      })
    )

    return NextResponse.json({
      post: {
        ...post,
        user: postUser || { name: 'Anonym', email: '', avatar_url: null }
      },
      comments: commentsWithUsers
    })

  } catch (error: any) {
    console.error('Error in post GET:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/forum/posts/[id] - Update post
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { title, content, is_pinned, is_locked } = body

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check ownership
    const { data: post } = await supabase
      .from('forum_posts')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!post) {
      return NextResponse.json({ error: 'Post nicht gefunden' }, { status: 404 })
    }

    // Only author or admin can edit
    if (post.user_id !== user.id && !isAdmin(user)) {
      return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 403 })
    }

    const updateData: any = { updated_at: new Date().toISOString() }
    if (title !== undefined) updateData.title = title.trim()
    if (content !== undefined) updateData.content = content.trim()
    
    // Only admin can pin/lock
    if (isAdmin(user)) {
      if (is_pinned !== undefined) updateData.is_pinned = is_pinned
      if (is_locked !== undefined) updateData.is_locked = is_locked
    }

    const { data, error } = await supabase
      .from('forum_posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ post: data })

  } catch (error: any) {
    console.error('Error in post PUT:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/forum/posts/[id] - Delete post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    const { id } = params
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check ownership
    const { data: post } = await supabase
      .from('forum_posts')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!post) {
      return NextResponse.json({ error: 'Post nicht gefunden' }, { status: 404 })
    }

    // Only author or admin can delete
    if (post.user_id !== user.id && !isAdmin(user)) {
      return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 403 })
    }

    const { error } = await supabase
      .from('forum_posts')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Error in post DELETE:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
