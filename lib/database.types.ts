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
          description?: string
          full_description?: string
          lineup?: string[]
          image?: string
          ticket_url?: string
          type: 'clubnight' | 'festival' | 'special'
          price?: string
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
      users: {
        Row: {
          id: string
          name: string
          email: string
          role: 'admin' | 'user' | 'moderator'
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          role?: 'admin' | 'user' | 'moderator'
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: 'admin' | 'user' | 'moderator'
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          type: 'booking' | 'contact' | 'career' | 'system' | 'rental'
          title: string
          message: string
          data: Json
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          type: 'booking' | 'contact' | 'career' | 'system' | 'rental'
          title: string
          message: string
          data?: Json
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          type?: 'booking' | 'contact' | 'career' | 'system' | 'rental'
          title?: string
          message?: string
          data?: Json
          read?: boolean
          created_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          title: string
          department: string
          type: 'Part-time' | 'Full-time' | 'Freelance'
          location: string
          description: string
          requirements: string[]
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          department: string
          type: 'Part-time' | 'Full-time' | 'Freelance'
          location?: string
          description?: string
          requirements?: string[]
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          department?: string
          type?: 'Part-time' | 'Full-time' | 'Freelance'
          location?: string
          description?: string
          requirements?: string[]
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      job_applications: {
        Row: {
          id: string
          job_id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          message: string | null
          cv_url: string | null
          status: 'pending' | 'reviewed' | 'accepted' | 'rejected'
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          message?: string | null
          cv_url?: string | null
          status?: 'pending' | 'reviewed' | 'accepted' | 'rejected'
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          message?: string | null
          cv_url?: string | null
          status?: 'pending' | 'reviewed' | 'accepted' | 'rejected'
          created_at?: string
        }
      }
      rental_inquiries: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          event_type: string
          event_date: string | null
          guests: number | null
          rooms: string[]
          extras: string[]
          message: string | null
          status: 'pending' | 'contacted' | 'confirmed' | 'cancelled'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          event_type: string
          event_date?: string | null
          guests?: number | null
          rooms?: string[]
          extras?: string[]
          message?: string | null
          status?: 'pending' | 'contacted' | 'confirmed' | 'cancelled'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          event_type?: string
          event_date?: string | null
          guests?: number | null
          rooms?: string[]
          extras?: string[]
          message?: string | null
          status?: 'pending' | 'contacted' | 'confirmed' | 'cancelled'
          created_at?: string
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
export type User = Database['public']['Tables']['users']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type Job = Database['public']['Tables']['jobs']['Row']
export type JobApplication = Database['public']['Tables']['job_applications']['Row']
export type RentalInquiry = Database['public']['Tables']['rental_inquiries']['Row']
