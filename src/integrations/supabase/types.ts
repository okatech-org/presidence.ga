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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      analytics_voice_events: {
        Row: {
          at: string
          data: Json | null
          event_type: string
          id: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          at?: string
          data?: Json | null
          event_type: string
          id?: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          at?: string
          data?: Json | null
          event_type?: string
          id?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_voice_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_messages: {
        Row: {
          audio_url: string | null
          content: string
          created_at: string
          id: string
          latency_ms: number | null
          role: string
          session_id: string
          tokens: number | null
        }
        Insert: {
          audio_url?: string | null
          content: string
          created_at?: string
          id?: string
          latency_ms?: number | null
          role: string
          session_id: string
          tokens?: number | null
        }
        Update: {
          audio_url?: string | null
          content?: string
          created_at?: string
          id?: string
          latency_ms?: number | null
          role?: string
          session_id?: string
          tokens?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          focus_mode: string | null
          id: string
          memory_summary: string | null
          settings: Json | null
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          focus_mode?: string | null
          id?: string
          memory_summary?: string | null
          settings?: Json | null
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          focus_mode?: string | null
          id?: string
          memory_summary?: string | null
          settings?: Json | null
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      iasted_config: {
        Row: {
          agent_id: string | null
          agent_name: string | null
          created_at: string
          default_voice_id: string | null
          id: string
          minister_voice_id: string | null
          president_voice_id: string | null
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          agent_name?: string | null
          created_at?: string
          default_voice_id?: string | null
          id?: string
          minister_voice_id?: string | null
          president_voice_id?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          agent_name?: string | null
          created_at?: string
          default_voice_id?: string | null
          id?: string
          minister_voice_id?: string | null
          president_voice_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      institution_performance: {
        Row: {
          cas_traites: number | null
          created_at: string | null
          id: string
          institution_name: string
          ministere: string | null
          periode_debut: string | null
          periode_fin: string | null
          score_performance: number | null
          taux_resolution: number | null
        }
        Insert: {
          cas_traites?: number | null
          created_at?: string | null
          id?: string
          institution_name: string
          ministere?: string | null
          periode_debut?: string | null
          periode_fin?: string | null
          score_performance?: number | null
          taux_resolution?: number | null
        }
        Update: {
          cas_traites?: number | null
          created_at?: string | null
          id?: string
          institution_name?: string
          ministere?: string | null
          periode_debut?: string | null
          periode_fin?: string | null
          score_performance?: number | null
          taux_resolution?: number | null
        }
        Relationships: []
      }
      national_kpis: {
        Row: {
          cas_critiques: number | null
          created_at: string | null
          date: string
          fonds_recuperes_fcfa: number | null
          id: string
          indice_transparence: number | null
          satisfaction_publique: number | null
          signalements_totaux: number | null
          taux_resolution: number | null
        }
        Insert: {
          cas_critiques?: number | null
          created_at?: string | null
          date?: string
          fonds_recuperes_fcfa?: number | null
          id?: string
          indice_transparence?: number | null
          satisfaction_publique?: number | null
          signalements_totaux?: number | null
          taux_resolution?: number | null
        }
        Update: {
          cas_critiques?: number | null
          created_at?: string | null
          date?: string
          fonds_recuperes_fcfa?: number | null
          id?: string
          indice_transparence?: number | null
          satisfaction_publique?: number | null
          signalements_totaux?: number | null
          taux_resolution?: number | null
        }
        Relationships: []
      }
      opinion_publique: {
        Row: {
          created_at: string | null
          date: string
          id: string
          preoccupations: Json | null
          satisfaction_globale: number | null
          sentiment_insatisfaits: number | null
          sentiment_neutres: number | null
          sentiment_satisfaits: number | null
        }
        Insert: {
          created_at?: string | null
          date?: string
          id?: string
          preoccupations?: Json | null
          satisfaction_globale?: number | null
          sentiment_insatisfaits?: number | null
          sentiment_neutres?: number | null
          sentiment_satisfaits?: number | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          preoccupations?: Json | null
          satisfaction_globale?: number | null
          sentiment_insatisfaits?: number | null
          sentiment_neutres?: number | null
          sentiment_satisfaits?: number | null
        }
        Relationships: []
      }
      presidential_decisions: {
        Row: {
          created_at: string | null
          decision_data: Json | null
          decision_type: string
          id: string
          motif: string | null
          president_user_id: string
          signalement_id: string | null
        }
        Insert: {
          created_at?: string | null
          decision_data?: Json | null
          decision_type: string
          id?: string
          motif?: string | null
          president_user_id: string
          signalement_id?: string | null
        }
        Update: {
          created_at?: string | null
          decision_data?: Json | null
          decision_type?: string
          id?: string
          motif?: string | null
          president_user_id?: string
          signalement_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "presidential_decisions_signalement_id_fkey"
            columns: ["signalement_id"]
            isOneToOne: false
            referencedRelation: "signalements"
            referencedColumns: ["id"]
          },
        ]
      }
      role_feedback: {
        Row: {
          created_at: string | null
          document_paths: string[] | null
          id: string
          implementation_suggestions: string | null
          role_description: string
          role_name: string
          status: string | null
          user_email: string
          work_description: string
        }
        Insert: {
          created_at?: string | null
          document_paths?: string[] | null
          id?: string
          implementation_suggestions?: string | null
          role_description: string
          role_name: string
          status?: string | null
          user_email: string
          work_description: string
        }
        Update: {
          created_at?: string | null
          document_paths?: string[] | null
          id?: string
          implementation_suggestions?: string | null
          role_description?: string
          role_name?: string
          status?: string | null
          user_email?: string
          work_description?: string
        }
        Relationships: []
      }
      signalements: {
        Row: {
          analyse_ia: string | null
          categorie: string
          code: string
          created_at: string | null
          created_by: string | null
          description: string | null
          grade_fonctionnaire: string | null
          id: string
          implique_haut_fonctionnaire: boolean | null
          montant_fcfa: number | null
          preuves: Json | null
          province: string | null
          recommandation_ia: string | null
          score_priorite_ia: number | null
          secteur: string | null
          statut: string | null
          temoins: Json | null
          titre: string
          updated_at: string | null
        }
        Insert: {
          analyse_ia?: string | null
          categorie: string
          code: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          grade_fonctionnaire?: string | null
          id?: string
          implique_haut_fonctionnaire?: boolean | null
          montant_fcfa?: number | null
          preuves?: Json | null
          province?: string | null
          recommandation_ia?: string | null
          score_priorite_ia?: number | null
          secteur?: string | null
          statut?: string | null
          temoins?: Json | null
          titre: string
          updated_at?: string | null
        }
        Update: {
          analyse_ia?: string | null
          categorie?: string
          code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          grade_fonctionnaire?: string | null
          id?: string
          implique_haut_fonctionnaire?: boolean | null
          montant_fcfa?: number | null
          preuves?: Json | null
          province?: string | null
          recommandation_ia?: string | null
          score_priorite_ia?: number | null
          secteur?: string | null
          statut?: string | null
          temoins?: Json | null
          titre?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          updated_at: string
          user_id: string
          voice_continuous_mode: boolean | null
          voice_id: string | null
          voice_push_to_talk: boolean | null
          voice_silence_duration: number | null
          voice_silence_threshold: number | null
        }
        Insert: {
          created_at?: string
          updated_at?: string
          user_id: string
          voice_continuous_mode?: boolean | null
          voice_id?: string | null
          voice_push_to_talk?: boolean | null
          voice_silence_duration?: number | null
          voice_silence_threshold?: number | null
        }
        Update: {
          created_at?: string
          updated_at?: string
          user_id?: string
          voice_continuous_mode?: boolean | null
          voice_id?: string | null
          voice_push_to_talk?: boolean | null
          voice_silence_duration?: number | null
          voice_silence_threshold?: number | null
        }
        Relationships: []
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
      voice_presets: {
        Row: {
          created_at: string
          id: string
          is_default: boolean | null
          name: string
          updated_at: string
          user_id: string
          voice_continuous_mode: boolean | null
          voice_id: string
          voice_silence_duration: number | null
          voice_silence_threshold: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string
          user_id: string
          voice_continuous_mode?: boolean | null
          voice_id: string
          voice_silence_duration?: number | null
          voice_silence_threshold?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
          voice_continuous_mode?: boolean | null
          voice_id?: string
          voice_silence_duration?: number | null
          voice_silence_threshold?: number | null
        }
        Relationships: []
      }
      ministerial_projects: {
        Row: {
          id: string
          ministry: string
          project: string
          status: "en_cours" | "termine" | "bloque"
          progress: number
          deadline: string
          priority: "haute" | "moyenne" | "basse"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ministry: string
          project: string
          status: "en_cours" | "termine" | "bloque"
          progress?: number
          deadline: string
          priority: "haute" | "moyenne" | "basse"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ministry?: string
          project?: string
          status?: "en_cours" | "termine" | "bloque"
          progress?: number
          deadline?: string
          priority?: "haute" | "moyenne" | "basse"
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      presidential_instructions: {
        Row: {
          id: string
          instruction: string
          assigned_to: string
          status: "pending" | "in_progress" | "completed"
          due_date: string
          priority: "critical" | "high" | "normal"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          instruction: string
          assigned_to: string
          status: "pending" | "in_progress" | "completed"
          due_date: string
          priority: "critical" | "high" | "normal"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          instruction?: string
          assigned_to?: string
          status?: "pending" | "in_progress" | "completed"
          due_date?: string
          priority?: "critical" | "high" | "normal"
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      interministerial_coordination: {
        Row: {
          id: string
          title: string
          description: string | null
          date: string
          type: "reunion" | "blocage"
          participants: string[] | null
          status: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          date: string
          type: "reunion" | "blocage"
          participants?: string[] | null
          status?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          date?: string
          type?: "reunion" | "blocage"
          participants?: string[] | null
          status?: string | null
          created_at?: string
        }
        Relationships: []
      }
      conseil_ministers: {
        Row: {
          id: string
          date: string
          title: string
          agenda: Json | null
          decisions: Json | null
          execution_rate: number | null
          status: string | null
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          title: string
          agenda?: Json | null
          decisions?: Json | null
          execution_rate?: number | null
          status?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          title?: string
          agenda?: Json | null
          decisions?: Json | null
          execution_rate?: number | null
          status?: string | null
          created_at?: string
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
      is_president: { Args: { user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "president" | "dgss" | "dgr" | "minister" | "user"
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
      app_role: ["admin", "president", "dgss", "dgr", "minister", "user"],
    },
  },
} as const
