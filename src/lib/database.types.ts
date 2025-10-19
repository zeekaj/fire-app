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
      account_groups: {
        Row: {
          id: string
          created_by: string
          name: string
          icon: string | null
          color: string | null
          sort_order: number
          is_system: boolean
          created_at: string
        }
        Insert: {
          id?: string
          created_by: string
          name: string
          icon?: string | null
          color?: string | null
          sort_order?: number
          is_system?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          created_by?: string
          name?: string
          icon?: string | null
          color?: string | null
          sort_order?: number
          is_system?: boolean
          created_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          created_by: string
          name: string
          type: string // DEPRECATED: Use account_group_id instead. Kept for backward compatibility. Planned removal in v2.0
          account_group_id: string | null
          opening_balance: number
          current_balance: number
          valuation_updated_at: string | null
          is_archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_by: string
          name: string
          type: string // DEPRECATED: Use account_group_id instead. Kept for backward compatibility. Planned removal in v2.0
          account_group_id?: string | null
          opening_balance?: number
          current_balance?: number
          valuation_updated_at?: string | null
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_by?: string
          name?: string
          type?: string // DEPRECATED: Use account_group_id instead. Kept for backward compatibility. Planned removal in v2.0
          account_group_id?: string | null
          opening_balance?: number
          current_balance?: number
          valuation_updated_at?: string | null
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          created_by: string
          name: string
          parent_id: string | null
          path: string | null
          is_envelope: boolean
          is_budgetable: boolean
          is_transfer: boolean
          is_debt_service: boolean
          created_at: string
        }
        Insert: {
          id?: string
          created_by: string
          name: string
          parent_id?: string | null
          path?: string | null
          is_envelope?: boolean
          is_budgetable?: boolean
          is_transfer?: boolean
          is_debt_service?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          created_by?: string
          name?: string
          parent_id?: string | null
          path?: string | null
          is_envelope?: boolean
          is_budgetable?: boolean
          is_transfer?: boolean
          is_debt_service?: boolean
          created_at?: string
        }
      }
      payees: {
        Row: {
          id: string
          created_by: string
          name: string
          default_category_id: string | null
          default_account_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          created_by: string
          name: string
          default_category_id?: string | null
          default_account_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          created_by?: string
          name?: string
          default_category_id?: string | null
          default_account_id?: string | null
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          created_by: string
          date: string
          account_id: string
          amount: number
          payee_id: string | null
          category_id: string | null
          tags: string[]
          notes: string | null
          is_pending: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_by: string
          date: string
          account_id: string
          amount: number
          payee_id?: string | null
          category_id?: string | null
          tags?: string[]
          notes?: string | null
          is_pending?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_by?: string
          date?: string
          account_id?: string
          amount?: number
          payee_id?: string | null
          category_id?: string | null
          tags?: string[]
          notes?: string | null
          is_pending?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          created_by: string
          month: string
          category_id: string
          target: number
          model: string
          carry: number
          created_at: string
        }
        Insert: {
          id?: string
          created_by: string
          month: string
          category_id: string
          target: number
          model: string
          carry?: number
          created_at?: string
        }
        Update: {
          id?: string
          created_by?: string
          month?: string
          category_id?: string
          target?: number
          model?: string
          carry?: number
          created_at?: string
        }
      }
      bills: {
        Row: {
          id: string
          created_by: string
          name: string
          amount: number
          account_id: string
          category_id: string
          payee_id: string | null
          rrule: string
          next_due: string | null
          status: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          created_by: string
          name: string
          amount: number
          account_id: string
          category_id: string
          payee_id?: string | null
          rrule: string
          next_due?: string | null
          status?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          created_by?: string
          name?: string
          amount?: number
          account_id?: string
          category_id?: string
          payee_id?: string | null
          rrule?: string
          next_due?: string | null
          status?: string
          notes?: string | null
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
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

// Helper type for accounts with joined account_group data
export type AccountWithGroup = Database['public']['Tables']['accounts']['Row'] & {
  account_group: Database['public']['Tables']['account_groups']['Row'] | null
}
