
-- ============================================
-- YEŞİLTAŞ TEKNOLOJİ ERP - TÜM TABLOLAR (TAM PAKET)
-- ============================================

-- Drop existing tables (careful in production!)
DROP TABLE IF EXISTS consumable_usage CASCADE;
DROP TABLE IF EXISTS consumables CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS device_history CASCADE;
DROP TABLE IF EXISTS staff_performance CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS warranties CASCADE;
DROP TABLE IF EXISTS debts CASCADE;
DROP TABLE IF EXISTS customer_payments CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;

-- ============================================
-- 1. SETTINGS (Sistem Ayarları)
-- ============================================
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT DEFAULT 'Yeşiltaş Teknoloji',
  company_address TEXT,
  company_phone TEXT,
  company_email TEXT,
  logo_url TEXT,
  default_currency TEXT DEFAULT 'TRY',
  vat_rate NUMERIC DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO settings (company_name, company_address, company_phone, company_email, logo_url, default_currency, vat_rate)
VALUES ('Yeşiltaş Teknoloji', 'İstanbul, Türkiye', '0212 123 45 67', 'info@yesiltasteknoloji.com', '', 'TRY', 20);

-- ============================================
-- 2. CUSTOMERS (Müşteriler)
-- ============================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 3. SUPPLIERS (Tedarikçiler)
-- ============================================
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 4. INVENTORY (Stok)
-- ============================================
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT,
  quantity INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 5,
  max_stock INTEGER DEFAULT 100,
  purchase_price NUMERIC DEFAULT 0,
  sale_price NUMERIC DEFAULT 0,
  purchase_currency TEXT DEFAULT 'TRY',
  usd_purchase_price NUMERIC DEFAULT 0,
  supplier_id UUID REFERENCES suppliers(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 5. DEVICES (Teknik Servis Cihazları)
-- ============================================
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  imei TEXT,
  complaint TEXT NOT NULL,
  diagnosis TEXT,
  status TEXT DEFAULT 'Beklemede' CHECK (status IN ('Beklemede','Tamiri Başladı','Parça Bekleniyor','Tamamlandı','Teslim Edildi','İptal Edildi')),
  estimated_cost NUMERIC DEFAULT 0,
  final_cost NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  payment_status TEXT DEFAULT 'beklemede' CHECK (payment_status IN ('beklemede','kismi','tamamlandi','ucretsiz')),
  received_date TIMESTAMPTZ DEFAULT now(),
  started_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  delivered_date TIMESTAMPTZ,
  technician TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 6. SALES (Satışlar)
-- ============================================
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  item_name TEXT NOT NULL,
  item_type TEXT DEFAULT 'Cihaz' CHECK (item_type IN ('Cihaz','Aksesuar','Parça','Servis')),
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC DEFAULT 0,
  total_price NUMERIC DEFAULT 0,
  payment_method TEXT DEFAULT 'Nakit' CHECK (payment_method IN ('Nakit','Kredi Kartı','Havale','Taksit','Borç')),
  installments INTEGER DEFAULT 1,
  remaining_amount NUMERIC DEFAULT 0,
  warranty_months INTEGER DEFAULT 12,
  warranty_end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 7. TRANSACTIONS (Kasa - Gelir/Gider)
-- ============================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('gelir','gider')),
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  related_id UUID,
  related_table TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 8. CONSUMABLES (Sarf Malzemeleri)
-- ============================================
CREATE TABLE consumables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  quantity NUMERIC DEFAULT 0,
  unit TEXT DEFAULT 'adet',
  min_stock NUMERIC DEFAULT 5,
  max_stock NUMERIC DEFAULT 100,
  unit_price NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 9. CONSUMABLE_USAGE (Sarf Malzeme Kullanımı)
-- ============================================
CREATE TABLE consumable_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumable_id UUID REFERENCES consumables(id),
  device_id UUID REFERENCES devices(id),
  quantity_used NUMERIC DEFAULT 0,
  cost NUMERIC DEFAULT 0,
  used_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 10. APPOINTMENTS (Randevular)
-- ============================================
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT,
  customer_phone TEXT,
  service_type TEXT,
  appointment_date DATE NOT NULL,
  appointment_time TEXT,
  status TEXT DEFAULT 'Beklemede' CHECK (status IN ('Beklemede','Onaylandı','Tamamlandı','İptal Edildi')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 11. DEVICE_HISTORY (Cihaz Servis Geçmişi)
-- ============================================
CREATE TABLE device_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imei TEXT NOT NULL,
  device_id UUID REFERENCES devices(id),
  customer_name TEXT,
  brand TEXT,
  model TEXT,
  complaint TEXT,
  diagnosis TEXT,
  final_cost NUMERIC DEFAULT 0,
  status TEXT,
  service_date TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 12. STAFF (Personel)
-- ============================================
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT DEFAULT 'Teknisyen' CHECK (role IN ('Teknisyen','Satışçı','Admin','Muhasebe')),
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 13. STAFF_PERFORMANCE (Personel Performans)
-- ============================================
CREATE TABLE staff_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id),
  staff_name TEXT,
  device_count INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  period_month TEXT,
  period_year INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 14. WARRANTIES (Garanti Takibi)
-- ============================================
CREATE TABLE warranties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id),
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT,
  item_name TEXT,
  imei TEXT,
  warranty_start DATE DEFAULT CURRENT_DATE,
  warranty_end DATE,
  warranty_months INTEGER DEFAULT 12,
  status TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif','Sona Erdi','İade Edildi')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 15. DEBTS (Borç Takibi)
-- ============================================
CREATE TABLE debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  source_type TEXT CHECK (source_type IN ('device','sale')),
  source_id UUID,
  total_amount NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  remaining_amount NUMERIC DEFAULT 0,
  due_date DATE,
  status TEXT DEFAULT 'Beklemede' CHECK (status IN ('Beklemede','Kısmi Ödendi','Tamamlandı','Gecikti')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 16. CUSTOMER_PAYMENTS (Müşteri Ödemeleri)
-- ============================================
CREATE TABLE customer_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  debt_id UUID REFERENCES debts(id),
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'Nakit' CHECK (payment_method IN ('Nakit','Kredi Kartı','Havale')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RLS DISABLE (Tüm tablolar)
-- ============================================
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE consumables DISABLE ROW LEVEL SECURITY;
ALTER TABLE consumable_usage DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE device_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_performance DISABLE ROW LEVEL SECURITY;
ALTER TABLE warranties DISABLE ROW LEVEL SECURITY;
ALTER TABLE debts DISABLE ROW LEVEL SECURITY;
ALTER TABLE customer_payments DISABLE ROW LEVEL SECURITY;

-- ============================================
-- ÖRNEK VERİLER
-- ============================================
INSERT INTO customers (name, phone, email, address) VALUES
('Ahmet Yılmaz', '0532 111 22 33', 'ahmet@email.com', 'Kadıköy, İstanbul'),
('Mehmet Kaya', '0533 444 55 66', 'mehmet@email.com', 'Beşiktaş, İstanbul'),
('Ayşe Demir', '0544 777 88 99', 'ayse@email.com', 'Şişli, İstanbul');

INSERT INTO suppliers (name, phone, email) VALUES
('Apple Türkiye', '0212 999 88 77', 'info@apple.com.tr'),
('Samsung Distribütör', '0216 333 22 11', 'satis@samsung.com.tr');

INSERT INTO inventory (name, category, brand, quantity, min_stock, purchase_price, sale_price, purchase_currency) VALUES
('iPhone 15 Pro Ekran', 'Ekran', 'Apple', 15, 5, 8500, 12000, 'TRY'),
('Samsung S24 Batarya', 'Batarya', 'Samsung', 20, 5, 1200, 1800, 'TRY'),
('USB-C Kablo', 'Aksesuar', 'Generic', 50, 10, 50, 120, 'TRY');

INSERT INTO staff (name, role, phone) VALUES
('Ali Teknisyen', 'Teknisyen', '0555 111 22 33'),
('Veli Satışçı', 'Satışçı', '0555 444 55 66'),
('Admin Kullanıcı', 'Admin', '0555 777 88 99');

INSERT INTO devices (customer_id, brand, model, imei, complaint, status, estimated_cost, final_cost, technician, received_date) 
SELECT c.id, 'Apple', 'iPhone 14 Pro', '353456789012345', 'Ekran kırık', 'Tamamlandı', 5000, 4500, 'Ali Teknisyen', now() - interval '3 days'
FROM customers c WHERE c.name = 'Ahmet Yılmaz';

INSERT INTO devices (customer_id, brand, model, imei, complaint, status, estimated_cost, technician, received_date) 
SELECT c.id, 'Samsung', 'Galaxy S23', '356789012345678', 'Şarj olmuyor', 'Beklemede', 1500, 'Ali Teknisyen', now() - interval '1 day'
FROM customers c WHERE c.name = 'Mehmet Kaya';

INSERT INTO sales (customer_id, item_name, item_type, quantity, unit_price, total_price, payment_method, warranty_months, warranty_end_date) 
SELECT c.id, 'iPhone 15 Pro', 'Cihaz', 1, 55000, 55000, 'Kredi Kartı', 24, (CURRENT_DATE + interval '24 months')::DATE
FROM customers c WHERE c.name = 'Ahmet Yılmaz';

INSERT INTO sales (customer_id, item_name, item_type, quantity, unit_price, total_price, payment_method, remaining_amount, warranty_months, warranty_end_date) 
SELECT c.id, 'Samsung Galaxy A54', 'Cihaz', 1, 18000, 18000, 'Taksit', 12000, 12, (CURRENT_DATE + interval '12 months')::DATE
FROM customers c WHERE c.name = 'Mehmet Kaya';

INSERT INTO transactions (type, category, amount, description) VALUES
('gelir', 'Cihaz Satışı', 55000, 'iPhone 15 Pro satışı'),
('gelir', 'Teknik Servis', 4500, 'iPhone 14 Pro ekran değişimi'),
('gider', 'Parça Alımı', 8500, 'iPhone 15 Pro ekran alımı');

INSERT INTO consumables (name, category, quantity, unit, min_stock, unit_price) VALUES
('Lehim Teli 0.3mm', 'Lehim', 5, 'rulo', 2, 150),
('İzopropil Alkol', 'Temizlik', 3, 'litre', 1, 80),
('Flux Sıvısı', 'Lehim', 2, 'şişe', 1, 45);

INSERT INTO appointments (customer_id, customer_name, customer_phone, service_type, appointment_date, appointment_time, status) 
SELECT c.id, c.name, c.phone, 'Ekran Değişimi', CURRENT_DATE + interval '2 days', '14:00', 'Onaylandı'
FROM customers c WHERE c.name = 'Ayşe Demir';

INSERT INTO debts (customer_id, source_type, source_id, total_amount, paid_amount, remaining_amount, due_date, status)
SELECT c.id, 'sale', s.id, 18000, 6000, 12000, (CURRENT_DATE + interval '30 days')::DATE, 'Kısmi Ödendi'
FROM customers c, sales s WHERE c.name = 'Mehmet Kaya' AND s.item_name = 'Samsung Galaxy A54';

INSERT INTO warranties (sale_id, customer_id, customer_name, item_name, imei, warranty_months, warranty_end_date)
SELECT s.id, c.id, c.name, s.item_name, '353456789012345', 24, (CURRENT_DATE + interval '24 months')::DATE
FROM sales s, customers c WHERE s.item_name = 'iPhone 15 Pro' AND c.name = 'Ahmet Yılmaz';

INSERT INTO device_history (imei, customer_name, brand, model, complaint, diagnosis, final_cost, status)
VALUES ('353456789012345', 'Ahmet Yılmaz', 'Apple', 'iPhone 14 Pro', 'Ekran kırık', 'Ekran değişimi yapıldı', 4500, 'Tamamlandı');

SELECT '✅ TÜM TABLOLAR VE VERİLER BAŞARIYLA OLUŞTURULDU!' AS sonuc;
