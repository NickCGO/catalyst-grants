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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_usage_log: {
        Row: {
          created_at: string | null
          feature: string
          id: string
          org_id: string | null
          tokens_used: number | null
        }
        Insert: {
          created_at?: string | null
          feature: string
          id?: string
          org_id?: string | null
          tokens_used?: number | null
        }
        Update: {
          created_at?: string | null
          feature?: string
          id?: string
          org_id?: string | null
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_page_views: {
        Row: {
          created_at: string
          id: string
          path: string
          referrer: string | null
          session_id: string | null
          title: string | null
          visitor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          path: string
          referrer?: string | null
          session_id?: string | null
          title?: string | null
          visitor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          path?: string
          referrer?: string | null
          session_id?: string | null
          title?: string | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_page_views_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "analytics_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_sessions: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          device_type: string | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          landing_path: string | null
          language: string | null
          last_seen_at: string
          os: string | null
          page_count: number | null
          referrer: string | null
          started_at: string
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          visitor_id: string
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          landing_path?: string | null
          language?: string | null
          last_seen_at?: string
          os?: string | null
          page_count?: number | null
          referrer?: string | null
          started_at?: string
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id: string
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          landing_path?: string | null
          language?: string | null
          last_seen_at?: string
          os?: string | null
          page_count?: number | null
          referrer?: string | null
          started_at?: string
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
      answer_library: {
        Row: {
          content: string
          created_at: string | null
          id: string
          label: string
          org_id: string
          tags: string[] | null
          updated_at: string | null
          usage_count: number | null
          version: number | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          label: string
          org_id: string
          tags?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
          version?: number | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          label?: string
          org_id?: string
          tags?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "answer_library_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      application_answers: {
        Row: {
          answer: string | null
          application_id: string
          created_at: string | null
          id: string
          question_id: string
          sourced_from: string | null
          status: string | null
          updated_at: string | null
          updated_by: string | null
          word_count: number | null
        }
        Insert: {
          answer?: string | null
          application_id: string
          created_at?: string | null
          id?: string
          question_id: string
          sourced_from?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          word_count?: number | null
        }
        Update: {
          answer?: string | null
          application_id?: string
          created_at?: string | null
          id?: string
          question_id?: string
          sourced_from?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "application_answers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "form_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          activity_category: string | null
          ai_funder_tip: string | null
          amount_awarded: number | null
          amount_requested: number | null
          application_route: string | null
          applied_month: string | null
          applied_year: number | null
          created_at: string | null
          deadline: string | null
          funder_id: string | null
          id: string
          kanban_column: string | null
          notes: string | null
          org_id: string
          project_name: string | null
          status: string | null
          submission_method: string | null
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          activity_category?: string | null
          ai_funder_tip?: string | null
          amount_awarded?: number | null
          amount_requested?: number | null
          application_route?: string | null
          applied_month?: string | null
          applied_year?: number | null
          created_at?: string | null
          deadline?: string | null
          funder_id?: string | null
          id?: string
          kanban_column?: string | null
          notes?: string | null
          org_id: string
          project_name?: string | null
          status?: string | null
          submission_method?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          activity_category?: string | null
          ai_funder_tip?: string | null
          amount_awarded?: number | null
          amount_requested?: number | null
          application_route?: string | null
          applied_month?: string | null
          applied_year?: number | null
          created_at?: string | null
          deadline?: string | null
          funder_id?: string | null
          id?: string
          kanban_column?: string | null
          notes?: string | null
          org_id?: string
          project_name?: string | null
          status?: string | null
          submission_method?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_funder_id_fkey"
            columns: ["funder_id"]
            isOneToOne: false
            referencedRelation: "funders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          action_payload: Json
          action_type: Database["public"]["Enums"]["automation_action"]
          created_at: string
          id: string
          is_active: boolean
          name: string
          org_id: string
          trigger_event: Database["public"]["Enums"]["automation_trigger"]
          updated_at: string
        }
        Insert: {
          action_payload?: Json
          action_type: Database["public"]["Enums"]["automation_action"]
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          trigger_event: Database["public"]["Enums"]["automation_trigger"]
          updated_at?: string
        }
        Update: {
          action_payload?: Json
          action_type?: Database["public"]["Enums"]["automation_action"]
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          trigger_event?: Database["public"]["Enums"]["automation_trigger"]
          updated_at?: string
        }
        Relationships: []
      }
      crm_activity_notes: {
        Row: {
          author_id: string | null
          author_name: string | null
          content: string
          created_at: string | null
          funder_id: string
          id: string
          is_pinned: boolean | null
          note_type: string
          org_id: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          content: string
          created_at?: string | null
          funder_id: string
          id?: string
          is_pinned?: boolean | null
          note_type?: string
          org_id: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          content?: string
          created_at?: string | null
          funder_id?: string
          id?: string
          is_pinned?: boolean | null
          note_type?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activity_notes_funder_id_fkey"
            columns: ["funder_id"]
            isOneToOne: false
            referencedRelation: "funders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activity_notes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_emails: {
        Row: {
          body: string
          created_at: string | null
          created_by: string | null
          funder_id: string
          id: string
          org_id: string
          recipient_email: string | null
          relationship_id: string | null
          sent_at: string | null
          status: string
          subject: string
          updated_at: string | null
        }
        Insert: {
          body?: string
          created_at?: string | null
          created_by?: string | null
          funder_id: string
          id?: string
          org_id: string
          recipient_email?: string | null
          relationship_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          updated_at?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          created_by?: string | null
          funder_id?: string
          id?: string
          org_id?: string
          recipient_email?: string | null
          relationship_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_emails_funder_id_fkey"
            columns: ["funder_id"]
            isOneToOne: false
            referencedRelation: "funders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_emails_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_emails_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "funder_relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      deadline_intelligence: {
        Row: {
          ai_recommendation: string | null
          conflict_detail: string | null
          created_at: string | null
          deadline_date: string | null
          estimated_writing_days: number | null
          funder_id: string | null
          id: string
          org_id: string
          priority_score: number | null
          recommended_start_date: string | null
          workload_conflict: boolean | null
        }
        Insert: {
          ai_recommendation?: string | null
          conflict_detail?: string | null
          created_at?: string | null
          deadline_date?: string | null
          estimated_writing_days?: number | null
          funder_id?: string | null
          id?: string
          org_id: string
          priority_score?: number | null
          recommended_start_date?: string | null
          workload_conflict?: boolean | null
        }
        Update: {
          ai_recommendation?: string | null
          conflict_detail?: string | null
          created_at?: string | null
          deadline_date?: string | null
          estimated_writing_days?: number | null
          funder_id?: string | null
          id?: string
          org_id?: string
          priority_score?: number | null
          recommended_start_date?: string | null
          workload_conflict?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "deadline_intelligence_funder_id_fkey"
            columns: ["funder_id"]
            isOneToOne: false
            referencedRelation: "funders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deadline_intelligence_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_credentials: {
        Row: {
          access_token: string | null
          access_token_secret_id: string | null
          created_at: string
          email_address: string
          id: string
          last_synced_at: string | null
          org_id: string
          provider: Database["public"]["Enums"]["email_provider"]
          provider_user_id: string | null
          refresh_token: string | null
          refresh_token_secret_id: string | null
          scope: string | null
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          access_token_secret_id?: string | null
          created_at?: string
          email_address: string
          id?: string
          last_synced_at?: string | null
          org_id: string
          provider: Database["public"]["Enums"]["email_provider"]
          provider_user_id?: string | null
          refresh_token?: string | null
          refresh_token_secret_id?: string | null
          scope?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          access_token_secret_id?: string | null
          created_at?: string
          email_address?: string
          id?: string
          last_synced_at?: string | null
          org_id?: string
          provider?: Database["public"]["Enums"]["email_provider"]
          provider_user_id?: string | null
          refresh_token?: string | null
          refresh_token_secret_id?: string | null
          scope?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          org_id: string
          purpose: string | null
          sort_order: number
          subject: string
          updated_at: string
        }
        Insert: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          org_id: string
          purpose?: string | null
          sort_order?: number
          subject?: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          org_id?: string
          purpose?: string | null
          sort_order?: number
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_threads: {
        Row: {
          application_id: string | null
          body_html: string | null
          created_at: string
          direction: Database["public"]["Enums"]["email_thread_direction"]
          from_address: string
          funder_id: string | null
          id: string
          org_id: string
          provider_message_id: string | null
          provider_thread_id: string | null
          relationship_id: string | null
          sent_at: string
          snippet: string | null
          subject: string | null
          synced_at: string
          to_addresses: string[]
          updated_at: string
        }
        Insert: {
          application_id?: string | null
          body_html?: string | null
          created_at?: string
          direction: Database["public"]["Enums"]["email_thread_direction"]
          from_address: string
          funder_id?: string | null
          id?: string
          org_id: string
          provider_message_id?: string | null
          provider_thread_id?: string | null
          relationship_id?: string | null
          sent_at?: string
          snippet?: string | null
          subject?: string | null
          synced_at?: string
          to_addresses?: string[]
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          body_html?: string | null
          created_at?: string
          direction?: Database["public"]["Enums"]["email_thread_direction"]
          from_address?: string
          funder_id?: string | null
          id?: string
          org_id?: string
          provider_message_id?: string | null
          provider_thread_id?: string | null
          relationship_id?: string | null
          sent_at?: string
          snippet?: string | null
          subject?: string | null
          synced_at?: string
          to_addresses?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      form_questions: {
        Row: {
          answer_type: string | null
          char_limit: number | null
          created_at: string | null
          form_id: string
          guidance: string | null
          id: string
          options: Json | null
          order_index: number
          question: string
          required: boolean | null
          word_limit: number | null
        }
        Insert: {
          answer_type?: string | null
          char_limit?: number | null
          created_at?: string | null
          form_id: string
          guidance?: string | null
          id?: string
          options?: Json | null
          order_index?: number
          question: string
          required?: boolean | null
          word_limit?: number | null
        }
        Update: {
          answer_type?: string | null
          char_limit?: number | null
          created_at?: string | null
          form_id?: string
          guidance?: string | null
          id?: string
          options?: Json | null
          order_index?: number
          question?: string
          required?: boolean | null
          word_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "form_questions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "funder_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      funder_contacts: {
        Row: {
          alt_emails: string[] | null
          created_at: string | null
          created_by: string | null
          email: string | null
          funder_id: string
          id: string
          is_primary: boolean | null
          name: string | null
          notes: string | null
          org_id: string
          phone: string | null
          relationship_id: string | null
          role: string | null
          source: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          alt_emails?: string[] | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          funder_id: string
          id?: string
          is_primary?: boolean | null
          name?: string | null
          notes?: string | null
          org_id: string
          phone?: string | null
          relationship_id?: string | null
          role?: string | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          alt_emails?: string[] | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          funder_id?: string
          id?: string
          is_primary?: boolean | null
          name?: string | null
          notes?: string | null
          org_id?: string
          phone?: string | null
          relationship_id?: string | null
          role?: string | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funder_contacts_funder_id_fkey"
            columns: ["funder_id"]
            isOneToOne: false
            referencedRelation: "funders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funder_contacts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funder_contacts_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "funder_relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      funder_focus_areas: {
        Row: {
          aged_elderly: boolean | null
          agriculture_land: boolean | null
          animals: boolean | null
          arts_culture: boolean | null
          capacity_building_governance: boolean | null
          children: boolean | null
          community_development: boolean | null
          disability: boolean | null
          displaced_refugees: boolean | null
          donor_name: string | null
          education_ecd: boolean | null
          entrepreneur_skills_vocational: boolean | null
          environment_conservation: boolean | null
          families_parents: boolean | null
          funder_id: string | null
          health_aids_sexual_reproductive: boolean | null
          housing_homeless: boolean | null
          human_rights_advocacy: boolean | null
          id: string
          lgbtqi_gender_equality: boolean | null
          peace_conflict_resolution: boolean | null
          poverty_livelihood: boolean | null
          religion: boolean | null
          science_research: boolean | null
          sports: boolean | null
          welfare: boolean | null
          women_gender_dv_girls: boolean | null
          youth: boolean | null
        }
        Insert: {
          aged_elderly?: boolean | null
          agriculture_land?: boolean | null
          animals?: boolean | null
          arts_culture?: boolean | null
          capacity_building_governance?: boolean | null
          children?: boolean | null
          community_development?: boolean | null
          disability?: boolean | null
          displaced_refugees?: boolean | null
          donor_name?: string | null
          education_ecd?: boolean | null
          entrepreneur_skills_vocational?: boolean | null
          environment_conservation?: boolean | null
          families_parents?: boolean | null
          funder_id?: string | null
          health_aids_sexual_reproductive?: boolean | null
          housing_homeless?: boolean | null
          human_rights_advocacy?: boolean | null
          id?: string
          lgbtqi_gender_equality?: boolean | null
          peace_conflict_resolution?: boolean | null
          poverty_livelihood?: boolean | null
          religion?: boolean | null
          science_research?: boolean | null
          sports?: boolean | null
          welfare?: boolean | null
          women_gender_dv_girls?: boolean | null
          youth?: boolean | null
        }
        Update: {
          aged_elderly?: boolean | null
          agriculture_land?: boolean | null
          animals?: boolean | null
          arts_culture?: boolean | null
          capacity_building_governance?: boolean | null
          children?: boolean | null
          community_development?: boolean | null
          disability?: boolean | null
          displaced_refugees?: boolean | null
          donor_name?: string | null
          education_ecd?: boolean | null
          entrepreneur_skills_vocational?: boolean | null
          environment_conservation?: boolean | null
          families_parents?: boolean | null
          funder_id?: string | null
          health_aids_sexual_reproductive?: boolean | null
          housing_homeless?: boolean | null
          human_rights_advocacy?: boolean | null
          id?: string
          lgbtqi_gender_equality?: boolean | null
          peace_conflict_resolution?: boolean | null
          poverty_livelihood?: boolean | null
          religion?: boolean | null
          science_research?: boolean | null
          sports?: boolean | null
          welfare?: boolean | null
          women_gender_dv_girls?: boolean | null
          youth?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "funder_focus_areas_funder_id_fkey"
            columns: ["funder_id"]
            isOneToOne: false
            referencedRelation: "funders"
            referencedColumns: ["id"]
          },
        ]
      }
      funder_forms: {
        Row: {
          created_at: string | null
          funder_id: string
          id: string
          last_verified: string | null
          required_attachments: Json | null
          source: string | null
          source_url: string | null
          submission_method: string | null
          submission_url: string | null
          title: string | null
          updated_at: string | null
          verified: boolean | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          funder_id: string
          id?: string
          last_verified?: string | null
          required_attachments?: Json | null
          source?: string | null
          source_url?: string | null
          submission_method?: string | null
          submission_url?: string | null
          title?: string | null
          updated_at?: string | null
          verified?: boolean | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          funder_id?: string
          id?: string
          last_verified?: string | null
          required_attachments?: Json | null
          source?: string | null
          source_url?: string | null
          submission_method?: string | null
          submission_url?: string | null
          title?: string | null
          updated_at?: string | null
          verified?: boolean | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funder_forms_funder_id_fkey"
            columns: ["funder_id"]
            isOneToOne: false
            referencedRelation: "funders"
            referencedColumns: ["id"]
          },
        ]
      }
      funder_interactions: {
        Row: {
          ai_generated: boolean | null
          created_at: string | null
          created_by: string | null
          date: string
          funder_id: string
          id: string
          interaction_type: string
          org_id: string
          outcome: string | null
          relationship_id: string | null
          sentiment: string | null
          summary: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          funder_id: string
          id?: string
          interaction_type: string
          org_id: string
          outcome?: string | null
          relationship_id?: string | null
          sentiment?: string | null
          summary?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          funder_id?: string
          id?: string
          interaction_type?: string
          org_id?: string
          outcome?: string | null
          relationship_id?: string | null
          sentiment?: string | null
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funder_interactions_funder_id_fkey"
            columns: ["funder_id"]
            isOneToOne: false
            referencedRelation: "funders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funder_interactions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funder_interactions_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "funder_relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      funder_relationships: {
        Row: {
          applications_count: number | null
          created_at: string | null
          funder_id: string
          health_score: number | null
          id: string
          last_interaction_date: string | null
          next_action_date: string | null
          next_action_note: string | null
          next_action_type: string | null
          notes: string | null
          org_id: string
          relationship_owner: string | null
          relationship_status: string | null
          successful_count: number | null
          tags: string[] | null
          total_applied: number | null
          total_awarded: number | null
          updated_at: string | null
        }
        Insert: {
          applications_count?: number | null
          created_at?: string | null
          funder_id: string
          health_score?: number | null
          id?: string
          last_interaction_date?: string | null
          next_action_date?: string | null
          next_action_note?: string | null
          next_action_type?: string | null
          notes?: string | null
          org_id: string
          relationship_owner?: string | null
          relationship_status?: string | null
          successful_count?: number | null
          tags?: string[] | null
          total_applied?: number | null
          total_awarded?: number | null
          updated_at?: string | null
        }
        Update: {
          applications_count?: number | null
          created_at?: string | null
          funder_id?: string
          health_score?: number | null
          id?: string
          last_interaction_date?: string | null
          next_action_date?: string | null
          next_action_note?: string | null
          next_action_type?: string | null
          notes?: string | null
          org_id?: string
          relationship_owner?: string | null
          relationship_status?: string | null
          successful_count?: number | null
          tags?: string[] | null
          total_applied?: number | null
          total_awarded?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funder_relationships_funder_id_fkey"
            columns: ["funder_id"]
            isOneToOne: false
            referencedRelation: "funders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funder_relationships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      funder_windows: {
        Row: {
          application_period_text: string | null
          apr: boolean | null
          aug: boolean | null
          dec: boolean | null
          donor_name: string | null
          feb: boolean | null
          funder_id: string | null
          id: string
          jan: boolean | null
          jul: boolean | null
          jun: boolean | null
          mar: boolean | null
          may: boolean | null
          nov: boolean | null
          oct: boolean | null
          sep: boolean | null
        }
        Insert: {
          application_period_text?: string | null
          apr?: boolean | null
          aug?: boolean | null
          dec?: boolean | null
          donor_name?: string | null
          feb?: boolean | null
          funder_id?: string | null
          id?: string
          jan?: boolean | null
          jul?: boolean | null
          jun?: boolean | null
          mar?: boolean | null
          may?: boolean | null
          nov?: boolean | null
          oct?: boolean | null
          sep?: boolean | null
        }
        Update: {
          application_period_text?: string | null
          apr?: boolean | null
          aug?: boolean | null
          dec?: boolean | null
          donor_name?: string | null
          feb?: boolean | null
          funder_id?: string | null
          id?: string
          jan?: boolean | null
          jul?: boolean | null
          jun?: boolean | null
          mar?: boolean | null
          may?: boolean | null
          nov?: boolean | null
          oct?: boolean | null
          sep?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "funder_windows_funder_id_fkey"
            columns: ["funder_id"]
            isOneToOne: false
            referencedRelation: "funders"
            referencedColumns: ["id"]
          },
        ]
      }
      funders: {
        Row: {
          address1: string | null
          address2: string | null
          address3: string | null
          address4: string | null
          application_period: string | null
          call_for_proposal: string | null
          category: string | null
          company_standing: string | null
          contact_person: string | null
          created_at: string | null
          donor_name: string
          elizayo_code: string | null
          email: string | null
          funder_focus: string | null
          geographical_area: string | null
          has_capacity_building: boolean | null
          has_grants: boolean | null
          has_scholarships: boolean | null
          id: string
          method_of_approach: string | null
          pappilon_code: string | null
          subsidiary_of: string | null
          telephone: string | null
          title: string | null
          website: string | null
        }
        Insert: {
          address1?: string | null
          address2?: string | null
          address3?: string | null
          address4?: string | null
          application_period?: string | null
          call_for_proposal?: string | null
          category?: string | null
          company_standing?: string | null
          contact_person?: string | null
          created_at?: string | null
          donor_name: string
          elizayo_code?: string | null
          email?: string | null
          funder_focus?: string | null
          geographical_area?: string | null
          has_capacity_building?: boolean | null
          has_grants?: boolean | null
          has_scholarships?: boolean | null
          id?: string
          method_of_approach?: string | null
          pappilon_code?: string | null
          subsidiary_of?: string | null
          telephone?: string | null
          title?: string | null
          website?: string | null
        }
        Update: {
          address1?: string | null
          address2?: string | null
          address3?: string | null
          address4?: string | null
          application_period?: string | null
          call_for_proposal?: string | null
          category?: string | null
          company_standing?: string | null
          contact_person?: string | null
          created_at?: string | null
          donor_name?: string
          elizayo_code?: string | null
          email?: string | null
          funder_focus?: string | null
          geographical_area?: string | null
          has_capacity_building?: boolean | null
          has_grants?: boolean | null
          has_scholarships?: boolean | null
          id?: string
          method_of_approach?: string | null
          pappilon_code?: string | null
          subsidiary_of?: string | null
          telephone?: string | null
          title?: string | null
          website?: string | null
        }
        Relationships: []
      }
      grant_matches: {
        Row: {
          calculated_at: string | null
          focus_score: number | null
          funder_id: string
          geo_score: number | null
          id: string
          is_dismissed: boolean | null
          is_saved: boolean | null
          match_score: number | null
          method_score: number | null
          org_id: string
          timing_score: number | null
        }
        Insert: {
          calculated_at?: string | null
          focus_score?: number | null
          funder_id: string
          geo_score?: number | null
          id?: string
          is_dismissed?: boolean | null
          is_saved?: boolean | null
          match_score?: number | null
          method_score?: number | null
          org_id: string
          timing_score?: number | null
        }
        Update: {
          calculated_at?: string | null
          focus_score?: number | null
          funder_id?: string
          geo_score?: number | null
          id?: string
          is_dismissed?: boolean | null
          is_saved?: boolean | null
          match_score?: number | null
          method_score?: number | null
          org_id?: string
          timing_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "grant_matches_funder_id_fkey"
            columns: ["funder_id"]
            isOneToOne: false
            referencedRelation: "funders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grant_matches_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      impact_reports: {
        Row: {
          application_id: string | null
          created_at: string | null
          funder_id: string | null
          generated_report: string | null
          id: string
          org_id: string
          project_updates: string | null
          report_format: string | null
          report_period_end: string | null
          report_period_start: string | null
          status: string | null
          version: number | null
        }
        Insert: {
          application_id?: string | null
          created_at?: string | null
          funder_id?: string | null
          generated_report?: string | null
          id?: string
          org_id: string
          project_updates?: string | null
          report_format?: string | null
          report_period_end?: string | null
          report_period_start?: string | null
          status?: string | null
          version?: number | null
        }
        Update: {
          application_id?: string | null
          created_at?: string | null
          funder_id?: string | null
          generated_report?: string | null
          id?: string
          org_id?: string
          project_updates?: string | null
          report_format?: string | null
          report_period_end?: string | null
          report_period_start?: string | null
          status?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "impact_reports_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "impact_reports_funder_id_fkey"
            columns: ["funder_id"]
            isOneToOne: false
            referencedRelation: "funders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "impact_reports_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      inbound_emails: {
        Row: {
          body_html: string | null
          body_text: string | null
          created_at: string
          from_email: string
          from_name: string | null
          funder_id: string | null
          id: string
          in_reply_to: string | null
          is_read: boolean
          match_method: string | null
          message_id: string | null
          org_id: string
          raw_payload: Json | null
          received_at: string
          relationship_id: string | null
          subject: string | null
          to_email: string
        }
        Insert: {
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          from_email: string
          from_name?: string | null
          funder_id?: string | null
          id?: string
          in_reply_to?: string | null
          is_read?: boolean
          match_method?: string | null
          message_id?: string | null
          org_id: string
          raw_payload?: Json | null
          received_at?: string
          relationship_id?: string | null
          subject?: string | null
          to_email: string
        }
        Update: {
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          from_email?: string
          from_name?: string | null
          funder_id?: string | null
          id?: string
          in_reply_to?: string | null
          is_read?: boolean
          match_method?: string | null
          message_id?: string | null
          org_id?: string
          raw_payload?: Json | null
          received_at?: string
          relationship_id?: string | null
          subject?: string | null
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbound_emails_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          link: string | null
          org_id: string | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          link?: string | null
          org_id?: string | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          link?: string | null
          org_id?: string | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          annual_beneficiary_reach: number | null
          annual_budget: number | null
          annual_budget_currency: string | null
          annual_income: number | null
          baseline_data: string | null
          bbbee_level: number | null
          beneficiary_demographics: Json | null
          beneficiary_groups: string[] | null
          beneficiary_participation: string | null
          beneficiary_reach_unit: string | null
          beneficiary_selection_criteria: string | null
          board_count: number | null
          budget_breakdown: Json | null
          ceo_name: string | null
          cities: string[] | null
          cofunding_available: boolean | null
          cofunding_description: string | null
          community_voice_quote: string | null
          core_values: string[] | null
          country: string | null
          created_at: string | null
          data_collection_methods: string[] | null
          direct_beneficiaries_annual: number | null
          executive_director_bio: string | null
          finance_contact: string | null
          financial_management_system: string | null
          focus_areas: string[] | null
          focus_priority: Json | null
          founded_year: number | null
          fte_count: number | null
          funding_achievement: string | null
          funding_gap: number | null
          funding_sources_detail: Json | null
          gap_in_services: string | null
          geo_summary: string | null
          governance_structure: string | null
          grant_management_experience: string | null
          has_bbbee: boolean | null
          has_dedicated_bank_account: boolean | null
          has_grant_writer: boolean | null
          has_me_framework: boolean | null
          has_policies: boolean | null
          has_strategic_plan: boolean | null
          id: string
          impact_indicators: Json | null
          impact_statement: string | null
          inbound_mailbox_token: string | null
          indirect_beneficiaries_annual: number | null
          innovation_factor: string | null
          intervention_approach: string | null
          is_audited: boolean | null
          is_discoverable: boolean | null
          key_outcomes: string[] | null
          key_outputs: string[] | null
          key_staff: Json | null
          largest_grant_range: string | null
          last_audit_year: number | null
          lessons_learned: string | null
          logo_url: string | null
          mission_statement: string | null
          mne_framework_description: string | null
          name: string
          onboarding_complete: boolean | null
          onboarding_step: number | null
          operational_expenses: number | null
          org_settings: Json
          org_size: string | null
          org_type: string | null
          organisational_achievements: string | null
          other_african_countries: string[] | null
          partner_types: string[] | null
          partnership_open: boolean | null
          partnership_role: string | null
          partnership_seeks: string[] | null
          partnership_statement: string | null
          partnership_strengths: string[] | null
          parttime_count: number | null
          past_funders: string[] | null
          past_funders_detailed: Json | null
          past_impact_achievements: string | null
          pbo_number: string | null
          pct_corporate: number | null
          pct_government: number | null
          pct_grants: number | null
          physical_address: string | null
          plan_tier: string
          policies_list: string[] | null
          postal_address: string | null
          primary_sdgs: string[] | null
          primary_target_group: string | null
          problem_evidence: string | null
          problem_geographic_context: string | null
          problem_root_causes: string | null
          problem_statement: string | null
          profile_completeness: number | null
          programme_details: Json | null
          programmes: string[] | null
          proposals_used: number
          region: string | null
          regions_of_operation: string[] | null
          registration_number: string | null
          reporting_frequency: string | null
          sdgs: number[] | null
          strategic_plan_period: string | null
          tax_status: string | null
          theory_of_change: string | null
          toc_if_then: string | null
          total_funding_3yr: string | null
          trading_name: string | null
          trial_started_at: string | null
          typical_grant_size_range: string | null
          user_id: string
          vision_statement: string | null
          volunteer_count: number | null
          website: string | null
          why_your_org: string | null
          works_internationally: boolean | null
          works_other_african: boolean | null
          works_rural: boolean | null
          works_urban: boolean | null
        }
        Insert: {
          annual_beneficiary_reach?: number | null
          annual_budget?: number | null
          annual_budget_currency?: string | null
          annual_income?: number | null
          baseline_data?: string | null
          bbbee_level?: number | null
          beneficiary_demographics?: Json | null
          beneficiary_groups?: string[] | null
          beneficiary_participation?: string | null
          beneficiary_reach_unit?: string | null
          beneficiary_selection_criteria?: string | null
          board_count?: number | null
          budget_breakdown?: Json | null
          ceo_name?: string | null
          cities?: string[] | null
          cofunding_available?: boolean | null
          cofunding_description?: string | null
          community_voice_quote?: string | null
          core_values?: string[] | null
          country?: string | null
          created_at?: string | null
          data_collection_methods?: string[] | null
          direct_beneficiaries_annual?: number | null
          executive_director_bio?: string | null
          finance_contact?: string | null
          financial_management_system?: string | null
          focus_areas?: string[] | null
          focus_priority?: Json | null
          founded_year?: number | null
          fte_count?: number | null
          funding_achievement?: string | null
          funding_gap?: number | null
          funding_sources_detail?: Json | null
          gap_in_services?: string | null
          geo_summary?: string | null
          governance_structure?: string | null
          grant_management_experience?: string | null
          has_bbbee?: boolean | null
          has_dedicated_bank_account?: boolean | null
          has_grant_writer?: boolean | null
          has_me_framework?: boolean | null
          has_policies?: boolean | null
          has_strategic_plan?: boolean | null
          id?: string
          impact_indicators?: Json | null
          impact_statement?: string | null
          inbound_mailbox_token?: string | null
          indirect_beneficiaries_annual?: number | null
          innovation_factor?: string | null
          intervention_approach?: string | null
          is_audited?: boolean | null
          is_discoverable?: boolean | null
          key_outcomes?: string[] | null
          key_outputs?: string[] | null
          key_staff?: Json | null
          largest_grant_range?: string | null
          last_audit_year?: number | null
          lessons_learned?: string | null
          logo_url?: string | null
          mission_statement?: string | null
          mne_framework_description?: string | null
          name: string
          onboarding_complete?: boolean | null
          onboarding_step?: number | null
          operational_expenses?: number | null
          org_settings?: Json
          org_size?: string | null
          org_type?: string | null
          organisational_achievements?: string | null
          other_african_countries?: string[] | null
          partner_types?: string[] | null
          partnership_open?: boolean | null
          partnership_role?: string | null
          partnership_seeks?: string[] | null
          partnership_statement?: string | null
          partnership_strengths?: string[] | null
          parttime_count?: number | null
          past_funders?: string[] | null
          past_funders_detailed?: Json | null
          past_impact_achievements?: string | null
          pbo_number?: string | null
          pct_corporate?: number | null
          pct_government?: number | null
          pct_grants?: number | null
          physical_address?: string | null
          plan_tier?: string
          policies_list?: string[] | null
          postal_address?: string | null
          primary_sdgs?: string[] | null
          primary_target_group?: string | null
          problem_evidence?: string | null
          problem_geographic_context?: string | null
          problem_root_causes?: string | null
          problem_statement?: string | null
          profile_completeness?: number | null
          programme_details?: Json | null
          programmes?: string[] | null
          proposals_used?: number
          region?: string | null
          regions_of_operation?: string[] | null
          registration_number?: string | null
          reporting_frequency?: string | null
          sdgs?: number[] | null
          strategic_plan_period?: string | null
          tax_status?: string | null
          theory_of_change?: string | null
          toc_if_then?: string | null
          total_funding_3yr?: string | null
          trading_name?: string | null
          trial_started_at?: string | null
          typical_grant_size_range?: string | null
          user_id: string
          vision_statement?: string | null
          volunteer_count?: number | null
          website?: string | null
          why_your_org?: string | null
          works_internationally?: boolean | null
          works_other_african?: boolean | null
          works_rural?: boolean | null
          works_urban?: boolean | null
        }
        Update: {
          annual_beneficiary_reach?: number | null
          annual_budget?: number | null
          annual_budget_currency?: string | null
          annual_income?: number | null
          baseline_data?: string | null
          bbbee_level?: number | null
          beneficiary_demographics?: Json | null
          beneficiary_groups?: string[] | null
          beneficiary_participation?: string | null
          beneficiary_reach_unit?: string | null
          beneficiary_selection_criteria?: string | null
          board_count?: number | null
          budget_breakdown?: Json | null
          ceo_name?: string | null
          cities?: string[] | null
          cofunding_available?: boolean | null
          cofunding_description?: string | null
          community_voice_quote?: string | null
          core_values?: string[] | null
          country?: string | null
          created_at?: string | null
          data_collection_methods?: string[] | null
          direct_beneficiaries_annual?: number | null
          executive_director_bio?: string | null
          finance_contact?: string | null
          financial_management_system?: string | null
          focus_areas?: string[] | null
          focus_priority?: Json | null
          founded_year?: number | null
          fte_count?: number | null
          funding_achievement?: string | null
          funding_gap?: number | null
          funding_sources_detail?: Json | null
          gap_in_services?: string | null
          geo_summary?: string | null
          governance_structure?: string | null
          grant_management_experience?: string | null
          has_bbbee?: boolean | null
          has_dedicated_bank_account?: boolean | null
          has_grant_writer?: boolean | null
          has_me_framework?: boolean | null
          has_policies?: boolean | null
          has_strategic_plan?: boolean | null
          id?: string
          impact_indicators?: Json | null
          impact_statement?: string | null
          inbound_mailbox_token?: string | null
          indirect_beneficiaries_annual?: number | null
          innovation_factor?: string | null
          intervention_approach?: string | null
          is_audited?: boolean | null
          is_discoverable?: boolean | null
          key_outcomes?: string[] | null
          key_outputs?: string[] | null
          key_staff?: Json | null
          largest_grant_range?: string | null
          last_audit_year?: number | null
          lessons_learned?: string | null
          logo_url?: string | null
          mission_statement?: string | null
          mne_framework_description?: string | null
          name?: string
          onboarding_complete?: boolean | null
          onboarding_step?: number | null
          operational_expenses?: number | null
          org_settings?: Json
          org_size?: string | null
          org_type?: string | null
          organisational_achievements?: string | null
          other_african_countries?: string[] | null
          partner_types?: string[] | null
          partnership_open?: boolean | null
          partnership_role?: string | null
          partnership_seeks?: string[] | null
          partnership_statement?: string | null
          partnership_strengths?: string[] | null
          parttime_count?: number | null
          past_funders?: string[] | null
          past_funders_detailed?: Json | null
          past_impact_achievements?: string | null
          pbo_number?: string | null
          pct_corporate?: number | null
          pct_government?: number | null
          pct_grants?: number | null
          physical_address?: string | null
          plan_tier?: string
          policies_list?: string[] | null
          postal_address?: string | null
          primary_sdgs?: string[] | null
          primary_target_group?: string | null
          problem_evidence?: string | null
          problem_geographic_context?: string | null
          problem_root_causes?: string | null
          problem_statement?: string | null
          profile_completeness?: number | null
          programme_details?: Json | null
          programmes?: string[] | null
          proposals_used?: number
          region?: string | null
          regions_of_operation?: string[] | null
          registration_number?: string | null
          reporting_frequency?: string | null
          sdgs?: number[] | null
          strategic_plan_period?: string | null
          tax_status?: string | null
          theory_of_change?: string | null
          toc_if_then?: string | null
          total_funding_3yr?: string | null
          trading_name?: string | null
          trial_started_at?: string | null
          typical_grant_size_range?: string | null
          user_id?: string
          vision_statement?: string | null
          volunteer_count?: number | null
          website?: string | null
          why_your_org?: string | null
          works_internationally?: boolean | null
          works_other_african?: boolean | null
          works_rural?: boolean | null
          works_urban?: boolean | null
        }
        Relationships: []
      }
      partnership_documents: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          org_id: string
          partnership_id: string
          uploaded_by: string
          uploader_name: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          org_id: string
          partnership_id: string
          uploaded_by: string
          uploader_name?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          org_id?: string
          partnership_id?: string
          uploaded_by?: string
          uploader_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partnership_documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partnership_documents_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: false
            referencedRelation: "partnerships"
            referencedColumns: ["id"]
          },
        ]
      }
      partnership_members: {
        Row: {
          budget_share_percent: number | null
          id: string
          joined_at: string | null
          org_id: string
          partnership_id: string
          responsibilities: string[] | null
          role: string | null
          status: string | null
        }
        Insert: {
          budget_share_percent?: number | null
          id?: string
          joined_at?: string | null
          org_id: string
          partnership_id: string
          responsibilities?: string[] | null
          role?: string | null
          status?: string | null
        }
        Update: {
          budget_share_percent?: number | null
          id?: string
          joined_at?: string | null
          org_id?: string
          partnership_id?: string
          responsibilities?: string[] | null
          role?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partnership_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partnership_members_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: false
            referencedRelation: "partnerships"
            referencedColumns: ["id"]
          },
        ]
      }
      partnership_messages: {
        Row: {
          author_name: string | null
          author_user_id: string
          body: string
          created_at: string
          id: string
          org_id: string
          partnership_id: string
        }
        Insert: {
          author_name?: string | null
          author_user_id: string
          body: string
          created_at?: string
          id?: string
          org_id: string
          partnership_id: string
        }
        Update: {
          author_name?: string | null
          author_user_id?: string
          body?: string
          created_at?: string
          id?: string
          org_id?: string
          partnership_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partnership_messages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partnership_messages_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: false
            referencedRelation: "partnerships"
            referencedColumns: ["id"]
          },
        ]
      }
      partnership_proposals: {
        Row: {
          ai_merge_status: string | null
          created_at: string | null
          funder_id: string | null
          id: string
          merged_content: string | null
          overall_score: number | null
          partnership_id: string
          section_ownership: Json | null
          sections: Json | null
          status: string | null
          version: number | null
        }
        Insert: {
          ai_merge_status?: string | null
          created_at?: string | null
          funder_id?: string | null
          id?: string
          merged_content?: string | null
          overall_score?: number | null
          partnership_id: string
          section_ownership?: Json | null
          sections?: Json | null
          status?: string | null
          version?: number | null
        }
        Update: {
          ai_merge_status?: string | null
          created_at?: string | null
          funder_id?: string | null
          id?: string
          merged_content?: string | null
          overall_score?: number | null
          partnership_id?: string
          section_ownership?: Json | null
          sections?: Json | null
          status?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "partnership_proposals_funder_id_fkey"
            columns: ["funder_id"]
            isOneToOne: false
            referencedRelation: "funders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partnership_proposals_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: false
            referencedRelation: "partnerships"
            referencedColumns: ["id"]
          },
        ]
      }
      partnerships: {
        Row: {
          agreement_signed: boolean | null
          application_id: string | null
          budget_total: number | null
          created_at: string | null
          description: string | null
          funder_id: string | null
          id: string
          lead_org_id: string
          lead_share_percent: number | null
          mou_content: string | null
          partnership_name: string | null
          partnership_type: string | null
          status: string | null
          trust_score: number | null
          updated_at: string | null
        }
        Insert: {
          agreement_signed?: boolean | null
          application_id?: string | null
          budget_total?: number | null
          created_at?: string | null
          description?: string | null
          funder_id?: string | null
          id?: string
          lead_org_id: string
          lead_share_percent?: number | null
          mou_content?: string | null
          partnership_name?: string | null
          partnership_type?: string | null
          status?: string | null
          trust_score?: number | null
          updated_at?: string | null
        }
        Update: {
          agreement_signed?: boolean | null
          application_id?: string | null
          budget_total?: number | null
          created_at?: string | null
          description?: string | null
          funder_id?: string | null
          id?: string
          lead_org_id?: string
          lead_share_percent?: number | null
          mou_content?: string | null
          partnership_name?: string | null
          partnership_type?: string | null
          status?: string | null
          trust_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partnerships_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partnerships_funder_id_fkey"
            columns: ["funder_id"]
            isOneToOne: false
            referencedRelation: "funders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partnerships_lead_org_id_fkey"
            columns: ["lead_org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      programme_details: {
        Row: {
          activities: string[] | null
          annual_budget_range: string | null
          annual_reach: number | null
          approach_methodology: string | null
          challenges_faced: string | null
          created_at: string | null
          description: string | null
          detailed_description: string | null
          geographic_areas: string[] | null
          id: string
          intervention_approaches: string[] | null
          key_outcomes: string[] | null
          key_outputs: string[] | null
          org_id: string
          partner_organisations: string[] | null
          primary_focus_area: string | null
          programme_name: string
          secondary_focus_areas: string[] | null
          status: string | null
          success_story: string | null
          target_beneficiaries: string | null
          year_started: number | null
        }
        Insert: {
          activities?: string[] | null
          annual_budget_range?: string | null
          annual_reach?: number | null
          approach_methodology?: string | null
          challenges_faced?: string | null
          created_at?: string | null
          description?: string | null
          detailed_description?: string | null
          geographic_areas?: string[] | null
          id?: string
          intervention_approaches?: string[] | null
          key_outcomes?: string[] | null
          key_outputs?: string[] | null
          org_id: string
          partner_organisations?: string[] | null
          primary_focus_area?: string | null
          programme_name: string
          secondary_focus_areas?: string[] | null
          status?: string | null
          success_story?: string | null
          target_beneficiaries?: string | null
          year_started?: number | null
        }
        Update: {
          activities?: string[] | null
          annual_budget_range?: string | null
          annual_reach?: number | null
          approach_methodology?: string | null
          challenges_faced?: string | null
          created_at?: string | null
          description?: string | null
          detailed_description?: string | null
          geographic_areas?: string[] | null
          id?: string
          intervention_approaches?: string[] | null
          key_outcomes?: string[] | null
          key_outputs?: string[] | null
          org_id?: string
          partner_organisations?: string[] | null
          primary_focus_area?: string | null
          programme_name?: string
          secondary_focus_areas?: string[] | null
          status?: string | null
          success_story?: string | null
          target_beneficiaries?: string | null
          year_started?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "programme_details_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_comments: {
        Row: {
          content: string
          created_at: string | null
          created_by: string
          id: string
          proposal_id: string
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          section_key: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by: string
          id?: string
          proposal_id: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          section_key?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string
          id?: string
          proposal_id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          section_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_comments_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_scores: {
        Row: {
          budget_score: number | null
          created_at: string | null
          executive_summary_score: number | null
          feedback_json: Json | null
          id: string
          impact_score: number | null
          methodology_score: number | null
          objectives_score: number | null
          organisation_score: number | null
          overall_score: number | null
          problem_statement_score: number | null
          proposal_id: string
          recommendations: string[] | null
        }
        Insert: {
          budget_score?: number | null
          created_at?: string | null
          executive_summary_score?: number | null
          feedback_json?: Json | null
          id?: string
          impact_score?: number | null
          methodology_score?: number | null
          objectives_score?: number | null
          organisation_score?: number | null
          overall_score?: number | null
          problem_statement_score?: number | null
          proposal_id: string
          recommendations?: string[] | null
        }
        Update: {
          budget_score?: number | null
          created_at?: string | null
          executive_summary_score?: number | null
          feedback_json?: Json | null
          id?: string
          impact_score?: number | null
          methodology_score?: number | null
          objectives_score?: number | null
          organisation_score?: number | null
          overall_score?: number | null
          problem_statement_score?: number | null
          proposal_id?: string
          recommendations?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_scores_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_versions: {
        Row: {
          change_summary: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          id: string
          proposal_id: string
          version_number: number
          word_count: number | null
        }
        Insert: {
          change_summary?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          proposal_id: string
          version_number: number
          word_count?: number | null
        }
        Update: {
          change_summary?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          proposal_id?: string
          version_number?: number
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_versions_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          ai_feedback: string | null
          ai_score: number | null
          application_id: string | null
          approved_at: string | null
          created_at: string | null
          draft_content: string | null
          form_prep_content: Json | null
          format: string | null
          funder_id: string | null
          funder_requirements: string | null
          id: string
          org_id: string | null
          reviewed_by: string | null
          sections: Json | null
          status: string | null
          target_word_count: number | null
          version: number | null
          word_count: number | null
        }
        Insert: {
          ai_feedback?: string | null
          ai_score?: number | null
          application_id?: string | null
          approved_at?: string | null
          created_at?: string | null
          draft_content?: string | null
          form_prep_content?: Json | null
          format?: string | null
          funder_id?: string | null
          funder_requirements?: string | null
          id?: string
          org_id?: string | null
          reviewed_by?: string | null
          sections?: Json | null
          status?: string | null
          target_word_count?: number | null
          version?: number | null
          word_count?: number | null
        }
        Update: {
          ai_feedback?: string | null
          ai_score?: number | null
          application_id?: string | null
          approved_at?: string | null
          created_at?: string | null
          draft_content?: string | null
          form_prep_content?: Json | null
          format?: string | null
          funder_id?: string | null
          funder_requirements?: string | null
          id?: string
          org_id?: string | null
          reviewed_by?: string | null
          sections?: Json | null
          status?: string | null
          target_word_count?: number | null
          version?: number | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_funder_id_fkey"
            columns: ["funder_id"]
            isOneToOne: false
            referencedRelation: "funders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          environment: string
          id: string
          price_id: string | null
          product_id: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: string | null
          trial_end: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          environment?: string
          id?: string
          price_id?: string | null
          product_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          environment?: string
          id?: string
          price_id?: string | null
          product_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_requests: {
        Row: {
          conversation: Json | null
          created_at: string
          email: string
          id: string
          message: string
          name: string | null
          page_url: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          conversation?: Json | null
          created_at?: string
          email: string
          id?: string
          message: string
          name?: string | null
          page_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          conversation?: Json | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string | null
          page_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          application_id: string | null
          assigned_by: string | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          org_id: string
          priority: string | null
          proposal_id: string | null
          status: string | null
          title: string
        }
        Insert: {
          application_id?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          org_id: string
          priority?: string | null
          proposal_id?: string | null
          status?: string | null
          title: string
        }
        Update: {
          application_id?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          org_id?: string
          priority?: string | null
          proposal_id?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          accepted: boolean | null
          created_at: string | null
          expires_at: string | null
          id: string
          invite_token: string | null
          invited_email: string
          org_id: string
          role: string
        }
        Insert: {
          accepted?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invite_token?: string | null
          invited_email: string
          org_id: string
          role?: string
        }
        Update: {
          accepted?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invite_token?: string | null
          invited_email?: string
          org_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          org_id: string
          role: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          org_id: string
          role?: string
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          org_id?: string
          role?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          avatar_url: string | null
          email: string
          full_name: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          last_active: string | null
          org_id: string
          role: string
          status: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          email: string
          full_name?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          last_active?: string | null
          org_id: string
          role?: string
          status?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          email?: string
          full_name?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          last_active?: string | null
          org_id?: string
          role?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          committed_to_pay: boolean | null
          country: string | null
          created_at: string | null
          email: string
          id: string
          name: string | null
          organisation: string | null
          position: number | null
          referral_source: string | null
          role: string | null
        }
        Insert: {
          committed_to_pay?: boolean | null
          country?: string | null
          created_at?: string | null
          email: string
          id?: string
          name?: string | null
          organisation?: string | null
          position?: number | null
          referral_source?: string | null
          role?: string | null
        }
        Update: {
          committed_to_pay?: boolean | null
          country?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          organisation?: string | null
          position?: number | null
          referral_source?: string | null
          role?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      pipeline_summary: {
        Row: {
          kanban_column: string | null
          nearest_deadline: string | null
          opportunity_count: number | null
          org_id: string | null
          total_awarded: number | null
          total_requested: number | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_velocity: {
        Row: {
          avg_days_in_stage: number | null
          kanban_column: string | null
          org_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_team_invite: { Args: { _token: string }; Returns: Json }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_access_state: { Args: { _env?: string }; Returns: Json }
      has_active_subscription: {
        Args: { _env?: string; _user_id: string }
        Returns: boolean
      }
      has_org_role: {
        Args: { _min_role: string; _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      automation_action:
        | "create_task"
        | "send_notification"
        | "send_email_draft"
        | "move_kanban_column"
      automation_trigger:
        | "application_submitted"
        | "application_won"
        | "application_lost"
        | "deadline_approaching_7d"
        | "deadline_approaching_1d"
        | "no_reply_after_14d"
        | "no_activity_after_30d"
      email_provider: "gmail" | "outlook" | "smtp"
      email_thread_direction: "inbound" | "outbound"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      automation_action: [
        "create_task",
        "send_notification",
        "send_email_draft",
        "move_kanban_column",
      ],
      automation_trigger: [
        "application_submitted",
        "application_won",
        "application_lost",
        "deadline_approaching_7d",
        "deadline_approaching_1d",
        "no_reply_after_14d",
        "no_activity_after_30d",
      ],
      email_provider: ["gmail", "outlook", "smtp"],
      email_thread_direction: ["inbound", "outbound"],
    },
  },
} as const
