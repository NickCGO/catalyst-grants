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
      applications: {
        Row: {
          activity_category: string | null
          amount_awarded: number | null
          amount_requested: number | null
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
          updated_at: string | null
        }
        Insert: {
          activity_category?: string | null
          amount_awarded?: number | null
          amount_requested?: number | null
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
          updated_at?: string | null
        }
        Update: {
          activity_category?: string | null
          amount_awarded?: number | null
          amount_requested?: number | null
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
      organisations: {
        Row: {
          country: string | null
          created_at: string | null
          focus_areas: string[] | null
          founded_year: number | null
          id: string
          logo_url: string | null
          mission_statement: string | null
          name: string
          onboarding_complete: boolean | null
          org_size: string | null
          programmes: string[] | null
          region: string | null
          registration_number: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          focus_areas?: string[] | null
          founded_year?: number | null
          id?: string
          logo_url?: string | null
          mission_statement?: string | null
          name: string
          onboarding_complete?: boolean | null
          org_size?: string | null
          programmes?: string[] | null
          region?: string | null
          registration_number?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          focus_areas?: string[] | null
          founded_year?: number | null
          id?: string
          logo_url?: string | null
          mission_statement?: string | null
          name?: string
          onboarding_complete?: boolean | null
          org_size?: string | null
          programmes?: string[] | null
          region?: string | null
          registration_number?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
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
    Enums: {},
  },
} as const
