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
      companies: {
        Row: {
          id: string
          name: string
          tax_number: string | null
          address: string | null
          phone: string | null
          email: string | null
          logo_url: string | null
          settings: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          tax_number?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          logo_url?: string | null
          settings?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          tax_number?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          logo_url?: string | null
          settings?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          avatar_url: string | null
          role: 'admin' | 'partner' | 'technician' | 'warehouse' | 'accounting' | 'sales'
          branch_id: string | null
          company_id: string | null
          permissions: Json
          is_active: boolean
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          phone?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'partner' | 'technician' | 'warehouse' | 'accounting' | 'sales'
          branch_id?: string | null
          company_id?: string | null
          permissions?: Json
          is_active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'partner' | 'technician' | 'warehouse' | 'accounting' | 'sales'
          branch_id?: string | null
          company_id?: string | null
          permissions?: Json
          is_active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          company_id: string
          full_name: string
          phone: string
          phone_secondary: string | null
          email: string | null
          identity_number: string | null
          tax_number: string | null
          company_name: string | null
          customer_type: 'individual' | 'corporate'
          credit_limit: number
          current_balance: number
          notes: string | null
          tags: string[]
          source: string | null
          is_vip: boolean
          created_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          full_name: string
          phone: string
          phone_secondary?: string | null
          email?: string | null
          identity_number?: string | null
          tax_number?: string | null
          company_name?: string | null
          customer_type?: 'individual' | 'corporate'
          credit_limit?: number
          current_balance?: number
          notes?: string | null
          tags?: string[]
          source?: string | null
          is_vip?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          full_name?: string
          phone?: string
          phone_secondary?: string | null
          email?: string | null
          identity_number?: string | null
          tax_number?: string | null
          company_name?: string | null
          customer_type?: 'individual' | 'corporate'
          credit_limit?: number
          current_balance?: number
          notes?: string | null
          tags?: string[]
          source?: string | null
          is_vip?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      service_orders: {
        Row: {
          id: string
          service_number: string
          company_id: string
          branch_id: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          device_brand: string
          device_model: string
          device_color: string | null
          imei: string | null
          serial_number: string | null
          device_password: string | null
          device_condition: string | null
          problem_description: string
          reported_issues: Json
          estimated_cost: number | null
          final_cost: number | null
          status_id: string | null
          technician_id: string | null
          priority: 'low' | 'normal' | 'high' | 'urgent'
          warranty_months: number
          warranty_until: string | null
          payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded'
          total_amount: number
          paid_amount: number
          payment_method: 'cash' | 'bank_transfer' | 'credit_card' | 'installment' | null
          deposit_amount: number
          delivery_date: string | null
          delivered_by: string | null
          received_by: string | null
          signature_url: string | null
          qr_code: string | null
          barcode: string | null
          source: string
          tags: string[]
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          service_number?: string
          company_id: string
          branch_id?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          device_brand: string
          device_model: string
          device_color?: string | null
          imei?: string | null
          serial_number?: string | null
          device_password?: string | null
          device_condition?: string | null
          problem_description: string
          reported_issues?: Json
          estimated_cost?: number | null
          final_cost?: number | null
          status_id?: string | null
          technician_id?: string | null
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          warranty_months?: number
          warranty_until?: string | null
          payment_status?: 'unpaid' | 'partial' | 'paid' | 'refunded'
          total_amount?: number
          paid_amount?: number
          payment_method?: 'cash' | 'bank_transfer' | 'credit_card' | 'installment' | null
          deposit_amount?: number
          delivery_date?: string | null
          delivered_by?: string | null
          received_by?: string | null
          signature_url?: string | null
          qr_code?: string | null
          barcode?: string | null
          source?: string
          tags?: string[]
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          service_number?: string
          company_id?: string
          branch_id?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          device_brand?: string
          device_model?: string
          device_color?: string | null
          imei?: string | null
          serial_number?: string | null
          device_password?: string | null
          device_condition?: string | null
          problem_description?: string
          reported_issues?: Json
          estimated_cost?: number | null
          final_cost?: number | null
          status_id?: string | null
          technician_id?: string | null
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          warranty_months?: number
          warranty_until?: string | null
          payment_status?: 'unpaid' | 'partial' | 'paid' | 'refunded'
          total_amount?: number
          paid_amount?: number
          payment_method?: 'cash' | 'bank_transfer' | 'credit_card' | 'installment' | null
          deposit_amount?: number
          delivery_date?: string | null
          delivered_by?: string | null
          received_by?: string | null
          signature_url?: string | null
          qr_code?: string | null
          barcode?: string | null
          source?: string
          tags?: string[]
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      stock_items: {
        Row: {
          id: string
          company_id: string
          category_id: string | null
          brand_id: string | null
          model_id: string | null
          sku: string | null
          name: string
          description: string | null
          barcode: string | null
          qr_code: string | null
          purchase_price_usd: number | null
          purchase_price_try: number | null
          sale_price: number | null
          profit_margin: number
          min_sale_price: number | null
          quantity: number
          min_stock: number
          max_stock: number
          reorder_point: number
          unit: string
          shelf_location: string | null
          warehouse_id: string | null
          is_active: boolean
          is_serialized: boolean
          track_imei: boolean
          tags: string[]
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          category_id?: string | null
          brand_id?: string | null
          model_id?: string | null
          sku?: string | null
          name: string
          description?: string | null
          barcode?: string | null
          qr_code?: string | null
          purchase_price_usd?: number | null
          purchase_price_try?: number | null
          sale_price?: number | null
          profit_margin?: number
          min_sale_price?: number | null
          quantity?: number
          min_stock?: number
          max_stock?: number
          reorder_point?: number
          unit?: string
          shelf_location?: string | null
          warehouse_id?: string | null
          is_active?: boolean
          is_serialized?: boolean
          track_imei?: boolean
          tags?: string[]
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          category_id?: string | null
          brand_id?: string | null
          model_id?: string | null
          sku?: string | null
          name?: string
          description?: string | null
          barcode?: string | null
          qr_code?: string | null
          purchase_price_usd?: number | null
          purchase_price_try?: number | null
          sale_price?: number | null
          profit_margin?: number
          min_sale_price?: number | null
          quantity?: number
          min_stock?: number
          max_stock?: number
          reorder_point?: number
          unit?: string
          shelf_location?: string | null
          warehouse_id?: string | null
          is_active?: boolean
          is_serialized?: boolean
          track_imei?: boolean
          tags?: string[]
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      transactions: {
        Row: {
          id: string
          transaction_number: string | null
          company_id: string
          account_id: string
          transaction_type: string
          amount: number
          currency: string
          exchange_rate: number
          entity_type: string | null
          entity_id: string | null
          entity_name: string | null
          reference_type: string | null
          reference_id: string | null
          description: string | null
          attachments: Json
          transaction_date: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          transaction_number?: string | null
          company_id: string
          account_id: string
          transaction_type: string
          amount: number
          currency?: string
          exchange_rate?: number
          entity_type?: string | null
          entity_id?: string | null
          entity_name?: string | null
          reference_type?: string | null
          reference_id?: string | null
          description?: string | null
          attachments?: Json
          transaction_date: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          transaction_number?: string | null
          company_id?: string
          account_id?: string
          transaction_type?: string
          amount?: number
          currency?: string
          exchange_rate?: number
          entity_type?: string | null
          entity_id?: string | null
          entity_name?: string | null
          reference_type?: string | null
          reference_id?: string | null
          description?: string | null
          attachments?: Json
          transaction_date?: string
          created_by?: string | null
          created_at?: string
        }
      }
      assets: {
        Row: {
          id: string
          company_id: string
          branch_id: string | null
          asset_code: string | null
          name: string
          description: string | null
          category: string
          purchase_price: number | null
          purchase_date: string | null
          currency: string
          condition: string
          status: string
          location: string | null
          depreciation_method: string
          useful_life_years: number | null
          salvage_value: number
          monthly_depreciation: number | null
          accumulated_depreciation: number
          book_value: number | null
          assigned_to: string | null
          serial_number: string | null
          brand: string | null
          model: string | null
          supplier_id: string | null
          warranty_until: string | null
          documents: Json
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          branch_id?: string | null
          asset_code?: string | null
          name: string
          description?: string | null
          category: string
          purchase_price?: number | null
          purchase_date?: string | null
          currency?: string
          condition?: string
          status?: string
          location?: string | null
          depreciation_method?: string
          useful_life_years?: number | null
          salvage_value?: number
          monthly_depreciation?: number | null
          accumulated_depreciation?: number
          book_value?: number | null
          assigned_to?: string | null
          serial_number?: string | null
          brand?: string | null
          model?: string | null
          supplier_id?: string | null
          warranty_until?: string | null
          documents?: Json
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          branch_id?: string | null
          asset_code?: string | null
          name?: string
          description?: string | null
          category?: string
          purchase_price?: number | null
          purchase_date?: string | null
          currency?: string
          condition?: string
          status?: string
          location?: string | null
          depreciation_method?: string
          useful_life_years?: number | null
          salvage_value?: number
          monthly_depreciation?: number | null
          accumulated_depreciation?: number
          book_value?: number | null
          assigned_to?: string | null
          serial_number?: string | null
          brand?: string | null
          model?: string | null
          supplier_id?: string | null
          warranty_until?: string | null
          documents?: Json
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      partner_investments: {
        Row: {
          id: string
          company_id: string
          partner_id: string
          investment_type: string
          description: string
          amount: number | null
          asset_id: string | null
          stock_item_id: string | null
          quantity: number | null
          is_approved: boolean
          approved_by: string | null
          approved_at: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          partner_id: string
          investment_type: string
          description: string
          amount?: number | null
          asset_id?: string | null
          stock_item_id?: string | null
          quantity?: number | null
          is_approved?: boolean
          approved_by?: string | null
          approved_at?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          partner_id?: string
          investment_type?: string
          description?: string
          amount?: number | null
          asset_id?: string | null
          stock_item_id?: string | null
          quantity?: number | null
          is_approved?: boolean
          approved_by?: string | null
          approved_at?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          company_id: string
          user_id: string | null
          title: string
          message: string | null
          type: string
          category: string | null
          entity_type: string | null
          entity_id: string | null
          is_read: boolean
          read_at: string | null
          sent_via: Json
          whatsapp_sent: boolean
          whatsapp_sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          user_id?: string | null
          title: string
          message?: string | null
          type?: string
          category?: string | null
          entity_type?: string | null
          entity_id?: string | null
          is_read?: boolean
          read_at?: string | null
          sent_via?: Json
          whatsapp_sent?: boolean
          whatsapp_sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          user_id?: string | null
          title?: string
          message?: string | null
          type?: string
          category?: string | null
          entity_type?: string | null
          entity_id?: string | null
          is_read?: boolean
          read_at?: string | null
          sent_via?: Json
          whatsapp_sent?: boolean
          whatsapp_sent_at?: string | null
          created_at?: string
        }
      }
      company_settings: {
        Row: {
          id: string
          company_id: string
          default_currency: string
          timezone: string
          date_format: string
          default_warranty_months: number
          auto_assign_technician: boolean
          service_number_prefix: string
          low_stock_threshold: number
          auto_calculate_sale_price: boolean
          default_profit_margin: number
          default_payment_terms: number
          whatsapp_enabled: boolean
          auto_notify_customer: boolean
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          default_currency?: string
          timezone?: string
          date_format?: string
          default_warranty_months?: number
          auto_assign_technician?: boolean
          service_number_prefix?: string
          low_stock_threshold?: number
          auto_calculate_sale_price?: boolean
          default_profit_margin?: number
          default_payment_terms?: number
          whatsapp_enabled?: boolean
          auto_notify_customer?: boolean
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          default_currency?: string
          timezone?: string
          date_format?: string
          default_warranty_months?: number
          auto_assign_technician?: boolean
          service_number_prefix?: string
          low_stock_threshold?: number
          auto_calculate_sale_price?: boolean
          default_profit_margin?: number
          default_payment_terms?: number
          whatsapp_enabled?: boolean
          auto_notify_customer?: boolean
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      dashboard_metrics: {
        Row: {
          company_id: string
          today_services: number
          pending_services: number
          ready_devices: number
          waiting_delivery: number
          today_revenue: number
          low_stock_count: number
          total_customers: number
          total_receivables: number
          total_payables: number
          calculated_date: string
        }
      }
    }
    Functions: {
      get_current_company_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_service_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_sku: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_asset_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      search_customers: {
        Args: { search_query: string }
        Returns: {
          id: string
          full_name: string
          phone: string
          email: string | null
          company_name: string | null
          current_balance: number
          similarity: number
        }[]
      }
      search_services: {
        Args: { search_query: string }
        Returns: {
          id: string
          service_number: string
          customer_name: string | null
          customer_phone: string | null
          device_brand: string
          device_model: string
          status_name: string | null
          created_at: string
        }[]
      }
      search_stock: {
        Args: { search_query: string }
        Returns: {
          id: string
          sku: string | null
          name: string
          barcode: string | null
          category_name: string | null
          brand_name: string | null
          quantity: number
          sale_price: number | null
        }[]
      }
      refresh_dashboard_metrics: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
      check_warranty_expiry: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
    }
    Enums: {
      user_role: ['admin', 'partner', 'technician', 'warehouse', 'accounting', 'sales']
      customer_type: ['individual', 'corporate']
      service_priority: ['low', 'normal', 'high', 'urgent']
      payment_status: ['unpaid', 'partial', 'paid', 'refunded']
      payment_method: ['cash', 'bank_transfer', 'credit_card', 'installment']
      movement_type: ['purchase', 'sale', 'service_use', 'return', 'adjustment', 'transfer', 'warranty', 'damage']
      serial_status: ['in_stock', 'reserved', 'sold', 'used_in_service', 'defective']
      purchase_status: ['draft', 'sent', 'confirmed', 'shipped', 'customs', 'received', 'cancelled']
      sale_status: ['draft', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']
      transaction_type: ['income', 'expense', 'transfer', 'customer_payment', 'supplier_payment', 'partner_investment', 'salary', 'rent', 'utility', 'other']
      account_type: ['cash', 'bank', 'credit_card', 'other']
      asset_category: ['furniture', 'electronics', 'repair_equipment', 'computer', 'phone', 'vehicle', 'tool', 'other']
      asset_condition: ['new', 'good', 'fair', 'poor', 'broken']
      asset_status: ['active', 'maintenance', 'retired', 'sold']
      investment_type: ['cash', 'equipment', 'inventory', 'other']
      notification_category: ['low_stock', 'debt_reminder', 'warranty_expiry', 'new_service', 'delivery_ready', 'payment_due', 'system']
      notification_type: ['info', 'warning', 'success', 'error']
      notification_channel: ['whatsapp', 'sms', 'email', 'push']
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

export type Company = Tables<'companies'>
export type User = Tables<'users'>
export type Customer = Tables<'customers'>
export type ServiceOrder = Tables<'service_orders'>
export type StockItem = Tables<'stock_items'>
export type Transaction = Tables<'transactions'>
export type Asset = Tables<'assets'>
export type PartnerInvestment = Tables<'partner_investments'>
export type Notification = Tables<'notifications'>
export type CompanySettings = Tables<'company_settings'>
export type DashboardMetrics = Database['public']['Views']['dashboard_metrics']['Row']
