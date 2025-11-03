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
      account_groups: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string
          icon: string | null
          id: string
          is_system: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by: string
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "account_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          account_group_id: string | null
          created_at: string | null
          created_by: string
          credit_limit: number | null
          current_balance: number | null
          escrow_amount: number | null
          id: string
          interest_rate: number | null
          is_archived: boolean | null
          mortgage_interest_rate: number | null
          mortgage_original_amount: number | null
          mortgage_start_date: string | null
          mortgage_term_months: number | null
          name: string
          next_payment_due_date: string | null
          opening_balance: number | null
          payment_due_day: number | null
          property_address: string | null
          statement_close_day: number | null
          type: string
          updated_at: string | null
          valuation_updated_at: string | null
        }
        Insert: {
          account_group_id?: string | null
          created_at?: string | null
          created_by: string
          credit_limit?: number | null
          current_balance?: number | null
          escrow_amount?: number | null
          id?: string
          interest_rate?: number | null
          is_archived?: boolean | null
          mortgage_interest_rate?: number | null
          mortgage_original_amount?: number | null
          mortgage_start_date?: string | null
          mortgage_term_months?: number | null
          name: string
          next_payment_due_date?: string | null
          opening_balance?: number | null
          payment_due_day?: number | null
          property_address?: string | null
          statement_close_day?: number | null
          type: string
          updated_at?: string | null
          valuation_updated_at?: string | null
        }
        Update: {
          account_group_id?: string | null
          created_at?: string | null
          created_by?: string
          credit_limit?: number | null
          current_balance?: number | null
          escrow_amount?: number | null
          id?: string
          interest_rate?: number | null
          is_archived?: boolean | null
          mortgage_interest_rate?: number | null
          mortgage_original_amount?: number | null
          mortgage_start_date?: string | null
          mortgage_term_months?: number | null
          name?: string
          next_payment_due_date?: string | null
          opening_balance?: number | null
          payment_due_day?: number | null
          property_address?: string | null
          statement_close_day?: number | null
          type?: string
          updated_at?: string | null
          valuation_updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_account_group_id_fkey"
            columns: ["account_group_id"]
            isOneToOne: false
            referencedRelation: "account_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          account_id: string
          amount: number
          category_id: string
          created_at: string | null
          created_by: string
          id: string
          name: string
          next_due: string | null
          notes: string | null
          payee_id: string | null
          rrule: string
          status: string
        }
        Insert: {
          account_id: string
          amount: number
          category_id: string
          created_at?: string | null
          created_by: string
          id?: string
          name: string
          next_due?: string | null
          notes?: string | null
          payee_id?: string | null
          rrule: string
          status?: string
        }
        Update: {
          account_id?: string
          amount?: number
          category_id?: string
          created_at?: string | null
          created_by?: string
          id?: string
          name?: string
          next_due?: string | null
          notes?: string | null
          payee_id?: string | null
          rrule?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_payee_id_fkey"
            columns: ["payee_id"]
            isOneToOne: false
            referencedRelation: "payees"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          carry: number | null
          category_id: string
          created_at: string | null
          created_by: string
          id: string
          model: string
          month: string
          target: number
        }
        Insert: {
          carry?: number | null
          category_id: string
          created_at?: string | null
          created_by: string
          id?: string
          model: string
          month: string
          target: number
        }
        Update: {
          carry?: number | null
          category_id?: string
          created_at?: string | null
          created_by?: string
          id?: string
          model?: string
          month?: string
          target?: number
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          is_budgetable: boolean | null
          is_debt_service: boolean | null
          is_envelope: boolean | null
          is_transfer: boolean | null
          name: string
          parent_id: string | null
          path: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          is_budgetable?: boolean | null
          is_debt_service?: boolean | null
          is_envelope?: boolean | null
          is_transfer?: boolean | null
          name: string
          parent_id?: string | null
          path?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          is_budgetable?: boolean | null
          is_debt_service?: boolean | null
          is_envelope?: boolean | null
          is_transfer?: boolean | null
          name?: string
          parent_id?: string | null
          path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      migrations_log: {
        Row: {
          created_by: string
          id: string
          kind: string
          mapping: Json
          run_at: string | null
        }
        Insert: {
          created_by: string
          id?: string
          kind: string
          mapping: Json
          run_at?: string | null
        }
        Update: {
          created_by?: string
          id?: string
          kind?: string
          mapping?: Json
          run_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "migrations_log_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      net_worth_snapshots: {
        Row: {
          account_count: number
          created_at: string | null
          created_by: string
          id: string
          net_worth: number
          notes: string | null
          snapshot_date: string
          total_assets: number
          total_liabilities: number
          updated_at: string | null
        }
        Insert: {
          account_count?: number
          created_at?: string | null
          created_by: string
          id?: string
          net_worth?: number
          notes?: string | null
          snapshot_date: string
          total_assets?: number
          total_liabilities?: number
          updated_at?: string | null
        }
        Update: {
          account_count?: number
          created_at?: string | null
          created_by?: string
          id?: string
          net_worth?: number
          notes?: string | null
          snapshot_date?: string
          total_assets?: number
          total_liabilities?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "net_worth_snapshots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payees: {
        Row: {
          created_at: string | null
          created_by: string
          default_account_id: string | null
          default_category_id: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          default_account_id?: string | null
          default_category_id?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          default_account_id?: string | null
          default_category_id?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "payees_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payees_default_account_id_fkey"
            columns: ["default_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payees_default_category_id_fkey"
            columns: ["default_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          birth_date: string
          id: string
          updated_at: string | null
        }
        Insert: {
          birth_date: string
          id: string
          updated_at?: string | null
        }
        Update: {
          birth_date?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      scenarios: {
        Row: {
          created_at: string | null
          created_by: string
          current_age: number
          death_date: string
          expenses: number | null
          id: string
          inflation: number | null
          life_expectancy: number
          mean_return_real: number | null
          name: string
          notes: string | null
          portfolio_stocks: number | null
          portfolio_value_now: number | null
          retirement_age: number
          retirement_date: string | null
          savings: number | null
          stdev_return_real: number | null
          swr: number | null
          use_historical: boolean | null
          use_monte_carlo: boolean | null
          withdrawal_rule: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          current_age?: number
          death_date: string
          expenses?: number | null
          id?: string
          inflation?: number | null
          life_expectancy?: number
          mean_return_real?: number | null
          name: string
          notes?: string | null
          portfolio_stocks?: number | null
          portfolio_value_now?: number | null
          retirement_age?: number
          retirement_date?: string | null
          savings?: number | null
          stdev_return_real?: number | null
          swr?: number | null
          use_historical?: boolean | null
          use_monte_carlo?: boolean | null
          withdrawal_rule: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          current_age?: number
          death_date?: string
          expenses?: number | null
          id?: string
          inflation?: number | null
          life_expectancy?: number
          mean_return_real?: number | null
          name?: string
          notes?: string | null
          portfolio_stocks?: number | null
          portfolio_value_now?: number | null
          retirement_age?: number
          retirement_date?: string | null
          savings?: number | null
          stdev_return_real?: number | null
          swr?: number | null
          use_historical?: boolean | null
          use_monte_carlo?: boolean | null
          withdrawal_rule?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string | null
          created_by: string
          export_prefs: Json | null
          feature_flags: Json | null
          id: string
          learning: Json | null
          selected_scenario_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          export_prefs?: Json | null
          feature_flags?: Json | null
          id?: string
          learning?: Json | null
          selected_scenario_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          export_prefs?: Json | null
          feature_flags?: Json | null
          id?: string
          learning?: Json | null
          selected_scenario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settings_selected_scenario_id_fkey"
            columns: ["selected_scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      snapshots: {
        Row: {
          created_at: string | null
          created_by: string
          data: Json
          id: string
          kind: string
          period: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          data: Json
          id?: string
          kind: string
          period: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          data?: Json
          id?: string
          kind?: string
          period?: string
        }
        Relationships: [
          {
            foreignKeyName: "snapshots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          category_id: string | null
          created_at: string | null
          created_by: string
          date: string
          id: string
          is_pending: boolean | null
          notes: string | null
          payee_id: string | null
          tags: string[] | null
          transaction_type: string
          transfer_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          amount: number
          category_id?: string | null
          created_at?: string | null
          created_by: string
          date: string
          id?: string
          is_pending?: boolean | null
          notes?: string | null
          payee_id?: string | null
          tags?: string[] | null
          transaction_type?: string
          transfer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          amount?: number
          category_id?: string | null
          created_at?: string | null
          created_by?: string
          date?: string
          id?: string
          is_pending?: boolean | null
          notes?: string | null
          payee_id?: string | null
          tags?: string[] | null
          transaction_type?: string
          transfer_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_payee_id_fkey"
            columns: ["payee_id"]
            isOneToOne: false
            referencedRelation: "payees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      recalculate_account_balance: {
        Args: { account_uuid: string }
        Returns: undefined
      }
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
