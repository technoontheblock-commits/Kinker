import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create client only if credentials are available
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey)
  : null

// Create a fresh client instance (for API routes and server components)
export const createClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  
  if (!url || !key) {
    throw new Error('Supabase credentials not configured')
  }
  
  return createSupabaseClient<Database>(url, key)
}

// Server-side Supabase client (for API routes)
export const createServerSupabase = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }
  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey)
}
