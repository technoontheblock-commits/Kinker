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
      bar_events: {
        Row: {
          id: string
          name: string
          date: string
          location: string | null
          status: 'upcoming' | 'active' | 'closed' | 'cancelled'
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          date: string
          location?: string | null
          status?: 'upcoming' | 'active' | 'closed' | 'cancelled'
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          date?: string
          location?: string | null
          status?: 'upcoming' | 'active' | 'closed' | 'cancelled'
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      event_bars: {
        Row: {
          id: string
          event_id: string
          name: string
          sort_order: number
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          sort_order?: number
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          sort_order?: number
          active?: boolean
          created_at?: string
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
          password_hash: string
          role: 'admin' | 'user' | 'moderator' | 'coworker' | 'bar' | 'abendkasse'
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
          email_verified: boolean
          verification_code: string | null
          verification_expires: string | null
          reset_token: string | null
          reset_expires: string | null
          totp_secret: string | null
          totp_enabled: boolean
          totp_backup_codes: string[]
          totp_verified_at: string | null
          last_login: string | null
          avatar_url: string | null
          phone: string | null
          preferences: Json
          newsletter_opt_in: boolean
        }
        Insert: {
          id?: string
          name: string
          email: string
          password_hash: string
          role?: 'admin' | 'user' | 'moderator' | 'coworker' | 'bar' | 'abendkasse'
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
          email_verified?: boolean
          verification_code?: string | null
          verification_expires?: string | null
          reset_token?: string | null
          reset_expires?: string | null
          totp_secret?: string | null
          totp_enabled?: boolean
          totp_backup_codes?: string[]
          totp_verified_at?: string | null
          last_login?: string | null
          avatar_url?: string | null
          phone?: string | null
          preferences?: Json
          newsletter_opt_in?: boolean
        }
        Update: {
          id?: string
          name?: string
          email?: string
          password_hash?: string
          role?: 'admin' | 'user' | 'moderator' | 'coworker' | 'bar' | 'abendkasse'
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
          email_verified?: boolean
          verification_code?: string | null
          verification_expires?: string | null
          reset_token?: string | null
          reset_expires?: string | null
          totp_secret?: string | null
          totp_enabled?: boolean
          totp_backup_codes?: string[]
          totp_verified_at?: string | null
          last_login?: string | null
          avatar_url?: string | null
          phone?: string | null
          preferences?: Json
          newsletter_opt_in?: boolean
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          session_token: string
          device_info: string | null
          ip_address: string | null
          created_at: string
          last_active_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_token: string
          device_info?: string | null
          ip_address?: string | null
          created_at?: string
          last_active_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_token?: string
          device_info?: string | null
          ip_address?: string | null
          created_at?: string
          last_active_at?: string
          expires_at?: string
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
      bonus_cards: {
        Row: {
          id: string
          user_id: string | null
          card_number: string
          qr_token: string
          holder_name: string
          holder_email: string
          purchase_price: number
          payment_method: 'twint' | 'bank_transfer' | 'sepa' | 'cash'
          payment_status: 'pending' | 'paid' | 'cancelled' | 'refunded'
          status: 'active' | 'suspended' | 'expired'
          purchased_at: string
          paid_at: string | null
          expires_at: string | null
          scan_count: number
          last_scanned_at: string | null
          referral_code_used: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          card_number: string
          qr_token: string
          holder_name: string
          holder_email: string
          purchase_price?: number
          payment_method: 'twint' | 'bank_transfer' | 'sepa' | 'cash'
          payment_status?: 'pending' | 'paid' | 'cancelled' | 'refunded'
          status?: 'active' | 'suspended' | 'expired'
          purchased_at?: string
          paid_at?: string | null
          expires_at?: string | null
          scan_count?: number
          last_scanned_at?: string | null
          referral_code_used?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          card_number?: string
          qr_token?: string
          holder_name?: string
          holder_email?: string
          purchase_price?: number
          payment_method?: 'twint' | 'bank_transfer' | 'sepa' | 'cash'
          payment_status?: 'pending' | 'paid' | 'cancelled' | 'refunded'
          status?: 'active' | 'suspended' | 'expired'
          purchased_at?: string
          paid_at?: string | null
          expires_at?: string | null
          scan_count?: number
          last_scanned_at?: string | null
          referral_code_used?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bonus_card_scans: {
        Row: {
          id: string
          bonus_card_id: string
          scanned_by: string | null
          scanner_name: string | null
          scan_result: 'valid' | 'already_used' | 'invalid' | 'cancelled' | 'payment_pending' | 'suspended'
          device_info: string | null
          created_at: string
        }
        Insert: {
          id?: string
          bonus_card_id: string
          scanned_by?: string | null
          scanner_name?: string | null
          scan_result: 'valid' | 'already_used' | 'invalid' | 'cancelled' | 'payment_pending' | 'suspended'
          device_info?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          bonus_card_id?: string
          scanned_by?: string | null
          scanner_name?: string | null
          scan_result?: 'valid' | 'already_used' | 'invalid' | 'cancelled' | 'payment_pending' | 'suspended'
          device_info?: string | null
          created_at?: string
        }
      }
      referral_codes: {
        Row: {
          id: string
          user_id: string
          code: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          code: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          code?: string
          created_at?: string
        }
      }
      referral_points: {
        Row: {
          id: string
          user_id: string
          points: number
          source_bonus_card_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          points?: number
          source_bonus_card_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          points?: number
          source_bonus_card_id?: string
          created_at?: string
        }
      }
      bar_products: {
        Row: {
          id: string
          name: string
          price: number
          category: 'drink' | 'shot' | 'snack' | 'other'
          active: boolean
          sort_order: number
          barcode: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          price: number
          category?: 'drink' | 'shot' | 'snack' | 'other'
          active?: boolean
          sort_order?: number
          barcode?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          price?: number
          category?: 'drink' | 'shot' | 'snack' | 'other'
          active?: boolean
          sort_order?: number
          barcode?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bar_inventory_transactions: {
        Row: {
          id: string
          product_id: string
          bar_id: string | null
          event_id: string | null
          quantity_change: number
          type: 'delivery' | 'transfer_out' | 'transfer_in' | 'sale' | 'correction'
          order_id: string | null
          order_item_id: string | null
          created_by: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          bar_id?: string | null
          event_id?: string | null
          quantity_change: number
          type: 'delivery' | 'transfer_out' | 'transfer_in' | 'sale' | 'correction'
          order_id?: string | null
          order_item_id?: string | null
          created_by?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          bar_id?: string | null
          event_id?: string | null
          quantity_change?: number
          type?: 'delivery' | 'transfer_out' | 'transfer_in' | 'sale' | 'correction'
          order_id?: string | null
          order_item_id?: string | null
          created_by?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      bar_bracelets: {
        Row: {
          id: string
          nfc_uid: string
          balance: number
          currency: string
          status: 'active' | 'disabled' | 'lost' | 'refunded' | 'void'
          event_id: string | null
          issued_at: string
          activated_at: string
          deactivated_at: string | null
          replaced_by_bracelet_id: string | null
          note: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nfc_uid: string
          balance?: number
          currency?: string
          status?: 'active' | 'disabled' | 'lost' | 'refunded' | 'void'
          event_id?: string | null
          issued_at?: string
          activated_at?: string
          deactivated_at?: string | null
          replaced_by_bracelet_id?: string | null
          note?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nfc_uid?: string
          balance?: number
          currency?: string
          status?: 'active' | 'disabled' | 'lost' | 'refunded' | 'void'
          event_id?: string | null
          issued_at?: string
          activated_at?: string
          deactivated_at?: string | null
          replaced_by_bracelet_id?: string | null
          note?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      bar_orders: {
        Row: {
          id: string
          order_number: string
          bracelet_id: string | null
          staff_id: string
          event_id: string | null
          bar_id: string | null
          status: 'open' | 'paid' | 'cancelled' | 'refunded'
          subtotal: number
          tip_amount: number
          total: number
          currency: string
          receipt_type: 'none' | 'app' | 'email'
          receipt_sent: boolean
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          bracelet_id?: string | null
          staff_id: string
          event_id?: string | null
          bar_id?: string | null
          status?: 'open' | 'paid' | 'cancelled' | 'refunded'
          subtotal?: number
          tip_amount?: number
          total?: number
          currency?: string
          receipt_type?: 'none' | 'app' | 'email'
          receipt_sent?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          bracelet_id?: string | null
          staff_id?: string
          event_id?: string | null
          bar_id?: string | null
          status?: 'open' | 'paid' | 'cancelled' | 'refunded'
          subtotal?: number
          tip_amount?: number
          total?: number
          currency?: string
          receipt_type?: 'none' | 'app' | 'email'
          receipt_sent?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      bar_order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          name: string
          price: number
          quantity: number
          total: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          name: string
          price: number
          quantity: number
          total: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          name?: string
          price?: number
          quantity?: number
          total?: number
          created_at?: string
        }
      }
      bar_bracelet_transactions: {
        Row: {
          id: string
          bracelet_id: string
          order_id: string | null
          event_id: string | null
          bar_id: string | null
          amount: number
          type: 'top_up' | 'payment' | 'tip' | 'refund' | 'cancel'
          status: 'pending' | 'completed' | 'failed' | 'cancelled'
          description: string | null
          reference: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          bracelet_id: string
          order_id?: string | null
          event_id?: string | null
          bar_id?: string | null
          amount: number
          type: 'top_up' | 'payment' | 'tip' | 'refund' | 'cancel'
          status?: 'pending' | 'completed' | 'failed' | 'cancelled'
          description?: string | null
          reference?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          bracelet_id?: string
          order_id?: string | null
          event_id?: string | null
          bar_id?: string | null
          amount?: number
          type?: 'top_up' | 'payment' | 'tip' | 'refund' | 'cancel'
          status?: 'pending' | 'completed' | 'failed' | 'cancelled'
          description?: string | null
          reference?: string | null
          metadata?: Json
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      process_bracelet_payment: {
        Args: {
          p_order_number: string
          p_nfc_uid: string
          p_staff_id: string
          p_items: Json
          p_tip_amount: number
          p_receipt_type: string
          p_event_id?: string
          p_bar_id?: string
        }
        Returns: Json
      }
      process_bracelet_topup: {
        Args: {
          p_nfc_uid: string
          p_staff_id: string
          p_amount: number
          p_payment_method: string
          p_reference: string
          p_event_id?: string
          p_bar_id?: string
        }
        Returns: Json
      }
      get_bracelet_by_nfc_uid: {
        Args: {
          p_nfc_uid: string
        }
        Returns: Json
      }
      replace_bracelet: {
        Args: {
          p_old_nfc_uid: string
          p_new_nfc_uid: string
          p_staff_id: string
          p_reference?: string
        }
        Returns: Json
      }
      refund_bracelet_balance: {
        Args: {
          p_nfc_uid: string
          p_staff_id: string
          p_reference?: string
        }
        Returns: Json
      }
      get_event_bar_stats: {
        Args: {
          p_event_id: string
        }
        Returns: Json
      }
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
export type BonusCard = Database['public']['Tables']['bonus_cards']['Row']
export type BonusCardScan = Database['public']['Tables']['bonus_card_scans']['Row']
export type ReferralCode = Database['public']['Tables']['referral_codes']['Row']
export type ReferralPoint = Database['public']['Tables']['referral_points']['Row']
export type BarProduct = Database['public']['Tables']['bar_products']['Row']
export type BarInventoryTransaction = Database['public']['Tables']['bar_inventory_transactions']['Row']
export type BarBracelet = Database['public']['Tables']['bar_bracelets']['Row']
export type BarOrder = Database['public']['Tables']['bar_orders']['Row']
export type BarOrderItem = Database['public']['Tables']['bar_order_items']['Row']
export type BarBraceletTransaction = Database['public']['Tables']['bar_bracelet_transactions']['Row']
export type BarEvent = Database['public']['Tables']['bar_events']['Row']
export type EventBar = Database['public']['Tables']['event_bars']['Row']
