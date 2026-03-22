export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          name: string
          date: string
          time: string
          end_time: string | null
          description: string
          full_description: string
          lineup: string[]
          image: string
          ticket_url: string
          type: 'clubnight' | 'festival' | 'special'
          price: string
          timetable: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          date: string
          time: string
          end_time?: string | null
          description: string
          full_description: string
          lineup: string[]
          image: string
          ticket_url: string
          type: 'clubnight' | 'festival' | 'special'
          price: string
          timetable?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          date?: string
          time?: string
          end_time?: string | null
          description?: string
          full_description?: string
          lineup?: string[]
          image?: string
          ticket_url?: string
          type?: 'clubnight' | 'festival' | 'special'
          price?: string
          timetable?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      newsletter_subscribers: {
        Row: {
          id: string
          email: string
          subscribed_at: string
          confirmed: boolean
        }
        Insert: {
          id?: string
          email: string
          subscribed_at?: string
          confirmed?: boolean
        }
        Update: {
          id?: string
          email?: string
          subscribed_at?: string
          confirmed?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Event = Database['public']['Tables']['events']['Row']
export type NewsletterSubscriber = Database['public']['Tables']['newsletter_subscribers']['Row']
