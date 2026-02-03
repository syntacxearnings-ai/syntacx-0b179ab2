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
      fixed_costs: {
        Row: {
          amount_monthly: number
          category: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_monthly?: number
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_monthly?: number
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          end_date: string
          id: string
          margin_goal: number
          orders_goal: number
          period: string
          profit_goal: number
          revenue_goal: number
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          margin_goal?: number
          orders_goal?: number
          period: string
          profit_goal?: number
          revenue_goal?: number
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          margin_goal?: number
          orders_goal?: number
          period?: string
          profit_goal?: number
          revenue_goal?: number
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          available: number
          id: string
          min_stock: number
          product_id: string | null
          reserved: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available?: number
          id?: string
          min_stock?: number
          product_id?: string | null
          reserved?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available?: number
          id?: string
          min_stock?: number
          product_id?: string | null
          reserved?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string
          id: string
          movement_type: string
          note: string | null
          product_id: string | null
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          movement_type: string
          note?: string | null
          product_id?: string | null
          quantity: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          movement_type?: string
          note?: string | null
          product_id?: string | null
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      mercadolivre_integrations: {
        Row: {
          access_token: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          ml_user_id: string
          nickname: string | null
          refresh_token: string | null
          site_id: string | null
          token_expires_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          ml_user_id: string
          nickname?: string | null
          refresh_token?: string | null
          site_id?: string | null
          token_expires_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          ml_user_id?: string
          nickname?: string | null
          refresh_token?: string | null
          site_id?: string | null
          token_expires_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      oauth_states: {
        Row: {
          client_id: string
          client_secret: string
          created_at: string
          expires_at: string
          id: string
          redirect_uri: string
          state: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          client_id: string
          client_secret: string
          created_at?: string
          expires_at?: string
          id?: string
          redirect_uri: string
          state: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string
          client_secret?: string
          created_at?: string
          expires_at?: string
          id?: string
          redirect_uri?: string
          state?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          ml_item_id: string | null
          order_id: string | null
          product_name: string
          quantity: number
          sku: string | null
          unit_cost: number
          unit_discount: number
          unit_price: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ml_item_id?: string | null
          order_id?: string | null
          product_name: string
          quantity?: number
          sku?: string | null
          unit_cost?: number
          unit_discount?: number
          unit_price?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ml_item_id?: string | null
          order_id?: string | null
          product_name?: string
          quantity?: number
          sku?: string | null
          unit_cost?: number
          unit_discount?: number
          unit_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          ads_total: number
          buyer_nickname: string | null
          created_at: string
          date_created: string
          discounts_total: number
          fee_discount_total: number
          fees_total: number
          gross_total: number
          id: string
          order_id_ml: string
          packaging_cost: number
          processing_cost: number
          shipping_seller: number
          shipping_total: number
          status: string
          taxes_total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ads_total?: number
          buyer_nickname?: string | null
          created_at?: string
          date_created: string
          discounts_total?: number
          fee_discount_total?: number
          fees_total?: number
          gross_total?: number
          id?: string
          order_id_ml: string
          packaging_cost?: number
          processing_cost?: number
          shipping_seller?: number
          shipping_total?: number
          status?: string
          taxes_total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ads_total?: number
          buyer_nickname?: string | null
          created_at?: string
          date_created?: string
          discounts_total?: number
          fee_discount_total?: number
          fees_total?: number
          gross_total?: number
          id?: string
          order_id_ml?: string
          packaging_cost?: number
          processing_cost?: number
          shipping_seller?: number
          shipping_total?: number
          status?: string
          taxes_total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          cost_unit: number
          created_at: string
          id: string
          ml_item_id: string | null
          name: string
          sku: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          cost_unit?: number
          created_at?: string
          id?: string
          ml_item_id?: string | null
          name: string
          sku: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          cost_unit?: number
          created_at?: string
          id?: string
          ml_item_id?: string | null
          name?: string
          sku?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          error_message: string | null
          finished_at: string | null
          id: string
          records_synced: number | null
          started_at: string
          status: string
          sync_type: string
          user_id: string
        }
        Insert: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          records_synced?: number | null
          started_at?: string
          status?: string
          sync_type?: string
          user_id: string
        }
        Update: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          records_synced?: number | null
          started_at?: string
          status?: string
          sync_type?: string
          user_id?: string
        }
        Relationships: []
      }
      variable_costs_config: {
        Row: {
          ads_percentage: number
          created_at: string
          id: string
          packaging_per_item: number
          packaging_per_order: number
          processing_per_order: number
          tax_percentage: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ads_percentage?: number
          created_at?: string
          id?: string
          packaging_per_item?: number
          packaging_per_order?: number
          processing_per_order?: number
          tax_percentage?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ads_percentage?: number
          created_at?: string
          id?: string
          packaging_per_item?: number
          packaging_per_order?: number
          processing_per_order?: number
          tax_percentage?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
