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

// GET /api/forum/categories - Get all main categories with their subcategories
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { searchParams } = new URL(request.url)
    const withStats = searchParams.get('stats') === 'true'

    // Get all categories with subcategories
    const { data: categories, error } = await supabase
      .from('forum_categories')
      .select(`
        *,
        subcategories:forum_subcategories(
          *,
          post_count:forum_posts(count)
        )
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform data - calculate stats
    const transformedCategories = categories?.map((cat: any) => ({
      ...cat,
      subcategories: cat.subcategories?.map((sub: any) => ({
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
        description: sub.description,
        icon: sub.icon,
        sort_order: sub.sort_order,
        is_active: sub.is_active,
        created_at: sub.created_at,
        post_count: sub.post_count?.[0]?.count || 0
      })) || [],
      total_posts: cat.subcategories?.reduce((sum: number, sub: any) => 
        sum + (sub.post_count?.[0]?.count || 0), 0) || 0,
      subcategory_count: cat.subcategories?.length || 0
    }))

    return NextResponse.json({ categories: transformedCategories })

  } catch (error: any) {
    console.error('Error in categories GET:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/forum/categories - Create main category (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!isAdmin(user)) {
      return NextResponse.json({ error: 'Nur Admin' }, { status: 403 })
    }

    const body = await request.json()
    const { name, slug, description, icon, color, sort_order } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name und Slug sind erforderlich' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from('forum_categories')
      .insert({
        name,
        slug,
        description: description || null,
        icon: icon || 'Folder',
        color: color || '#FF4D00',
        sort_order: sort_order || 0
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating category:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ category: data }, { status: 201 })

  } catch (error: any) {
    console.error('Error in categories POST:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/forum/categories - Update category (admin only)
export async function PUT(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!isAdmin(user)) {
      return NextResponse.json({ error: 'Nur Admin' }, { status: 403 })
    }

    const body = await request.json()
    const { id, name, description, icon, color, sort_order, is_active } = body

    if (!id) {
      return NextResponse.json({ error: 'ID erforderlich' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const updateData: any = { updated_at: new Date().toISOString() }
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (icon !== undefined) updateData.icon = icon
    if (color !== undefined) updateData.color = color
    if (sort_order !== undefined) updateData.sort_order = sort_order
    if (is_active !== undefined) updateData.is_active = is_active

    const { data, error } = await supabase
      .from('forum_categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ category: data })

  } catch (error: any) {
    console.error('Error in categories PUT:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/forum/categories - Delete category (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!isAdmin(user)) {
      return NextResponse.json({ error: 'Nur Admin' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID erforderlich' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { error } = await supabase
      .from('forum_categories')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Error in categories DELETE:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
