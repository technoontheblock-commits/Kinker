import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/auth'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''



function isAdmin(user: any) {
  return user?.role === 'admin'
}

// GET /api/forum/subcategories - Get subcategories
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('category')
    const subcategoryId = searchParams.get('id')

    // Get specific subcategory
    if (subcategoryId) {
      const { data: subcategory, error } = await supabase
        .from('forum_subcategories')
        .select(`
          *,
          category:forum_categories(*)
        `)
        .eq('id', subcategoryId)
        .eq('is_active', true)
        .single()

      if (error || !subcategory) {
        return NextResponse.json({ error: 'Unterkategorie nicht gefunden' }, { status: 404 })
      }

      // Get post count
      const { count } = await supabase
        .from('forum_posts')
        .select('*', { count: 'exact', head: true })
        .eq('subcategory_id', subcategoryId)

      return NextResponse.json({
        subcategory: { ...subcategory, post_count: count || 0 }
      })
    }

    // Get subcategories by category
    let query = supabase
      .from('forum_subcategories')
      .select(`
        *,
        category:forum_categories(name, slug, color),
        post_count:forum_posts(count)
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data: subcategories, error } = await query

    if (error) {
      console.error('Error fetching subcategories:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform data
    const transformedSubcategories = subcategories?.map((sub: any) => ({
      ...sub,
      post_count: sub.post_count?.[0]?.count || 0
    }))

    return NextResponse.json({ subcategories: transformedSubcategories })

  } catch (error: any) {
    console.error('Error in subcategories GET:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/forum/subcategories - Create subcategory (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!isAdmin(user)) {
      return NextResponse.json({ error: 'Nur Admin' }, { status: 403 })
    }

    const body = await request.json()
    const { category_id, name, slug, description, icon, sort_order } = body

    if (!category_id || !name || !slug) {
      return NextResponse.json(
        { error: 'Category ID, Name und Slug sind erforderlich' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from('forum_subcategories')
      .insert({
        category_id,
        name,
        slug,
        description: description || null,
        icon: icon || 'MessageSquare',
        sort_order: sort_order || 0
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating subcategory:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ subcategory: data }, { status: 201 })

  } catch (error: any) {
    console.error('Error in subcategories POST:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/forum/subcategories - Update subcategory (admin only)
export async function PUT(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!isAdmin(user)) {
      return NextResponse.json({ error: 'Nur Admin' }, { status: 403 })
    }

    const body = await request.json()
    const { id, name, description, icon, sort_order, is_active } = body

    if (!id) {
      return NextResponse.json({ error: 'ID erforderlich' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const updateData: any = { updated_at: new Date().toISOString() }
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (icon !== undefined) updateData.icon = icon
    if (sort_order !== undefined) updateData.sort_order = sort_order
    if (is_active !== undefined) updateData.is_active = is_active

    const { data, error } = await supabase
      .from('forum_subcategories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ subcategory: data })

  } catch (error: any) {
    console.error('Error in subcategories PUT:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/forum/subcategories - Delete subcategory (admin only)
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
      .from('forum_subcategories')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Error in subcategories DELETE:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
