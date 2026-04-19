import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function isAdmin(user: any) {
  return user?.role === 'admin'
}

// GET /api/forum/posts - Get posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subcategoryId = searchParams.get('subcategory')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get posts for a subcategory
    if (subcategoryId) {
      const { data: posts, error, count } = await supabase
        .from('forum_posts')
        .select(`
          *,
          subcategory:forum_subcategories(name, slug, category:forum_categories(name, slug))
        `, { count: 'exact' })
        .eq('subcategory_id', subcategoryId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error fetching posts:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }

      // Get user IDs and fetch all users in one query
      const userIds = Array.from(new Set((posts || []).map((p: any) => p.user_id).filter(Boolean)))
      const { data: allUsers } = await supabase
        .from('users')
        .select('id, name, email, avatar_url')
        .in('id', userIds)
      
      const userMap = new Map((allUsers || []).map((u: any) => [u.id, u]))

      // Get comment counts in one query
      const postIds = (posts || []).map((p: any) => p.id)
      const { data: commentCounts } = await supabase
        .from('forum_comments')
        .select('post_id', { count: 'exact' })
        .in('post_id', postIds)
        .eq('is_deleted', false)
      
      const countMap = new Map()
      ;(commentCounts || []).forEach((c: any) => {
        countMap.set(c.post_id, (countMap.get(c.post_id) || 0) + 1)
      })

      const postsWithDetails = (posts || []).map((post: any) => ({
        ...post,
        user: userMap.get(post.user_id) || { name: 'Anonym', email: '', avatar_url: null },
        comment_count: countMap.get(post.id) || 0
      }))

      return NextResponse.json({ 
        posts: postsWithDetails, 
        total: count,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      })
    }

    // Get all recent posts (for homepage/activity feed)
    const { data: posts, error } = await supabase
      .from('forum_posts')
      .select(`
        *,
        subcategory:forum_subcategories(name, slug, category:forum_categories(name, slug, color))
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching posts:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    // Get all users in one query
    const userIds = Array.from(new Set((posts || []).map((p: any) => p.user_id).filter(Boolean)))
    const { data: allUsers } = await supabase
      .from('users')
      .select('id, name, email, avatar_url')
      .in('id', userIds)
    
    const userMap = new Map((allUsers || []).map((u: any) => [u.id, u]))

    const postsWithUsers = (posts || []).map((post: any) => ({
      ...post,
      user: userMap.get(post.user_id) || { name: 'Anonym', email: '', avatar_url: null }
    }))

    return NextResponse.json({ posts: postsWithUsers })

  } catch (error: any) {
    console.error('Error in posts GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/forum/posts - Create new post
export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, subcategory_id } = body

    if (!title || !content || !subcategory_id) {
      return NextResponse.json(
        { error: 'Titel, Inhalt und Unterkategorie sind erforderlich' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if subcategory exists and is active
    const { data: subcategory, error: subError } = await supabase
      .from('forum_subcategories')
      .select('*')
      .eq('id', subcategory_id)
      .eq('is_active', true)
      .single()

    if (subError || !subcategory) {
      return NextResponse.json(
        { error: 'Unterkategorie nicht gefunden' },
        { status: 404 }
      )
    }

    const { data, error } = await supabase
      .from('forum_posts')
      .insert({
        title: title.trim(),
        content: content.trim(),
        subcategory_id,
        user_id: user.id
      })
      .select(`
        *,
        subcategory:forum_subcategories(name, slug, category:forum_categories(name, slug))
      `)
      .single()

    if (error) {
      console.error('Error creating post:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    // Get user info
    const { data: userData } = await supabase
      .from('users')
      .select('name, email, avatar_url')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      post: {
        ...data,
        user: userData || { name: 'Anonym', email: '', avatar_url: null },
        comment_count: 0
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error in posts POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/forum/posts - Update post
export async function PUT(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    const body = await request.json()
    const { id, title, content, is_locked } = body

    if (!id) {
      return NextResponse.json({ error: 'ID erforderlich' }, { status: 400 })
    }

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

    // Only admin can lock/unlock
    const updateData: any = { updated_at: new Date().toISOString() }
    if (title !== undefined) updateData.title = title.trim()
    if (content !== undefined) updateData.content = content.trim()
    if (is_locked !== undefined && isAdmin(user)) updateData.is_locked = is_locked

    const { data, error } = await supabase
      .from('forum_posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ post: data })

  } catch (error: any) {
    console.error('Error in posts PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/forum/posts - Delete post
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
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Error in posts DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
