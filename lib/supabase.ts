import { createClient } from "@supabase/supabase-js"
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
export const supabase = createClient(supabaseUrl, supabaseKey)

export type Customer = { id: string; full_name: string; phone: string; email: string; address: string; tc_no: string; notes: string }
export type Inventory = { id: string; name: string; sku: string; barcode: string; purchase_price: number; sale_price: number; stock_quantity: number; min_stock: number; unit: string; supplier: string; category_id: string }
export type Service = { id: string; service_no: string; customer_id: string; device_type: string; device_model: string; imei: string; problem: string; diagnosis: string; status: string; estimated_cost: number; final_cost: number; deposit: number; warranty_months: number; technician: string; notes: string; completed_at: string; created_at: string; customers?: { full_name: string; phone: string } }
export type Sale = { id: string; sale_no: string; customer_id: string; total_amount: number; discount: number; payment_type: string; paid_amount: number; status: string; created_at: string; customers?: { full_name: string; phone: string } }
export type Purchase = { id: string; purchase_no: string; supplier_name: string; total_amount: number; payment_type: string; paid_amount: number; status: string; notes: string; created_at: string }
export type FinanceTransaction = { id: string; type: "income" | "expense"; category: string; amount: number; description: string; payment_method: string; created_at: string }
export type Partner = { id: string; full_name: string; phone: string; email: string; share_percent: number }