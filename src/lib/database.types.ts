export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after_state: Json | null
          before_state: Json | null
          created_at: string | null
          entity_id: string
          entity_type: string
          explanation: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          explanation: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          explanation?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_decisions: {
        Row: {
          booking_id: string
          created_at: string | null
          decision: string
          id: string
          reason: string | null
          reviewer_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          decision: string
          id?: string
          reason?: string | null
          reviewer_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          decision?: string
          id?: string
          reason?: string | null
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_decisions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_decisions_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          blocked_range: unknown
          buffer_minutes: number
          cancellation_reason: string | null
          created_at: string | null
          end_time: string
          id: string
          is_demo: boolean | null
          notes: string | null
          purpose: string
          requester_id: string
          resource_id: string
          start_time: string
          status: string
          updated_at: string | null
        }
        Insert: {
          blocked_range?: unknown
          buffer_minutes?: number
          cancellation_reason?: string | null
          created_at?: string | null
          end_time: string
          id?: string
          is_demo?: boolean | null
          notes?: string | null
          purpose: string
          requester_id: string
          resource_id: string
          start_time: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          blocked_range?: unknown
          buffer_minutes?: number
          cancellation_reason?: string | null
          created_at?: string | null
          end_time?: string
          id?: string
          is_demo?: boolean | null
          notes?: string | null
          purpose?: string
          requester_id?: string
          resource_id?: string
          start_time?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "public_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          institution_id: string | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          institution_id?: string | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          institution_id?: string | null
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      condition_report_images: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          report_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          report_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "condition_report_images_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "condition_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      condition_reports: {
        Row: {
          booking_id: string
          checklist: Json
          created_at: string | null
          has_damage: boolean | null
          has_missing_items: boolean | null
          id: string
          is_demo: boolean | null
          lateness_minutes: number | null
          notes: string | null
          phase: string
          reporter_id: string
        }
        Insert: {
          booking_id: string
          checklist?: Json
          created_at?: string | null
          has_damage?: boolean | null
          has_missing_items?: boolean | null
          id?: string
          is_demo?: boolean | null
          lateness_minutes?: number | null
          notes?: string | null
          phase: string
          reporter_id: string
        }
        Update: {
          booking_id?: string
          checklist?: Json
          created_at?: string | null
          has_damage?: boolean | null
          has_missing_items?: boolean | null
          id?: string
          is_demo?: boolean | null
          lateness_minutes?: number | null
          notes?: string | null
          phase?: string
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "condition_reports_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condition_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      eligibility_reviews: {
        Row: {
          created_at: string | null
          decision: string
          id: string
          notes: string | null
          requirement_id: string | null
          reviewer_id: string
          training_record_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          decision: string
          id?: string
          notes?: string | null
          requirement_id?: string | null
          reviewer_id: string
          training_record_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          decision?: string
          id?: string
          notes?: string | null
          requirement_id?: string | null
          reviewer_id?: string
          training_record_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eligibility_reviews_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "resource_requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eligibility_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eligibility_reviews_training_record_id_fkey"
            columns: ["training_record_id"]
            isOneToOne: false
            referencedRelation: "training_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eligibility_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_updates: {
        Row: {
          author_id: string
          created_at: string | null
          id: string
          incident_id: string
          note: string
          status_from: string | null
          status_to: string | null
        }
        Insert: {
          author_id: string
          created_at?: string | null
          id?: string
          incident_id: string
          note: string
          status_from?: string | null
          status_to?: string | null
        }
        Update: {
          author_id?: string
          created_at?: string | null
          id?: string
          incident_id?: string
          note?: string
          status_from?: string | null
          status_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_updates_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_updates_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          assignee_id: string | null
          booking_id: string | null
          category: string
          created_at: string | null
          description: string
          evidence_urls: Json | null
          id: string
          is_demo: boolean | null
          reporter_id: string
          resolution_notes: string | null
          resource_id: string
          severity: string
          status: string
          updated_at: string | null
        }
        Insert: {
          assignee_id?: string | null
          booking_id?: string | null
          category: string
          created_at?: string | null
          description: string
          evidence_urls?: Json | null
          id?: string
          is_demo?: boolean | null
          reporter_id: string
          resolution_notes?: string | null
          resource_id: string
          severity?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          assignee_id?: string | null
          booking_id?: string | null
          category?: string
          created_at?: string | null
          description?: string
          evidence_urls?: Json | null
          id?: string
          is_demo?: boolean | null
          reporter_id?: string
          resolution_notes?: string | null
          resource_id?: string
          severity?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "public_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      institutional_policies: {
        Row: {
          id: string
          institution_id: string
          policy_key: string
          policy_value: Json
          updated_at: string | null
        }
        Insert: {
          id?: string
          institution_id: string
          policy_key: string
          policy_value: Json
          updated_at?: string | null
        }
        Update: {
          id?: string
          institution_id?: string
          policy_key?: string
          policy_value?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "institutional_policies_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          created_at: string | null
          domain: string | null
          id: string
          is_demo: boolean | null
          name: string
          settings: Json | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain?: string | null
          id?: string
          is_demo?: boolean | null
          name: string
          settings?: Json | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string | null
          id?: string
          is_demo?: boolean | null
          name?: string
          settings?: Json | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_demo: boolean | null
          is_read: boolean
          message: string
          recipient_id: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_demo?: boolean | null
          is_read?: boolean
          message: string
          recipient_id: string
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_demo?: boolean | null
          is_read?: boolean
          message?: string
          recipient_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          department: string | null
          email: string
          full_name: string
          id: string
          institution_id: string | null
          is_demo: boolean | null
          phone: string | null
          student_staff_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          full_name: string
          id: string
          institution_id?: string | null
          is_demo?: boolean | null
          phone?: string | null
          student_staff_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          institution_id?: string | null
          is_demo?: boolean | null
          phone?: string | null
          student_staff_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_blackout_periods: {
        Row: {
          created_at: string | null
          end_time: string
          id: string
          reason: string
          resource_id: string
          start_time: string
        }
        Insert: {
          created_at?: string | null
          end_time: string
          id?: string
          reason: string
          resource_id: string
          start_time: string
        }
        Update: {
          created_at?: string | null
          end_time?: string
          id?: string
          reason?: string
          resource_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_blackout_periods_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "public_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_blackout_periods_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_images: {
        Row: {
          caption: string | null
          created_at: string | null
          display_order: number | null
          id: string
          is_primary: boolean | null
          resource_id: string
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_primary?: boolean | null
          resource_id: string
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_primary?: boolean | null
          resource_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_images_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "public_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_images_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_requirements: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          requirement_type: string
          resource_id: string
          title: string
          training_course_code: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          requirement_type: string
          resource_id: string
          title: string
          training_course_code?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          requirement_type?: string
          resource_id?: string
          title?: string
          training_course_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_requirements_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "public_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_requirements_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          buffer_minutes: number
          cancellation_policy: string | null
          category_id: string | null
          created_at: string | null
          deposit_amount: number
          description: string
          id: string
          institution_id: string | null
          is_demo: boolean
          is_exclusive: boolean
          is_published: boolean
          location_details: string | null
          location_name: string
          manager_id: string | null
          max_advance_days: number
          max_duration_minutes: number
          max_rolling_hours_30d: number
          min_duration_minutes: number
          min_notice_hours: number
          operating_hours: Json
          owner_id: string
          quantity: number
          requires_supervision: boolean
          resource_type: string
          rules: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          buffer_minutes?: number
          cancellation_policy?: string | null
          category_id?: string | null
          created_at?: string | null
          deposit_amount?: number
          description: string
          id?: string
          institution_id?: string | null
          is_demo?: boolean
          is_exclusive?: boolean
          is_published?: boolean
          location_details?: string | null
          location_name: string
          manager_id?: string | null
          max_advance_days?: number
          max_duration_minutes?: number
          max_rolling_hours_30d?: number
          min_duration_minutes?: number
          min_notice_hours?: number
          operating_hours?: Json
          owner_id: string
          quantity?: number
          requires_supervision?: boolean
          resource_type?: string
          rules?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          buffer_minutes?: number
          cancellation_policy?: string | null
          category_id?: string | null
          created_at?: string | null
          deposit_amount?: number
          description?: string
          id?: string
          institution_id?: string | null
          is_demo?: boolean
          is_exclusive?: boolean
          is_published?: boolean
          location_details?: string | null
          location_name?: string
          manager_id?: string | null
          max_advance_days?: number
          max_duration_minutes?: number
          max_rolling_hours_30d?: number
          min_duration_minutes?: number
          min_notice_hours?: number
          operating_hours?: Json
          owner_id?: string
          quantity?: number
          requires_supervision?: boolean
          resource_type?: string
          rules?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_records: {
        Row: {
          certificate_url: string | null
          course_code: string
          course_name: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_demo: boolean | null
          issued_at: string
          reviewer_id: string | null
          reviewer_notes: string | null
          updated_at: string | null
          user_id: string
          verification_status: string
        }
        Insert: {
          certificate_url?: string | null
          course_code: string
          course_name: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_demo?: boolean | null
          issued_at?: string
          reviewer_id?: string | null
          reviewer_notes?: string | null
          updated_at?: string | null
          user_id: string
          verification_status?: string
        }
        Update: {
          certificate_url?: string | null
          course_code?: string
          course_name?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_demo?: boolean | null
          issued_at?: string
          reviewer_id?: string | null
          reviewer_notes?: string | null
          updated_at?: string | null
          user_id?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_records_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_records: {
        Row: {
          booking_id: string | null
          category_id: string | null
          duration_hours: number
          id: string
          is_cancelled: boolean | null
          is_late_cancellation: boolean | null
          recorded_at: string | null
          resource_id: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          category_id?: string | null
          duration_hours?: number
          id?: string
          is_cancelled?: boolean | null
          is_late_cancellation?: boolean | null
          recorded_at?: string | null
          resource_id: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          category_id?: string | null
          duration_hours?: number
          id?: string
          is_cancelled?: boolean | null
          is_late_cancellation?: boolean | null
          recorded_at?: string | null
          resource_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_records_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_records_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_records_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "public_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_records_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_entries: {
        Row: {
          booking_id: string
          created_at: string | null
          id: string
          position: number
          requester_id: string
          resource_id: string
          status: string
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          id?: string
          position?: number
          requester_id: string
          resource_id: string
          status?: string
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          id?: string
          position?: number
          requester_id?: string
          resource_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_entries_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_entries_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_entries_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "public_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_entries_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_resources: {
        Row: {
          buffer_minutes: number | null
          cancellation_policy: string | null
          category_icon: string | null
          category_id: string | null
          category_name: string | null
          created_at: string | null
          deposit_amount: number | null
          description: string | null
          id: string | null
          institution_id: string | null
          is_demo: boolean | null
          is_exclusive: boolean | null
          is_published: boolean | null
          location_name: string | null
          manager_id: string | null
          max_advance_days: number | null
          max_duration_minutes: number | null
          max_rolling_hours_30d: number | null
          min_duration_minutes: number | null
          min_notice_hours: number | null
          operating_hours: Json | null
          owner_id: string | null
          owner_name: string | null
          quantity: number | null
          requires_supervision: boolean | null
          resource_type: string | null
          rules: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      approve_booking: {
        Args: { p_booking_id: string; p_note?: string }
        Returns: Json
      }
      check_eligibility: {
        Args: { p_resource_id: string; p_user_id: string }
        Returns: Json
      }
      has_role: { Args: { check_role: string }; Returns: boolean }
      is_resource_manager: { Args: { r_id: string }; Returns: boolean }
      is_resource_owner: { Args: { r_id: string }; Returns: boolean }
      promote_waitlist: { Args: { p_resource_id: string }; Returns: Json }
      transition_booking: {
        Args: {
          p_booking_id: string
          p_notes?: string
          p_target_status: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          lifecycle_configuration: Json | null
          lifecycle_configuration_generation: string | null
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
          versioning_status: string
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          lifecycle_configuration?: Json | null
          lifecycle_configuration_generation?: string | null
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
          versioning_status?: string
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          lifecycle_configuration?: Json | null
          lifecycle_configuration_generation?: string | null
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
          versioning_status?: string
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          archived_at: string | null
          bucket_id: string | null
          created_at: string | null
          id: string
          is_delete_marker: boolean
          is_versioned: boolean
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          archived_at?: string | null
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          is_delete_marker?: boolean
          is_versioned?: boolean
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          archived_at?: string | null
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          is_delete_marker?: boolean
          is_versioned?: boolean
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          metadata: Json | null
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allow_any_operation: {
        Args: { expected_operations: string[] }
        Returns: boolean
      }
      allow_only_operation: {
        Args: { expected_operation: string }
        Returns: boolean
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: { delete_markers?: string; noncurrent_versions?: string }
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
          raw_prefix_param?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delete_markers?: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          next_token_archived_at?: string
          next_token_version?: string
          noncurrent_versions?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          archived_at: string
          created_at: string
          id: string
          is_delete_marker: boolean
          is_versioned: boolean
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
          version: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          delete_markers?: string
          levels?: number
          limits?: number
          noncurrent_versions?: string
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          archived_at: string
          created_at: string
          id: string
          is_delete_marker: boolean
          is_versioned: boolean
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
          version: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          delete_markers?: string
          noncurrent_versions?: string
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
          p_start_after_version?: string
        }
        Returns: {
          archived_at: string
          created_at: string
          id: string
          is_delete_marker: boolean
          is_versioned: boolean
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
          version: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          delete_markers?: string
          levels?: number
          limits?: number
          noncurrent_versions?: string
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
          start_after_archived_at?: string
          start_after_is_continuation?: boolean
          start_after_version?: string
        }
        Returns: {
          archived_at: string
          created_at: string
          id: string
          is_delete_marker: boolean
          is_versioned: boolean
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
          version: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const
