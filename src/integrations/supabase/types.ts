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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      category_settings: {
        Row: {
          category: Database["public"]["Enums"]["service_category"]
          color: string | null
          condominium_id: string
          created_at: string
          custom_label: string | null
          display_order: number
          enabled: boolean
          icon_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["service_category"]
          color?: string | null
          condominium_id: string
          created_at?: string
          custom_label?: string | null
          display_order?: number
          enabled?: boolean
          icon_name?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["service_category"]
          color?: string | null
          condominium_id?: string
          created_at?: string
          custom_label?: string | null
          display_order?: number
          enabled?: boolean
          icon_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_settings_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      condominiums: {
        Row: {
          address: string
          cnpj: string
          created_at: string
          email: string
          id: string
          logo_url: string | null
          name: string
          phone: string
          status: Database["public"]["Enums"]["condominium_status"]
          updated_at: string
        }
        Insert: {
          address: string
          cnpj: string
          created_at?: string
          email: string
          id?: string
          logo_url?: string | null
          name: string
          phone: string
          status?: Database["public"]["Enums"]["condominium_status"]
          updated_at?: string
        }
        Update: {
          address?: string
          cnpj?: string
          created_at?: string
          email?: string
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string
          status?: Database["public"]["Enums"]["condominium_status"]
          updated_at?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          condominium_id: string
          created_at: string
          email_enabled: boolean
          id: string
          notify_call_completed: boolean
          notify_monthly_summary: boolean
          notify_new_quote: boolean
          notify_resolution_alerts: boolean
          notify_weekly_summary: boolean
          preferred_time: string
          updated_at: string
          whatsapp_enabled: boolean
        }
        Insert: {
          condominium_id: string
          created_at?: string
          email_enabled?: boolean
          id?: string
          notify_call_completed?: boolean
          notify_monthly_summary?: boolean
          notify_new_quote?: boolean
          notify_resolution_alerts?: boolean
          notify_weekly_summary?: boolean
          preferred_time?: string
          updated_at?: string
          whatsapp_enabled?: boolean
        }
        Update: {
          condominium_id?: string
          created_at?: string
          email_enabled?: boolean
          id?: string
          notify_call_completed?: boolean
          notify_monthly_summary?: boolean
          notify_new_quote?: boolean
          notify_resolution_alerts?: boolean
          notify_weekly_summary?: boolean
          preferred_time?: string
          updated_at?: string
          whatsapp_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: true
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          condominium_id: string | null
          created_at: string
          email: string
          id: string
          name: string
          position: Database["public"]["Enums"]["user_position"] | null
          updated_at: string
        }
        Insert: {
          condominium_id?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          position?: Database["public"]["Enums"]["user_position"] | null
          updated_at?: string
        }
        Update: {
          condominium_id?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          position?: Database["public"]["Enums"]["user_position"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      resolution_time_alerts: {
        Row: {
          category: Database["public"]["Enums"]["service_category"]
          condominium_id: string
          created_at: string
          enabled: boolean
          id: string
          max_resolution_days: number
          updated_at: string
          warning_threshold_days: number
        }
        Insert: {
          category: Database["public"]["Enums"]["service_category"]
          condominium_id: string
          created_at?: string
          enabled?: boolean
          id?: string
          max_resolution_days?: number
          updated_at?: string
          warning_threshold_days?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["service_category"]
          condominium_id?: string
          created_at?: string
          enabled?: boolean
          id?: string
          max_resolution_days?: number
          updated_at?: string
          warning_threshold_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "resolution_time_alerts_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      service_call_photos: {
        Row: {
          id: string
          photo_url: string
          service_call_id: string
          type: Database["public"]["Enums"]["photo_type"]
          uploaded_at: string
        }
        Insert: {
          id?: string
          photo_url: string
          service_call_id: string
          type?: Database["public"]["Enums"]["photo_type"]
          uploaded_at?: string
        }
        Update: {
          id?: string
          photo_url?: string
          service_call_id?: string
          type?: Database["public"]["Enums"]["photo_type"]
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_call_photos_service_call_id_fkey"
            columns: ["service_call_id"]
            isOneToOne: false
            referencedRelation: "service_calls"
            referencedColumns: ["id"]
          },
        ]
      }
      service_calls: {
        Row: {
          actual_value: number | null
          category: Database["public"]["Enums"]["service_category"]
          completion_notes: string | null
          condominium_id: string
          created_at: string
          created_by: string | null
          description: string
          estimated_completion_date: string | null
          estimated_time: string | null
          estimated_value: number | null
          id: string
          location: string
          provider_id: string | null
          rating: number | null
          rating_comment: string | null
          status: Database["public"]["Enums"]["call_status"]
          title: string
          updated_at: string
          urgency: Database["public"]["Enums"]["urgency_level"]
        }
        Insert: {
          actual_value?: number | null
          category: Database["public"]["Enums"]["service_category"]
          completion_notes?: string | null
          condominium_id: string
          created_at?: string
          created_by?: string | null
          description: string
          estimated_completion_date?: string | null
          estimated_time?: string | null
          estimated_value?: number | null
          id?: string
          location: string
          provider_id?: string | null
          rating?: number | null
          rating_comment?: string | null
          status?: Database["public"]["Enums"]["call_status"]
          title: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
        }
        Update: {
          actual_value?: number | null
          category?: Database["public"]["Enums"]["service_category"]
          completion_notes?: string | null
          condominium_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          estimated_completion_date?: string | null
          estimated_time?: string | null
          estimated_value?: number | null
          id?: string
          location?: string
          provider_id?: string | null
          rating?: number | null
          rating_comment?: string | null
          status?: Database["public"]["Enums"]["call_status"]
          title?: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
        }
        Relationships: [
          {
            foreignKeyName: "service_calls_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_calls_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_providers: {
        Row: {
          average_rating: number | null
          categories: Database["public"]["Enums"]["service_category"][]
          condominium_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          phone_whatsapp: string
          total_ratings: number | null
          updated_at: string
        }
        Insert: {
          average_rating?: number | null
          categories?: Database["public"]["Enums"]["service_category"][]
          condominium_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone_whatsapp: string
          total_ratings?: number | null
          updated_at?: string
        }
        Update: {
          average_rating?: number | null
          categories?: Database["public"]["Enums"]["service_category"][]
          condominium_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone_whatsapp?: string
          total_ratings?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_providers_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      temporary_links: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          service_call_id: string
          token: string
          type: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          service_call_id: string
          token?: string
          type: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          service_call_id?: string
          token?: string
          type?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "temporary_links_service_call_id_fkey"
            columns: ["service_call_id"]
            isOneToOne: false
            referencedRelation: "service_calls"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invitations: {
        Row: {
          accepted_at: string | null
          condominium_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          position: Database["public"]["Enums"]["user_position"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          condominium_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          position: Database["public"]["Enums"]["user_position"]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          condominium_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          position?: Database["public"]["Enums"]["user_position"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_invitations_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      get_user_condominium_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "manager"
      call_status:
        | "open"
        | "sent"
        | "awaiting_approval"
        | "in_progress"
        | "completed"
        | "cancelled"
      condominium_status: "pending" | "approved" | "rejected"
      photo_type: "initial" | "completion"
      service_category:
        | "encanador"
        | "eletricista"
        | "pintor"
        | "jardineiro"
        | "limpeza"
        | "chaveiro"
        | "vidraceiro"
        | "porteiro"
        | "outros"
      urgency_level: "low" | "medium" | "high" | "critical"
      user_position: "sindico" | "zelador"
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
      app_role: ["super_admin", "manager"],
      call_status: [
        "open",
        "sent",
        "awaiting_approval",
        "in_progress",
        "completed",
        "cancelled",
      ],
      condominium_status: ["pending", "approved", "rejected"],
      photo_type: ["initial", "completion"],
      service_category: [
        "encanador",
        "eletricista",
        "pintor",
        "jardineiro",
        "limpeza",
        "chaveiro",
        "vidraceiro",
        "porteiro",
        "outros",
      ],
      urgency_level: ["low", "medium", "high", "critical"],
      user_position: ["sindico", "zelador"],
    },
  },
} as const
