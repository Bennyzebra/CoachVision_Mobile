export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      coach_profiles: {
        Row: {
          avatar_url: string | null
          coach_name: string | null
          created_at: string
          email: string | null
          id: string
          organization: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          coach_name?: string | null
          created_at?: string
          email?: string | null
          id: string
          organization?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          coach_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          organization?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          status: string | null
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          status?: string | null
          text: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          status?: string | null
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shared_items"
            referencedColumns: ["id"]
          },
        ]
      }
      drill_feedback: {
        Row: {
          coach_id: string
          comment: string | null
          created_at: string | null
          drill_id: string
          id: string
          mood: string
          practice_plan_id: string | null
        }
        Insert: {
          coach_id: string
          comment?: string | null
          created_at?: string | null
          drill_id: string
          id?: string
          mood: string
          practice_plan_id?: string | null
        }
        Update: {
          coach_id?: string
          comment?: string | null
          created_at?: string | null
          drill_id?: string
          id?: string
          mood?: string
          practice_plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drill_feedback_drill_id_fkey"
            columns: ["drill_id"]
            isOneToOne: false
            referencedRelation: "drills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drill_feedback_practice_plan_id_fkey"
            columns: ["practice_plan_id"]
            isOneToOne: false
            referencedRelation: "practice_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      drills: {
        Row: {
          coach_id: string
          created_at: string | null
          cues: string[] | null
          description: string
          duration: number
          focus: string
          id: string
          intensity: number | null
          is_template: boolean | null
          level: string | null
          max_players: number | null
          media_url: string | null
          min_players: number | null
          name: string
          optimal_group_size: number | null
          positions_emphasis: Json | null
          rating: number | null
          requires_full_court: boolean | null
          tags: string[] | null
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          coach_id: string
          created_at?: string | null
          cues?: string[] | null
          description: string
          duration?: number
          focus: string
          id?: string
          intensity?: number | null
          is_template?: boolean | null
          level?: string | null
          max_players?: number | null
          media_url?: string | null
          min_players?: number | null
          name: string
          optimal_group_size?: number | null
          positions_emphasis?: Json | null
          rating?: number | null
          requires_full_court?: boolean | null
          tags?: string[] | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          coach_id?: string
          created_at?: string | null
          cues?: string[] | null
          description?: string
          duration?: number
          focus?: string
          id?: string
          intensity?: number | null
          is_template?: boolean | null
          level?: string | null
          max_players?: number | null
          media_url?: string | null
          min_players?: number | null
          name?: string
          optimal_group_size?: number | null
          positions_emphasis?: Json | null
          rating?: number | null
          requires_full_court?: boolean | null
          tags?: string[] | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "drills_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          followed_id: string
          follower_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          followed_id: string
          follower_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          followed_id?: string
          follower_id?: string
          id?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shared_items"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          attendance: Json | null
          created_at: string | null
          experience: string | null
          height: string
          id: string
          name: string
          position: string | null
          team_id: string
        }
        Insert: {
          attendance?: Json | null
          created_at?: string | null
          experience?: string | null
          height: string
          id?: string
          name: string
          position?: string | null
          team_id: string
        }
        Update: {
          attendance?: Json | null
          created_at?: string | null
          experience?: string | null
          height?: string
          id?: string
          name?: string
          position?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_plan_items: {
        Row: {
          drill_id: string
          duration: number
          groups: Json | null
          id: string
          notes: string | null
          order_index: number
          practice_plan_id: string
        }
        Insert: {
          drill_id: string
          duration: number
          groups?: Json | null
          id?: string
          notes?: string | null
          order_index: number
          practice_plan_id: string
        }
        Update: {
          drill_id?: string
          duration?: number
          groups?: Json | null
          id?: string
          notes?: string | null
          order_index?: number
          practice_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_plan_items_drill_id_fkey"
            columns: ["drill_id"]
            isOneToOne: false
            referencedRelation: "drills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_plan_items_practice_plan_id_fkey"
            columns: ["practice_plan_id"]
            isOneToOne: false
            referencedRelation: "practice_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_plans: {
        Row: {
          coach_id: string
          completed: boolean | null
          created_at: string | null
          date: string
          id: string
          name: string
          notes: string | null
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          coach_id: string
          completed?: boolean | null
          created_at?: string | null
          date?: string
          id?: string
          name: string
          notes?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          coach_id?: string
          completed?: boolean | null
          created_at?: string | null
          date?: string
          id?: string
          name?: string
          notes?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_plans_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_plans_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
       practice_drill_outcomes: {
        Row: {
          avg_completion_percent: number
          avg_feedback_rating: number
          coach_id: string
          created_at: string
          drill_id: string
          feedback_count: number
          id: string
          last_feedback_notes: string | null
          last_feedback_rating: number | null
          team_id: string
          total_completed: number
          total_sessions: number
          updated_at: string
        }
        Insert: {
          avg_completion_percent?: number
          avg_feedback_rating?: number
          coach_id: string
          created_at?: string
          drill_id: string
          feedback_count?: number
          id?: string
          last_feedback_notes?: string | null
          last_feedback_rating?: number | null
          team_id: string
          total_completed?: number
          total_sessions?: number
          updated_at?: string
        }
        Update: {
          avg_completion_percent?: number
          avg_feedback_rating?: number
          coach_id?: string
          created_at?: string
          drill_id?: string
          feedback_count?: number
          id?: string
          last_feedback_notes?: string | null
          last_feedback_rating?: number | null
          team_id?: string
          total_completed?: number
          total_sessions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_drill_outcomes_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_drill_outcomes_drill_id_fkey"
            columns: ["drill_id"]
            isOneToOne: false
            referencedRelation: "drills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_drill_outcomes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          coach_name: string
          created_at: string | null
          email: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          coach_name: string
          created_at?: string | null
          email?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          coach_name?: string
          created_at?: string | null
          email?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          reason: string
          reporter_user_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          reason: string
          reporter_user_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          reason?: string
          reporter_user_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shared_items"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_items: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shared_items"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_items: {
        Row: {
          age_levels: string[] | null
          attribution: Json | null
          created_at: string | null
          duration_mins: number | null
          equipment: string[] | null
          forks_count: number | null
          id: string
          item_type: string
          media: Json | null
          owner_user_id: string
          rating: number | null
          saves_count: number | null
          skill_focus: string[] | null
          source_ref: Json | null
          sponsor_meta: Json | null
          sponsored: boolean | null
          status: string | null
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          used_in_plans_count: number | null
          views_count: number | null
          visibility: string
        }
        Insert: {
          age_levels?: string[] | null
          attribution?: Json | null
          created_at?: string | null
          duration_mins?: number | null
          equipment?: string[] | null
          forks_count?: number | null
          id?: string
          item_type: string
          media?: Json | null
          owner_user_id: string
          rating?: number | null
          saves_count?: number | null
          skill_focus?: string[] | null
          source_ref?: Json | null
          sponsor_meta?: Json | null
          sponsored?: boolean | null
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          used_in_plans_count?: number | null
          views_count?: number | null
          visibility?: string
        }
        Update: {
          age_levels?: string[] | null
          attribution?: Json | null
          created_at?: string | null
          duration_mins?: number | null
          equipment?: string[] | null
          forks_count?: number | null
          id?: string
          item_type?: string
          media?: Json | null
          owner_user_id?: string
          rating?: number | null
          saves_count?: number | null
          skill_focus?: string[] | null
          source_ref?: Json | null
          sponsor_meta?: Json | null
          sponsored?: boolean | null
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          used_in_plans_count?: number | null
          views_count?: number | null
          visibility?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          coach_id: string
          created_at: string | null
          id: string
          logo_url: string | null
          organization: string | null
          sport: string
          team_profile_summary: Json | null          
          team_name: string
          updated_at: string | null
        }
        Insert: {
          coach_id: string
          created_at?: string | null
          id?: string
          logo_url?: string | null
          organization?: string | null
          sport: string
          team_profile_summary?: Json | null          
          team_name: string
          updated_at?: string | null
        }
        Update: {
          coach_id?: string
          created_at?: string | null
          id?: string
          logo_url?: string | null
          organization?: string | null
          sport?: string
          team_profile_summary?: Json | null          
          team_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_coach_id_fkey"
            columns: ["coach_id"]
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
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "coach" | "org_admin" | "platform_admin"
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
      app_role: ["coach", "org_admin", "platform_admin"],
    },
  },
} as const
