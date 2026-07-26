import { createClient } from '@supabase/supabase-js'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
export const supabase = createClient(supabaseUrl, supabaseKey)

export type Customer = {
  id: string; created_at: string; full_name: string; phone: string; email: string;
  address: string; tc_no: string; notes: string; user_id: string;
}
export type InventoryCategory = { id: string; name: string; user_id: string }
export type Inventory = {
  id: string; created_at: string; name: string; sku: string; barcode: string;
  category_id: string; purchase_price: number; sale_price: number; stock_quantity: number;
  min_stock: number; unit: string; supplier: string; user_id: string;
}
export type StockMovement = {
  id: string; created_at: string; inventory_id: string; type: 'in' | 'out';
  quantity: number; reason: string; user_id: string;
}
export type Service = {
  id: string; created_at: string; service_no: string; customer_id: string;
  device_type: string; device_model: string; imei: string; problem: string;
  diagnosis: string; status: string; estimated_cost: number; final_cost: number;
  deposit: number; warranty_months: number; technician: string; notes: string;
  completed_at: string; user_id: string; customers?: { full_name: string; phone: string }
}
export type Sale = {
  id: string; created_at: string; sale_no: string; customer_id: string;
  total_amount: number; discount: number; payment_type: string; paid_amount: number;
  status: string; user_id: string; customers?: { full_name: string; phone: string }
  sale_items?: SaleItem[]
}
export type SaleItem = {
  id: string; sale_id: string; inventory_id: string; quantity: number;
  unit_price: number; total_price: number; inventory?: { name: string; sku: string }
}
export type Purchase = {
  id: string; created_at: string; purchase_no: string; supplier_name: string;
  total_amount: number; payment_type: string; paid_amount: number; status: string;
  notes: string; user_id: string; purchase_items?: PurchaseItem[]
}
export type PurchaseItem = {
  id: string; purchase_id: string; inventory_id: string; quantity: number;
  unit_price: number; total_price: number; inventory?: { name: string; sku: string }
}
export type FinanceTransaction = {
  id: string; created_at: string; type: 'income' | 'expense'; category: string;
  amount: number; description: string; payment_method: string; related_id: string;
  related_type: string; user_id: string;
}
export type Partner = {
  id: string; created_at: string; full_name: string; phone: string; email: string;
  share_percent: number; user_id: string;
}
export type PartnerExpense = {
  id: string; created_at: string; partner_id: string; amount: number;
  description: string; expense_date: string; user_id: string;
  partners?: { full_name: string }
}
export type CompanySettings = {
  id: string; company_name: string; address: string; phone: string; email: string;
  tax_no: string; logo_url: string; developer_name: string; user_id: string;
}
export type AppUser = {
  id: string; email: string; role: 'admin' | 'user'; full_name: string; created_at: string;
}
export type FixedAsset = {
  id: string; created_at: string; name: string; description: string;
  purchase_date: string; purchase_price: number; partner_id: string;
  status: 'active' | 'sold' | 'broken'; user_id: string; partners?: { full_name: string }
}