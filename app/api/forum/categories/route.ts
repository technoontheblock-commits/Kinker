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

// Helper function to check if required tables exist
async function checkTablesExist(supabase: any) {
  try {
    // Check if forum_subcategories table exists
    const { error } = await supabase
      .from('forum_subcategories')
      .select('id')
      .limit(1)
    
    if (error && error.message.includes('does not exist')) {
      return {
        exists: false,
        missingTable: 'forum_subcategories',
        message: 'Die Tabelle "forum_subcategories" existiert nicht. Bitte führe das SQL-Script "supabase-forum-hierarchical.sql" in deiner Supabase-Datenbank aus.'
      }
    }
    return { exists: true }
  } catch (e: any) {
    return { 
      exists: false, 
      message: 'Fehler beim Überprüfen der Datenbanktabellen: ' + e.message 
    }
  }
}

// GET /api/forum/categories - Get all main categories with their subcategories
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { searchParams } = new URL(request.url)
    const withStats = searchParams.get('stats') === 'true'

    // Check if tables exist first
    const tableCheck = await checkTablesExist(supabase)
    if (!tableCheck.exists) {
      console.error('Forum tables missing:', tableCheck.message)
      return NextResponse.json({ 
        error: 'FORUM_SCHEMA_MISSING',
        message: tableCheck.message,
        details: 'Das Forum-System ist noch nicht eingerichtet. Bitte führe das SQL-Script "supabase-forum-hierarchical.sql" in deiner Supabase-Datenbank aus.'
      }, { status: 503 })
    }

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
      return NextResponse.json({ 
        error: 'DATABASE_ERROR',
        message: error.message,
        details: 'Fehler beim Abrufen der Kategorien aus der Datenbank.'
      }, { status: 500 })
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
    return NextResponse.json({ 
      error: 'SERVER_ERROR',
      message: error.message,
      details: 'Ein unerwarteter Fehler ist aufgetreten.'
    }, { status: 500 })
  }
}

// POST /api/forum/categories - Create main category (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!isAdmin(user)) {
      return NextResponse.json({ 
        error: 'FORBIDDEN',
        message: 'Nur Administratoren können Kategorien erstellen.'
      }, { status: 403 })
    }

    const body = await request.json()
    const { name, slug, description, icon, color, sort_order } = body

    if (!name || !slug) {
      return NextResponse.json(
        { 
          error: 'VALIDATION_ERROR',
          message: 'Name und Slug sind erforderlich.'
        },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if tables exist first
    const tableCheck = await checkTablesExist(supabase)
    if (!tableCheck.exists) {
      return NextResponse.json({ 
        error: 'FORUM_SCHEMA_MISSING',
        message: tableCheck.message,
        details: 'Das Forum-System ist noch nicht eingerichtet. Bitte führe das SQL-Script "supabase-forum-hierarchical.sql" in deiner Supabase-Datenbank aus.'
      }, { status: 503 })
    }

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
      if (error.message.includes('unique constraint')) {
        return NextResponse.json({ 
          error: 'DUPLICATE_SLUG',
          message: 'Ein Kategorie mit diesem Slug existiert bereits.',
          details: 'Bitte wähle einen eindeutigen Slug.'
        }, { status: 409 })
      }
      return NextResponse.json({ 
        error: 'DATABASE_ERROR',
        message: error.message,
        details: 'Fehler beim Erstellen der Kategorie.'
      }, { status: 500 })
    }

    return NextResponse.json({ category: data }, { status: 201 })

  } catch (error: any) {
    console.error('Error in categories POST:', error)
    return NextResponse.json({ 
      error: 'SERVER_ERROR',
      message: error.message,
      details: 'Ein unerwarteter Fehler ist aufgetreten.'
    }, { status: 500 })
  }
}

// PUT /api/forum/categories - Update category (admin only)
export async function PUT(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!isAdmin(user)) {
      return NextResponse.json({ 
        error: 'FORBIDDEN',
        message: 'Nur Administratoren können Kategorien bearbeiten.'
      }, { status: 403 })
    }

    const body = await request.json()
    const { id, name, description, icon, color, sort_order, is_active } = body

    if (!id) {
      return NextResponse.json({ 
        error: 'VALIDATION_ERROR',
        message: 'ID ist erforderlich.'
      }, { status: 400 })
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
      return NextResponse.json({ 
        error: 'DATABASE_ERROR',
        message: error.message,
        details: 'Fehler beim Aktualisieren der Kategorie.'
      }, { status: 500 })
    }

    return NextResponse.json({ category: data })

  } catch (error: any) {
    console.error('Error in categories PUT:', error)
    return NextResponse.json({ 
      error: 'SERVER_ERROR',
      message: error.message,
      details: 'Ein unerwarteter Fehler ist aufgetreten.'
    }, { status: 500 })
  }
}

// DELETE /api/forum/categories - Delete category (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const user = getCurrentUser()
    if (!isAdmin(user)) {
      return NextResponse.json({ 
        error: 'FORBIDDEN',
        message: 'Nur Administratoren können Kategorien löschen.'
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ 
        error: 'VALIDATION_ERROR',
        message: 'ID ist erforderlich.'
      }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { error } = await supabase
      .from('forum_categories')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ 
        error: 'DATABASE_ERROR',
        message: error.message,
        details: 'Fehler beim Löschen der Kategorie.'
      }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Error in categories DELETE:', error)
    return NextResponse.json({ 
      error: 'SERVER_ERROR',
      message: error.message,
      details: 'Ein unerwarteter Fehler ist aufgetreten.'
    }, { status: 500 })
  }
}
