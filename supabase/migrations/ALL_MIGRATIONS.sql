-- YEŞİLTAŞ ERP - TÜM MİGRASYONLAR (Birleştirilmiş)
-- Bu dosyayı Supabase SQL Editor'da tek seferde çalıştırabilirsiniz
-- Hata olursa, hata satırını bana gönderin

-- ÖNCE eski tabloları temizle (eğer varsa)
DO $$
BEGIN
    RAISE NOTICE 'Eski tablolar temizleniyor (varsa)...';
END $$;

DROP TABLE IF EXISTS asset_maintenance CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS partner_investments CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS sale_order_items CASCADE;
DROP TABLE IF EXISTS sale_orders CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS supplier_payments CASCADE;
DROP TABLE IF EXISTS purchase_order_items CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS stock_serials CASCADE;
DROP TABLE IF EXISTS stock_items CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;
DROP TABLE IF EXISTS models CASCADE;
DROP TABLE IF EXISTS brands CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS service_notes CASCADE;
DROP TABLE IF EXISTS service_labor CASCADE;
DROP TABLE IF EXISTS service_parts CASCADE;
DROP TABLE IF EXISTS service_videos CASCADE;
DROP TABLE IF EXISTS service_photos CASCADE;
DROP TABLE IF EXISTS service_diagnoses CASCADE;
DROP TABLE IF EXISTS service_status_history CASCADE;
DROP TABLE IF EXISTS service_orders CASCADE;
DROP TABLE IF EXISTS service_statuses CASCADE;
DROP TABLE IF EXISTS customer_notes CASCADE;
DROP TABLE IF EXISTS customer_phones CASCADE;
DROP TABLE IF EXISTS customer_addresses CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS notification_templates CASCADE;
DROP TABLE IF EXISTS company_settings CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS customer_type CASCADE;
DROP TYPE IF EXISTS service_priority CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS movement_type CASCADE;
DROP TYPE IF EXISTS serial_status CASCADE;
DROP TYPE IF EXISTS purchase_status CASCADE;
DROP TYPE IF EXISTS sale_status CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS account_type CASCADE;
DROP TYPE IF EXISTS asset_category CASCADE;
DROP TYPE IF EXISTS asset_condition CASCADE;
DROP TYPE IF EXISTS asset_status CASCADE;
DROP TYPE IF EXISTS investment_type CASCADE;
DROP TYPE IF EXISTS notification_category CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS notification_channel CASCADE;

DROP FUNCTION IF EXISTS handle_new_company() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS get_current_company_id() CASCADE;
DROP FUNCTION IF EXISTS generate_service_number() CASCADE;
DROP FUNCTION IF EXISTS generate_sku() CASCADE;
DROP FUNCTION IF EXISTS generate_asset_code() CASCADE;
DROP FUNCTION IF EXISTS update_stock_quantity() CASCADE;
DROP FUNCTION IF EXISTS check_low_stock() CASCADE;
DROP FUNCTION IF EXISTS log_service_status_change() CASCADE;
DROP FUNCTION IF EXISTS update_customer_balance() CASCADE;
DROP FUNCTION IF EXISTS search_customers(TEXT) CASCADE;
DROP FUNCTION IF EXISTS search_services(TEXT) CASCADE;
DROP FUNCTION IF EXISTS search_stock(TEXT) CASCADE;
DROP FUNCTION IF EXISTS update_service_total_amount() CASCADE;
DROP FUNCTION IF EXISTS update_account_balance() CASCADE;
DROP FUNCTION IF EXISTS calculate_sale_price() CASCADE;
DROP FUNCTION IF EXISTS check_warranty_expiry() CASCADE;
DROP FUNCTION IF EXISTS refresh_dashboard_metrics() CASCADE;

DROP MATERIALIZED VIEW IF EXISTS dashboard_metrics CASCADE;

-- Şimdi tüm migration'ları sırayla çalıştır

-- ===== 001_init_core_tables.sql =====
-- Migration: 001_init_core_tables
-- Description: Temel tablolar, enum tipler ve RLS politikaları
-- Created: 2026-07-24

-- ============================================
-- GÜVENLİK: Eğer bu dosya zaten çalıştırıldıysa tekrar çalıştırma
-- ============================================

DO $$
BEGIN
    -- Eğer companies tablosu zaten varsa, bu migration zaten çalıştırılmış demektir
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies' AND table_schema = 'public') THEN
        RAISE NOTICE 'Migration 001 zaten çalıştırılmış. Atlanıyor...';
        RETURN;
    END IF;
END $$;


-- Description: Temel tablolar, enum tipler ve RLS politikaları
-- Created: 2026-07-24

-- ============================================
-- ENUM TİPLERİ
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'partner', 'technician', 'warehouse', 'accounting', 'sales');
CREATE TYPE customer_type AS ENUM ('individual', 'corporate');
CREATE TYPE service_priority AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE payment_status AS ENUM ('unpaid', 'partial', 'paid', 'refunded');
CREATE TYPE payment_method AS ENUM ('cash', 'bank_transfer', 'credit_card', 'installment');
CREATE TYPE movement_type AS ENUM ('purchase', 'sale', 'service_use', 'return', 'adjustment', 'transfer', 'warranty', 'damage');
CREATE TYPE serial_status AS ENUM ('in_stock', 'reserved', 'sold', 'used_in_service', 'defective');
CREATE TYPE purchase_status AS ENUM ('draft', 'sent', 'confirmed', 'shipped', 'customs', 'received', 'cancelled');
CREATE TYPE sale_status AS ENUM ('draft', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled');
CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer', 'customer_payment', 'supplier_payment', 'partner_investment', 'salary', 'rent', 'utility', 'other');
CREATE TYPE account_type AS ENUM ('cash', 'bank', 'credit_card', 'other');
CREATE TYPE asset_category AS ENUM ('furniture', 'electronics', 'repair_equipment', 'computer', 'phone', 'vehicle', 'tool', 'other');
CREATE TYPE asset_condition AS ENUM ('new', 'good', 'fair', 'poor', 'broken');
CREATE TYPE asset_status AS ENUM ('active', 'maintenance', 'retired', 'sold');
CREATE TYPE investment_type AS ENUM ('cash', 'equipment', 'inventory', 'other');
CREATE TYPE notification_category AS ENUM ('low_stock', 'debt_reminder', 'warranty_expiry', 'new_service', 'delivery_ready', 'payment_due', 'system');
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'success', 'error');
CREATE TYPE notification_channel AS ENUM ('whatsapp', 'sms', 'email', 'push');

-- ============================================
-- TEMEL TABLOLAR
-- ============================================

-- Şirketler (Çoklu şirket desteği için)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    tax_number VARCHAR(50),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Şubeler
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    manager_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Kullanıcılar (Supabase Auth ile entegre)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'technician',
    branch_id UUID REFERENCES branches(id),
    company_id UUID REFERENCES companies(id),
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- AKTİVİTE LOG
-- ============================================

CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);

-- ============================================
-- RLS POLİTİKALARI - TEMEL
-- ============================================

-- Companies RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companies_select_all" ON companies
    FOR SELECT USING (true);

CREATE POLICY "companies_insert_admin" ON companies
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "companies_update_admin" ON companies
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Users RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_company" ON users
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "users_update_self_or_admin" ON users
    FOR UPDATE USING (
        id = auth.uid() OR 
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Branches RLS
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "branches_select_company" ON branches
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

-- Activity Logs RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_logs_select_company" ON activity_logs
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users WHERE company_id IN (
                SELECT company_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- ============================================
-- FONKSİYONLAR
-- ============================================

-- Otomatik updated_at güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Şirket ID'sini session'dan alma
CREATE OR REPLACE FUNCTION get_current_company_id()
RETURNS UUID AS $$
DECLARE
    company_id UUID;
BEGIN
    SELECT company_id INTO company_id FROM users WHERE id = auth.uid();
    RETURN company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Servis numarası oluşturma
CREATE OR REPLACE FUNCTION generate_service_number()
RETURNS TEXT AS $$
DECLARE
    year TEXT;
    sequence_num INT;
    new_number TEXT;
BEGIN
    year := to_char(current_date, 'YYYY');

    SELECT COALESCE(MAX(NULLIF(regexp_replace(service_number, '[^0-9]', '', 'g'), '')), '0')::INT
    INTO sequence_num
    FROM service_orders
    WHERE service_number LIKE 'SR-' || year || '-%';

    sequence_num := sequence_num + 1;
    new_number := 'SR-' || year || '-' || LPAD(sequence_num::TEXT, 6, '0');

    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Stok kodu oluşturma
CREATE OR REPLACE FUNCTION generate_sku()
RETURNS TEXT AS $$
DECLARE
    sequence_num INT;
    new_sku TEXT;
BEGIN
    SELECT COALESCE(MAX(NULLIF(regexp_replace(sku, '[^0-9]', '', 'g'), '')), '0')::INT
    INTO sequence_num
    FROM stock_items;

    sequence_num := sequence_num + 1;
    new_sku := 'YST-' || LPAD(sequence_num::TEXT, 6, '0');

    RETURN new_sku;
END;
$$ LANGUAGE plpgsql;

-- Demirbaş kodu oluşturma
CREATE OR REPLACE FUNCTION generate_asset_code()
RETURNS TEXT AS $$
DECLARE
    year TEXT;
    sequence_num INT;
    new_code TEXT;
BEGIN
    year := to_char(current_date, 'YYYY');

    SELECT COALESCE(MAX(NULLIF(regexp_replace(asset_code, '[^0-9]', '', 'g'), '')), '0')::INT
    INTO sequence_num
    FROM assets
    WHERE asset_code LIKE 'DEM-' || year || '-%';

    sequence_num := sequence_num + 1;
    new_code := 'DEM-' || year || '-' || LPAD(sequence_num::TEXT, 6, '0');

    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Stok hareketi sonrası stok miktarını güncelleme
CREATE OR REPLACE FUNCTION update_stock_quantity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.movement_type IN ('purchase', 'return', 'adjustment') THEN
            UPDATE stock_items SET quantity = quantity + NEW.quantity WHERE id = NEW.stock_item_id;
        ELSIF NEW.movement_type IN ('sale', 'service_use', 'damage') THEN
            UPDATE stock_items SET quantity = quantity - NEW.quantity WHERE id = NEW.stock_item_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Düşük stok bildirimi oluşturma
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quantity <= NEW.min_stock AND NEW.min_stock > 0 THEN
        INSERT INTO notifications (
            company_id, category, title, message, entity_type, entity_id
        ) VALUES (
            NEW.company_id,
            'low_stock',
            'Düşük Stok Uyarısı',
            NEW.name || ' ürününün stok seviyesi düşük. Mevcut: ' || NEW.quantity || ', Minimum: ' || NEW.min_stock,
            'stock_item',
            NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Servis durumu değiştiğinde geçmiş kaydetme
CREATE OR REPLACE FUNCTION log_service_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status_id IS DISTINCT FROM NEW.status_id THEN
        INSERT INTO service_status_history (
            service_order_id, from_status_id, to_status_id, changed_by
        ) VALUES (
            NEW.id, OLD.status_id, NEW.status_id, auth.uid()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED DATA
-- ============================================

-- Varsayılan şirket
INSERT INTO companies (name, tax_number, phone, email) 
VALUES ('Yeşiltaş Teknoloji', '', '', 'info@yesiltas.com')
ON CONFLICT DO NOTHING;



-- ===== 002_crm_module.sql =====
-- Migration: 002_crm_module
-- Description: CRM modülü - Müşteri, adres, cihaz ve not tabloları
-- Created: 2026-07-24

-- ============================================
-- MÜŞTERİLER
-- ============================================

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    phone_secondary VARCHAR(50),
    email VARCHAR(255),
    identity_number VARCHAR(20),
    tax_number VARCHAR(50),
    company_name VARCHAR(255),
    customer_type customer_type DEFAULT 'individual',
    credit_limit DECIMAL(15,2) DEFAULT 0,
    current_balance DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    source VARCHAR(100),
    is_vip BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Index'ler
CREATE INDEX idx_customers_company ON customers(company_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_name ON customers USING gin(to_tsvector('turkish', full_name));
CREATE INDEX idx_customers_tags ON customers USING gin(tags);
CREATE INDEX idx_customers_created ON customers(created_at DESC);
CREATE INDEX idx_customers_deleted ON customers(deleted_at) WHERE deleted_at IS NULL;

-- Trigger: updated_at
CREATE TRIGGER trigger_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_select_company" ON customers
    FOR SELECT USING (
        company_id = get_current_company_id() AND deleted_at IS NULL
    );

CREATE POLICY "customers_insert_company" ON customers
    FOR INSERT WITH CHECK (company_id = get_current_company_id());

CREATE POLICY "customers_update_company" ON customers
    FOR UPDATE USING (company_id = get_current_company_id());

CREATE POLICY "customers_delete_company" ON customers
    FOR DELETE USING (company_id = get_current_company_id());

-- ============================================
-- MÜŞTERİ ADRESLERİ
-- ============================================

CREATE TABLE customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    title VARCHAR(100) DEFAULT 'Ev',
    address TEXT NOT NULL,
    city VARCHAR(100),
    district VARCHAR(100),
    postal_code VARCHAR(20),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_customer_addresses_customer ON customer_addresses(customer_id);

ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_addresses_select_company" ON customer_addresses
    FOR SELECT USING (
        customer_id IN (SELECT id FROM customers WHERE company_id = get_current_company_id())
    );

CREATE POLICY "customer_addresses_insert_company" ON customer_addresses
    FOR INSERT WITH CHECK (
        customer_id IN (SELECT id FROM customers WHERE company_id = get_current_company_id())
    );

CREATE POLICY "customer_addresses_update_company" ON customer_addresses
    FOR UPDATE USING (
        customer_id IN (SELECT id FROM customers WHERE company_id = get_current_company_id())
    );

CREATE POLICY "customer_addresses_delete_company" ON customer_addresses
    FOR DELETE USING (
        customer_id IN (SELECT id FROM customers WHERE company_id = get_current_company_id())
    );

-- ============================================
-- MÜŞTERİ CİHAZLARI
-- ============================================

CREATE TABLE customer_phones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    imei VARCHAR(20),
    serial_number VARCHAR(100),
    color VARCHAR(50),
    purchase_date DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_customer_phones_customer ON customer_phones(customer_id);
CREATE INDEX idx_customer_phones_imei ON customer_phones(imei);

ALTER TABLE customer_phones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_phones_select_company" ON customer_phones
    FOR SELECT USING (
        customer_id IN (SELECT id FROM customers WHERE company_id = get_current_company_id())
    );

CREATE POLICY "customer_phones_insert_company" ON customer_phones
    FOR INSERT WITH CHECK (
        customer_id IN (SELECT id FROM customers WHERE company_id = get_current_company_id())
    );

CREATE POLICY "customer_phones_update_company" ON customer_phones
    FOR UPDATE USING (
        customer_id IN (SELECT id FROM customers WHERE company_id = get_current_company_id())
    );

CREATE POLICY "customer_phones_delete_company" ON customer_phones
    FOR DELETE USING (
        customer_id IN (SELECT id FROM customers WHERE company_id = get_current_company_id())
    );

-- ============================================
-- MÜŞTERİ NOTLARI
-- ============================================

CREATE TABLE customer_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    note TEXT NOT NULL,
    is_important BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_customer_notes_customer ON customer_notes(customer_id);
CREATE INDEX idx_customer_notes_important ON customer_notes(customer_id, is_important) WHERE is_important = true;

ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_notes_select_company" ON customer_notes
    FOR SELECT USING (
        customer_id IN (SELECT id FROM customers WHERE company_id = get_current_company_id())
    );

CREATE POLICY "customer_notes_insert_company" ON customer_notes
    FOR INSERT WITH CHECK (
        customer_id IN (SELECT id FROM customers WHERE company_id = get_current_company_id())
    );

CREATE POLICY "customer_notes_update_company" ON customer_notes
    FOR UPDATE USING (
        customer_id IN (SELECT id FROM customers WHERE company_id = get_current_company_id())
    );

CREATE POLICY "customer_notes_delete_company" ON customer_notes
    FOR DELETE USING (
        customer_id IN (SELECT id FROM customers WHERE company_id = get_current_company_id())
    );

-- ============================================
-- MÜŞTERİ BAKİYE GÜNCELLEME FONKSİYONU
-- ============================================

CREATE OR REPLACE FUNCTION update_customer_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE customers 
        SET current_balance = current_balance + NEW.amount
        WHERE id = NEW.customer_id;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE customers 
        SET current_balance = current_balance - OLD.amount + NEW.amount
        WHERE id = NEW.customer_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE customers 
        SET current_balance = current_balance - OLD.amount
        WHERE id = OLD.customer_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MÜŞTERİ ARAMA FONKSİYONU
-- ============================================

CREATE OR REPLACE FUNCTION search_customers(search_query TEXT)
RETURNS TABLE (
    id UUID,
    full_name VARCHAR,
    phone VARCHAR,
    email VARCHAR,
    company_name VARCHAR,
    current_balance DECIMAL,
    similarity REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.full_name,
        c.phone,
        c.email,
        c.company_name,
        c.current_balance,
        GREATEST(
            similarity(c.full_name, search_query),
            similarity(COALESCE(c.phone, ''), search_query),
            similarity(COALESCE(c.email, ''), search_query)
        ) as similarity
    FROM customers c
    WHERE c.company_id = get_current_company_id()
      AND c.deleted_at IS NULL
      AND (
          c.full_name ILIKE '%' || search_query || '%'
          OR c.phone ILIKE '%' || search_query || '%'
          OR c.email ILIKE '%' || search_query || '%'
          OR c.company_name ILIKE '%' || search_query || '%'
      )
    ORDER BY similarity DESC, c.full_name
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;



-- ===== 003_service_module.sql =====
-- Migration: 003_service_module
-- Description: Teknik Servis modülü - Servis kayıtları, durumlar, teşhis, parça kullanımı
-- Created: 2026-07-24

-- ============================================
-- SERVİS DURUMLARI (Konfigüre Edilebilir)
-- ============================================

CREATE TABLE service_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#6B7280',
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_final BOOLEAN DEFAULT false,
    requires_payment BOOLEAN DEFAULT false,
    send_notification BOOLEAN DEFAULT false,
    notification_template TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_service_statuses_company ON service_statuses(company_id);
CREATE INDEX idx_service_statuses_sort ON service_statuses(company_id, sort_order);

ALTER TABLE service_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_statuses_select_company" ON service_statuses
    FOR SELECT USING (company_id = get_current_company_id());

CREATE POLICY "service_statuses_insert_company" ON service_statuses
    FOR INSERT WITH CHECK (company_id = get_current_company_id());

CREATE POLICY "service_statuses_update_company" ON service_statuses
    FOR UPDATE USING (company_id = get_current_company_id());

CREATE POLICY "service_statuses_delete_company" ON service_statuses
    FOR DELETE USING (company_id = get_current_company_id());

-- Varsayılan servis durumları
INSERT INTO service_statuses (company_id, name, color, sort_order, is_final, requires_payment, send_notification) VALUES
((SELECT id FROM companies LIMIT 1), 'Bekliyor', '#9CA3AF', 10, false, false, false),
((SELECT id FROM companies LIMIT 1), 'İnceleniyor', '#3B82F6', 20, false, false, false),
((SELECT id FROM companies LIMIT 1), 'Onay Bekliyor', '#F59E0B', 30, false, false, true),
((SELECT id FROM companies LIMIT 1), 'Tamir Ediliyor', '#8B5CF6', 40, false, false, false),
((SELECT id FROM companies LIMIT 1), 'Kalite Kontrol', '#EC4899', 50, false, false, false),
((SELECT id FROM companies LIMIT 1), 'Hazır', '#10B981', 60, false, true, true),
((SELECT id FROM companies LIMIT 1), 'Teslim Edildi', '#059669', 70, true, false, false),
((SELECT id FROM companies LIMIT 1), 'İptal', '#EF4444', 80, true, false, false);

-- ============================================
-- SERVİS KAYITLARI
-- ============================================

CREATE TABLE service_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_number VARCHAR(50) UNIQUE NOT NULL DEFAULT generate_service_number(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),

    -- Müşteri Bilgileri
    customer_id UUID REFERENCES customers(id),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),

    -- Cihaz Bilgileri
    device_brand VARCHAR(100) NOT NULL,
    device_model VARCHAR(100) NOT NULL,
    device_color VARCHAR(50),
    imei VARCHAR(20),
    serial_number VARCHAR(100),
    device_password VARCHAR(100),
    device_condition TEXT,

    -- Servis Bilgileri
    problem_description TEXT NOT NULL,
    reported_issues JSONB DEFAULT '[]',
    estimated_cost DECIMAL(15,2),
    final_cost DECIMAL(15,2),

    -- Durum Takibi
    status_id UUID REFERENCES service_statuses(id),
    technician_id UUID REFERENCES users(id),
    priority service_priority DEFAULT 'normal',

    -- Garanti
    warranty_months INT DEFAULT 0,
    warranty_until DATE,

    -- Ödeme
    payment_status payment_status DEFAULT 'unpaid',
    total_amount DECIMAL(15,2) DEFAULT 0,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    payment_method payment_method,
    deposit_amount DECIMAL(15,2) DEFAULT 0,

    -- Teslim
    delivery_date TIMESTAMPTZ,
    delivered_by UUID REFERENCES users(id),
    received_by VARCHAR(255),
    signature_url TEXT,

    -- QR/Barkod
    qr_code VARCHAR(255) UNIQUE,
    barcode VARCHAR(255) UNIQUE,

    -- Meta
    source VARCHAR(50) DEFAULT 'manual',
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_service_orders_company ON service_orders(company_id);
CREATE INDEX idx_service_orders_number ON service_orders(service_number);
CREATE INDEX idx_service_orders_customer ON service_orders(customer_id);
CREATE INDEX idx_service_orders_status ON service_orders(status_id);
CREATE INDEX idx_service_orders_technician ON service_orders(technician_id);
CREATE INDEX idx_service_orders_created ON service_orders(created_at DESC);
CREATE INDEX idx_service_orders_deleted ON service_orders(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_service_orders_warranty ON service_orders(warranty_until) WHERE warranty_until IS NOT NULL;

-- Trigger: updated_at
CREATE TRIGGER trigger_service_orders_updated_at
    BEFORE UPDATE ON service_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Durum değişikliği loglama
CREATE TRIGGER trigger_service_status_history
    AFTER UPDATE OF status_id ON service_orders
    FOR EACH ROW
    WHEN (OLD.status_id IS DISTINCT FROM NEW.status_id)
    EXECUTE FUNCTION log_service_status_change();

-- RLS
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_orders_select_company" ON service_orders
    FOR SELECT USING (
        company_id = get_current_company_id() AND deleted_at IS NULL
    );

CREATE POLICY "service_orders_insert_company" ON service_orders
    FOR INSERT WITH CHECK (company_id = get_current_company_id());

CREATE POLICY "service_orders_update_company" ON service_orders
    FOR UPDATE USING (company_id = get_current_company_id());

CREATE POLICY "service_orders_delete_company" ON service_orders
    FOR DELETE USING (company_id = get_current_company_id());

-- ============================================
-- SERVİS DURUM GEÇMİŞİ
-- ============================================

CREATE TABLE service_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID REFERENCES service_orders(id) ON DELETE CASCADE,
    from_status_id UUID REFERENCES service_statuses(id),
    to_status_id UUID REFERENCES service_statuses(id),
    changed_by UUID REFERENCES users(id),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_service_status_history_order ON service_status_history(service_order_id);
CREATE INDEX idx_service_status_history_created ON service_status_history(created_at DESC);

ALTER TABLE service_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_status_history_select_company" ON service_status_history
    FOR SELECT USING (
        service_order_id IN (SELECT id FROM service_orders WHERE company_id = get_current_company_id())
    );

-- ============================================
-- SERVİS TEŞHİSİ
-- ============================================

CREATE TABLE service_diagnoses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID REFERENCES service_orders(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES users(id),
    diagnosis TEXT NOT NULL,
    solution TEXT,
    estimated_time INT,
    actual_time INT,
    is_approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_service_diagnoses_order ON service_diagnoses(service_order_id);

ALTER TABLE service_diagnoses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_diagnoses_select_company" ON service_diagnoses
    FOR SELECT USING (
        service_order_id IN (SELECT id FROM service_orders WHERE company_id = get_current_company_id())
    );

CREATE POLICY "service_diagnoses_insert_company" ON service_diagnoses
    FOR INSERT WITH CHECK (
        service_order_id IN (SELECT id FROM service_orders WHERE company_id = get_current_company_id())
    );

CREATE POLICY "service_diagnoses_update_company" ON service_diagnoses
    FOR UPDATE USING (
        service_order_id IN (SELECT id FROM service_orders WHERE company_id = get_current_company_id())
    );

-- ============================================
-- SERVİS FOTOĞRAFLARI
-- ============================================

CREATE TABLE service_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID REFERENCES service_orders(id) ON DELETE CASCADE,
    photo_type VARCHAR(20) DEFAULT 'other' CHECK (photo_type IN ('before', 'after', 'diagnosis', 'other')),
    storage_path TEXT NOT NULL,
    url TEXT,
    description TEXT,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_service_photos_order ON service_photos(service_order_id);
CREATE INDEX idx_service_photos_type ON service_photos(service_order_id, photo_type);

ALTER TABLE service_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_photos_select_company" ON service_photos
    FOR SELECT USING (
        service_order_id IN (SELECT id FROM service_orders WHERE company_id = get_current_company_id())
    );

-- ============================================
-- SERVİS VİDEOLARI
-- ============================================

CREATE TABLE service_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID REFERENCES service_orders(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    url TEXT,
    description TEXT,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_service_videos_order ON service_videos(service_order_id);

ALTER TABLE service_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_videos_select_company" ON service_videos
    FOR SELECT USING (
        service_order_id IN (SELECT id FROM service_orders WHERE company_id = get_current_company_id())
    );

-- ============================================
-- SERVİS PARÇA KULLANIMI
-- ============================================

CREATE TABLE service_parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID REFERENCES service_orders(id) ON DELETE CASCADE,
    stock_item_id UUID,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_cost DECIMAL(15,2),
    unit_price DECIMAL(15,2),
    total_price DECIMAL(15,2),
    is_warranty BOOLEAN DEFAULT false,
    notes TEXT,
    added_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_service_parts_order ON service_parts(service_order_id);
CREATE INDEX idx_service_parts_stock ON service_parts(stock_item_id);

ALTER TABLE service_parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_parts_select_company" ON service_parts
    FOR SELECT USING (
        service_order_id IN (SELECT id FROM service_orders WHERE company_id = get_current_company_id())
    );

CREATE POLICY "service_parts_insert_company" ON service_parts
    FOR INSERT WITH CHECK (
        service_order_id IN (SELECT id FROM service_orders WHERE company_id = get_current_company_id())
    );

CREATE POLICY "service_parts_update_company" ON service_parts
    FOR UPDATE USING (
        service_order_id IN (SELECT id FROM service_orders WHERE company_id = get_current_company_id())
    );

CREATE POLICY "service_parts_delete_company" ON service_parts
    FOR DELETE USING (
        service_order_id IN (SELECT id FROM service_orders WHERE company_id = get_current_company_id())
    );

-- ============================================
-- SERVİS İŞÇİLİK
-- ============================================

CREATE TABLE service_labor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID REFERENCES service_orders(id) ON DELETE CASCADE,
    labor_type VARCHAR(100),
    description TEXT,
    hours DECIMAL(5,2) DEFAULT 1,
    hourly_rate DECIMAL(15,2),
    total_price DECIMAL(15,2),
    is_custom_price BOOLEAN DEFAULT false,
    added_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_service_labor_order ON service_labor(service_order_id);

ALTER TABLE service_labor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_labor_select_company" ON service_labor
    FOR SELECT USING (
        service_order_id IN (SELECT id FROM service_orders WHERE company_id = get_current_company_id())
    );

CREATE POLICY "service_labor_insert_company" ON service_labor
    FOR INSERT WITH CHECK (
        service_order_id IN (SELECT id FROM service_orders WHERE company_id = get_current_company_id())
    );

CREATE POLICY "service_labor_update_company" ON service_labor
    FOR UPDATE USING (
        service_order_id IN (SELECT id FROM service_orders WHERE company_id = get_current_company_id())
    );

CREATE POLICY "service_labor_delete_company" ON service_labor
    FOR DELETE USING (
        service_order_id IN (SELECT id FROM service_orders WHERE company_id = get_current_company_id())
    );

-- ============================================
-- SERVİS NOTLARI
-- ============================================

CREATE TABLE service_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID REFERENCES service_orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    note TEXT NOT NULL,
    is_technician_only BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_service_notes_order ON service_notes(service_order_id);
CREATE INDEX idx_service_notes_technician ON service_notes(service_order_id, is_technician_only) WHERE is_technician_only = true;

ALTER TABLE service_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_notes_select_company" ON service_notes
    FOR SELECT USING (
        service_order_id IN (SELECT id FROM service_orders WHERE company_id = get_current_company_id())
        AND (
            is_technician_only = false 
            OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'partner', 'technician'))
        )
    );

CREATE POLICY "service_notes_insert_company" ON service_notes
    FOR INSERT WITH CHECK (
        service_order_id IN (SELECT id FROM service_orders WHERE company_id = get_current_company_id())
    );

-- ============================================
-- SERVİS TOPLAM TUTAR GÜNCELLEME FONKSİYONU
-- ============================================

CREATE OR REPLACE FUNCTION update_service_total_amount()
RETURNS TRIGGER AS $$
DECLARE
    parts_total DECIMAL(15,2);
    labor_total DECIMAL(15,2);
BEGIN
    -- Parça toplamı
    SELECT COALESCE(SUM(total_price), 0) INTO parts_total
    FROM service_parts
    WHERE service_order_id = COALESCE(NEW.service_order_id, OLD.service_order_id);

    -- İşçilik toplamı
    SELECT COALESCE(SUM(total_price), 0) INTO labor_total
    FROM service_labor
    WHERE service_order_id = COALESCE(NEW.service_order_id, OLD.service_order_id);

    -- Servis toplamını güncelle
    UPDATE service_orders
    SET total_amount = parts_total + labor_total,
        final_cost = parts_total + labor_total
    WHERE id = COALESCE(NEW.service_order_id, OLD.service_order_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'lar
CREATE TRIGGER trigger_service_parts_total
    AFTER INSERT OR UPDATE OR DELETE ON service_parts
    FOR EACH ROW
    EXECUTE FUNCTION update_service_total_amount();

CREATE TRIGGER trigger_service_labor_total
    AFTER INSERT OR UPDATE OR DELETE ON service_labor
    FOR EACH ROW
    EXECUTE FUNCTION update_service_total_amount();

-- ============================================
-- SERVİS ARAMA FONKSİYONU
-- ============================================

CREATE OR REPLACE FUNCTION search_services(search_query TEXT)
RETURNS TABLE (
    id UUID,
    service_number VARCHAR,
    customer_name VARCHAR,
    customer_phone VARCHAR,
    device_brand VARCHAR,
    device_model VARCHAR,
    status_name VARCHAR,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        so.id,
        so.service_number,
        so.customer_name,
        so.customer_phone,
        so.device_brand,
        so.device_model,
        ss.name as status_name,
        so.created_at
    FROM service_orders so
    LEFT JOIN service_statuses ss ON so.status_id = ss.id
    WHERE so.company_id = get_current_company_id()
      AND so.deleted_at IS NULL
      AND (
          so.service_number ILIKE '%' || search_query || '%'
          OR so.customer_name ILIKE '%' || search_query || '%'
          OR so.customer_phone ILIKE '%' || search_query || '%'
          OR so.device_brand ILIKE '%' || search_query || '%'
          OR so.device_model ILIKE '%' || search_query || '%'
          OR so.imei ILIKE '%' || search_query || '%'
      )
    ORDER BY so.created_at DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- GARANTİ BİTİŞ BİLDİRİMİ FONKSİYONU
-- ============================================

CREATE OR REPLACE FUNCTION check_warranty_expiry()
RETURNS void AS $$
BEGIN
    INSERT INTO notifications (company_id, category, title, message, entity_type, entity_id)
    SELECT 
        so.company_id,
        'warranty_expiry',
        'Garanti Süresi Doluyor',
        so.customer_name || ' - ' || so.device_brand || ' ' || so.device_model || ' cihazının garanti süresi 7 gün içinde dolacak.',
        'service_order',
        so.id
    FROM service_orders so
    WHERE so.warranty_until BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
      AND so.payment_status != 'refunded'
      AND so.deleted_at IS NULL
      AND NOT EXISTS (
          SELECT 1 FROM notifications n 
          WHERE n.entity_id = so.id 
          AND n.category = 'warranty_expiry'
          AND n.created_at > CURRENT_DATE - INTERVAL '7 days'
      );
END;
$$ LANGUAGE plpgsql;



-- ===== 004_stock_and_purchase_module.sql =====
-- Migration: 004_stock_and_purchase_module
-- Description: Stok yönetimi, satın alma, tedarikçi modülleri
-- Created: 2026-07-24

-- ============================================
-- KATEGORİLER
-- ============================================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES categories(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_categories_company ON categories(company_id);
CREATE INDEX idx_categories_parent ON categories(parent_id);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select_company" ON categories
    FOR SELECT USING (company_id = get_current_company_id());

CREATE POLICY "categories_insert_company" ON categories
    FOR INSERT WITH CHECK (company_id = get_current_company_id());

CREATE POLICY "categories_update_company" ON categories
    FOR UPDATE USING (company_id = get_current_company_id());

CREATE POLICY "categories_delete_company" ON categories
    FOR DELETE USING (company_id = get_current_company_id());

-- ============================================
-- MARKALAR
-- ============================================

CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_brands_company ON brands(company_id);

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brands_select_company" ON brands
    FOR SELECT USING (company_id = get_current_company_id());

CREATE POLICY "brands_insert_company" ON brands
    FOR INSERT WITH CHECK (company_id = get_current_company_id());

CREATE POLICY "brands_update_company" ON brands
    FOR UPDATE USING (company_id = get_current_company_id());

-- ============================================
-- MODELLER
-- ============================================

CREATE TABLE models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_models_brand ON models(brand_id);

ALTER TABLE models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "models_select_company" ON models
    FOR SELECT USING (
        brand_id IN (SELECT id FROM brands WHERE company_id = get_current_company_id())
    );

CREATE POLICY "models_insert_company" ON models
    FOR INSERT WITH CHECK (
        brand_id IN (SELECT id FROM brands WHERE company_id = get_current_company_id())
    );

-- ============================================
-- DEPOLAR
-- ============================================

CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    manager_id UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_warehouses_company ON warehouses(company_id);

ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "warehouses_select_company" ON warehouses
    FOR SELECT USING (company_id = get_current_company_id());

CREATE POLICY "warehouses_insert_company" ON warehouses
    FOR INSERT WITH CHECK (company_id = get_current_company_id());

-- ============================================
-- STOK ÜRÜNLERİ
-- ============================================

CREATE TABLE stock_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    brand_id UUID REFERENCES brands(id),
    model_id UUID REFERENCES models(id),

    sku VARCHAR(100) UNIQUE DEFAULT generate_sku(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    barcode VARCHAR(100) UNIQUE,
    qr_code VARCHAR(255) UNIQUE,

    purchase_price_usd DECIMAL(15,4),
    purchase_price_try DECIMAL(15,2),
    sale_price DECIMAL(15,2),
    profit_margin DECIMAL(5,2) DEFAULT 30,
    min_sale_price DECIMAL(15,2),

    quantity DECIMAL(10,2) DEFAULT 0,
    min_stock DECIMAL(10,2) DEFAULT 0,
    max_stock DECIMAL(10,2) DEFAULT 0,
    reorder_point DECIMAL(10,2) DEFAULT 0,

    unit VARCHAR(20) DEFAULT 'adet',
    shelf_location VARCHAR(100),
    warehouse_id UUID REFERENCES warehouses(id),

    is_active BOOLEAN DEFAULT true,
    is_serialized BOOLEAN DEFAULT false,
    track_imei BOOLEAN DEFAULT false,

    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_stock_items_company ON stock_items(company_id);
CREATE INDEX idx_stock_items_sku ON stock_items(sku);
CREATE INDEX idx_stock_items_barcode ON stock_items(barcode);
CREATE INDEX idx_stock_items_name ON stock_items USING gin(to_tsvector('turkish', name));
CREATE INDEX idx_stock_items_category ON stock_items(category_id);
CREATE INDEX idx_stock_items_brand ON stock_items(brand_id);
CREATE INDEX idx_stock_items_quantity ON stock_items(quantity);
CREATE INDEX idx_stock_items_low_stock ON stock_items(company_id, quantity, min_stock) WHERE quantity <= min_stock;
CREATE INDEX idx_stock_items_deleted ON stock_items(deleted_at) WHERE deleted_at IS NULL;

-- Trigger: updated_at
CREATE TRIGGER trigger_stock_items_updated_at
    BEFORE UPDATE ON stock_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Düşük stok kontrolü
CREATE TRIGGER trigger_stock_items_low_stock
    AFTER UPDATE OF quantity ON stock_items
    FOR EACH ROW
    EXECUTE FUNCTION check_low_stock();

-- RLS
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stock_items_select_company" ON stock_items
    FOR SELECT USING (
        company_id = get_current_company_id() AND deleted_at IS NULL
    );

CREATE POLICY "stock_items_insert_company" ON stock_items
    FOR INSERT WITH CHECK (company_id = get_current_company_id());

CREATE POLICY "stock_items_update_company" ON stock_items
    FOR UPDATE USING (company_id = get_current_company_id());

CREATE POLICY "stock_items_delete_company" ON stock_items
    FOR DELETE USING (company_id = get_current_company_id());

-- ============================================
-- SERİ NUMARASI / IMEİ TAKİBİ
-- ============================================

CREATE TABLE stock_serials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_item_id UUID REFERENCES stock_items(id) ON DELETE CASCADE,
    serial_number VARCHAR(100) NOT NULL,
    imei VARCHAR(20),
    status serial_status DEFAULT 'in_stock',
    purchase_price DECIMAL(15,2),
    sale_price DECIMAL(15,2),
    supplier_id UUID,
    purchase_order_id UUID,
    service_order_id UUID REFERENCES service_orders(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_stock_serials_item ON stock_serials(stock_item_id);
CREATE INDEX idx_stock_serials_number ON stock_serials(serial_number);
CREATE INDEX idx_stock_serials_imei ON stock_serials(imei);
CREATE INDEX idx_stock_serials_status ON stock_serials(status);

ALTER TABLE stock_serials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stock_serials_select_company" ON stock_serials
    FOR SELECT USING (
        stock_item_id IN (SELECT id FROM stock_items WHERE company_id = get_current_company_id())
    );

CREATE POLICY "stock_serials_insert_company" ON stock_serials
    FOR INSERT WITH CHECK (
        stock_item_id IN (SELECT id FROM stock_items WHERE company_id = get_current_company_id())
    );

-- ============================================
-- STOK HAREKETLERİ
-- ============================================

CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_item_id UUID REFERENCES stock_items(id),
    serial_id UUID REFERENCES stock_serials(id),
    movement_type movement_type NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(15,2),
    unit_price DECIMAL(15,2),
    reference_type VARCHAR(50),
    reference_id UUID,
    description TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_stock_movements_item ON stock_movements(stock_item_id);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_created ON stock_movements(created_at DESC);
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_type, reference_id);

-- Trigger: Stok miktarı güncelleme
CREATE TRIGGER trigger_stock_movements_quantity
    AFTER INSERT ON stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_quantity();

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stock_movements_select_company" ON stock_movements
    FOR SELECT USING (
        stock_item_id IN (SELECT id FROM stock_items WHERE company_id = get_current_company_id())
    );

CREATE POLICY "stock_movements_insert_company" ON stock_movements
    FOR INSERT WITH CHECK (
        stock_item_id IN (SELECT id FROM stock_items WHERE company_id = get_current_company_id())
    );

-- ============================================
-- TEDARİKÇİLER
-- ============================================

CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    country VARCHAR(100),
    website VARCHAR(255),
    platform VARCHAR(20) DEFAULT 'other' CHECK (platform IN ('alibaba', 'aliexpress', 'local', 'other')),
    tax_number VARCHAR(50),
    currency VARCHAR(3) DEFAULT 'USD',
    payment_terms TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    current_balance DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_suppliers_company ON suppliers(company_id);
CREATE INDEX idx_suppliers_platform ON suppliers(company_id, platform);

CREATE TRIGGER trigger_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suppliers_select_company" ON suppliers
    FOR SELECT USING (company_id = get_current_company_id());

CREATE POLICY "suppliers_insert_company" ON suppliers
    FOR INSERT WITH CHECK (company_id = get_current_company_id());

CREATE POLICY "suppliers_update_company" ON suppliers
    FOR UPDATE USING (company_id = get_current_company_id());

-- ============================================
-- SATIN ALMA SİPARİŞLERİ
-- ============================================

CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id),
    status purchase_status DEFAULT 'draft',

    subtotal DECIMAL(15,2) DEFAULT 0,
    shipping_cost DECIMAL(15,2) DEFAULT 0,
    customs_cost DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    other_costs DECIMAL(15,2) DEFAULT 0,
    total_cost DECIMAL(15,2) DEFAULT 0,

    currency VARCHAR(3) DEFAULT 'USD',
    exchange_rate DECIMAL(10,4) DEFAULT 1,
    total_cost_try DECIMAL(15,2) DEFAULT 0,

    tracking_number VARCHAR(100),
    shipping_method VARCHAR(100),
    estimated_arrival DATE,
    actual_arrival DATE,

    payment_status payment_status DEFAULT 'unpaid',
    paid_amount DECIMAL(15,2) DEFAULT 0,

    notes TEXT,
    documents JSONB DEFAULT '[]',

    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_purchase_orders_company ON purchase_orders(company_id);
CREATE INDEX idx_purchase_orders_number ON purchase_orders(order_number);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_created ON purchase_orders(created_at DESC);

CREATE TRIGGER trigger_purchase_orders_updated_at
    BEFORE UPDATE ON purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "purchase_orders_select_company" ON purchase_orders
    FOR SELECT USING (company_id = get_current_company_id());

CREATE POLICY "purchase_orders_insert_company" ON purchase_orders
    FOR INSERT WITH CHECK (company_id = get_current_company_id());

CREATE POLICY "purchase_orders_update_company" ON purchase_orders
    FOR UPDATE USING (company_id = get_current_company_id());

-- ============================================
-- SATIN ALMA SİPARİŞ KALEMLERİ
-- ============================================

CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    stock_item_id UUID REFERENCES stock_items(id),
    item_name VARCHAR(255),
    sku VARCHAR(100),
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2),
    received_qty DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_purchase_order_items_order ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_purchase_order_items_stock ON purchase_order_items(stock_item_id);

ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "purchase_order_items_select_company" ON purchase_order_items
    FOR SELECT USING (
        purchase_order_id IN (SELECT id FROM purchase_orders WHERE company_id = get_current_company_id())
    );

CREATE POLICY "purchase_order_items_insert_company" ON purchase_order_items
    FOR INSERT WITH CHECK (
        purchase_order_id IN (SELECT id FROM purchase_orders WHERE company_id = get_current_company_id())
    );

-- ============================================
-- TEDARİKÇİ ÖDEMELERİ
-- ============================================

CREATE TABLE supplier_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES suppliers(id),
    purchase_order_id UUID REFERENCES purchase_orders(id),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    exchange_rate DECIMAL(10,4) DEFAULT 1,
    payment_method payment_method DEFAULT 'bank_transfer',
    payment_date DATE,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_supplier_payments_supplier ON supplier_payments(supplier_id);
CREATE INDEX idx_supplier_payments_order ON supplier_payments(purchase_order_id);

ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "supplier_payments_select_company" ON supplier_payments
    FOR SELECT USING (
        supplier_id IN (SELECT id FROM suppliers WHERE company_id = get_current_company_id())
    );

-- ============================================
-- STOK ARAMA FONKSİYONU
-- ============================================

CREATE OR REPLACE FUNCTION search_stock(search_query TEXT)
RETURNS TABLE (
    id UUID,
    sku VARCHAR,
    name VARCHAR,
    barcode VARCHAR,
    category_name VARCHAR,
    brand_name VARCHAR,
    quantity DECIMAL,
    sale_price DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        si.id,
        si.sku,
        si.name,
        si.barcode,
        c.name as category_name,
        b.name as brand_name,
        si.quantity,
        si.sale_price
    FROM stock_items si
    LEFT JOIN categories c ON si.category_id = c.id
    LEFT JOIN brands b ON si.brand_id = b.id
    WHERE si.company_id = get_current_company_id()
      AND si.deleted_at IS NULL
      AND (
          si.name ILIKE '%' || search_query || '%'
          OR si.sku ILIKE '%' || search_query || '%'
          OR si.barcode ILIKE '%' || search_query || '%'
          OR c.name ILIKE '%' || search_query || '%'
          OR b.name ILIKE '%' || search_query || '%'
      )
    ORDER BY si.name
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- OTOMATİK SATIŞ FİYATI HESAPLAMA
-- ============================================

CREATE OR REPLACE FUNCTION calculate_sale_price()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.profit_margin IS NOT NULL AND NEW.purchase_price_try IS NOT NULL THEN
        NEW.sale_price := NEW.purchase_price_try * (1 + NEW.profit_margin / 100);
    ELSIF NEW.profit_margin IS NOT NULL AND NEW.purchase_price_usd IS NOT NULL THEN
        -- Kur bilgisi settings'ten alınacak, şimdilik sabit
        NEW.sale_price := NEW.purchase_price_usd * 35 * (1 + NEW.profit_margin / 100);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_sale_price
    BEFORE INSERT OR UPDATE OF purchase_price_usd, purchase_price_try, profit_margin ON stock_items
    FOR EACH ROW
    EXECUTE FUNCTION calculate_sale_price();



-- ===== 005_sales_finance_assets_notifications.sql =====
-- Migration: 005_sales_finance_assets_notifications
-- Description: Satış, Finans, Demirbaş, Bildirim ve Ayar modülleri
-- Created: 2026-07-24

-- ============================================
-- KAMPANYALAR
-- ============================================

CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed', 'buy_x_get_y')),
    discount_value DECIMAL(15,2),
    start_date DATE,
    end_date DATE,
    min_purchase DECIMAL(15,2) DEFAULT 0,
    applicable_categories UUID[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_campaigns_company ON campaigns(company_id);
CREATE INDEX idx_campaigns_active ON campaigns(company_id, is_active) WHERE is_active = true;

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_select_company" ON campaigns
    FOR SELECT USING (company_id = get_current_company_id());

CREATE POLICY "campaigns_insert_company" ON campaigns
    FOR INSERT WITH CHECK (company_id = get_current_company_id());

-- ============================================
-- SATIŞ SİPARİŞLERİ
-- ============================================

CREATE TABLE sale_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    customer_id UUID REFERENCES customers(id),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    order_type VARCHAR(20) DEFAULT 'retail' CHECK (order_type IN ('retail', 'wholesale')),
    status sale_status DEFAULT 'draft',

    subtotal DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    discount_type VARCHAR(20) DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
    tax_amount DECIMAL(15,2) DEFAULT 0,
    shipping_cost DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,

    payment_status payment_status DEFAULT 'unpaid',
    paid_amount DECIMAL(15,2) DEFAULT 0,

    delivery_address TEXT,
    delivery_date DATE,

    campaign_id UUID REFERENCES campaigns(id),

    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sale_orders_company ON sale_orders(company_id);
CREATE INDEX idx_sale_orders_number ON sale_orders(order_number);
CREATE INDEX idx_sale_orders_customer ON sale_orders(customer_id);
CREATE INDEX idx_sale_orders_status ON sale_orders(status);
CREATE INDEX idx_sale_orders_created ON sale_orders(created_at DESC);

CREATE TRIGGER trigger_sale_orders_updated_at
    BEFORE UPDATE ON sale_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE sale_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sale_orders_select_company" ON sale_orders
    FOR SELECT USING (company_id = get_current_company_id());

CREATE POLICY "sale_orders_insert_company" ON sale_orders
    FOR INSERT WITH CHECK (company_id = get_current_company_id());

CREATE POLICY "sale_orders_update_company" ON sale_orders
    FOR UPDATE USING (company_id = get_current_company_id());

-- ============================================
-- SATIŞ KALEMLERİ
-- ============================================

CREATE TABLE sale_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_order_id UUID REFERENCES sale_orders(id) ON DELETE CASCADE,
    stock_item_id UUID REFERENCES stock_items(id),
    serial_id UUID REFERENCES stock_serials(id),
    item_name VARCHAR(255),
    sku VARCHAR(100),
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total_price DECIMAL(15,2),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sale_order_items_order ON sale_order_items(sale_order_id);
CREATE INDEX idx_sale_order_items_stock ON sale_order_items(stock_item_id);

ALTER TABLE sale_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sale_order_items_select_company" ON sale_order_items
    FOR SELECT USING (
        sale_order_id IN (SELECT id FROM sale_orders WHERE company_id = get_current_company_id())
    );

-- ============================================
-- HESAPLAR (Kasa, Banka)
-- ============================================

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    account_type account_type NOT NULL,
    bank_name VARCHAR(255),
    account_number VARCHAR(100),
    iban VARCHAR(50),
    currency VARCHAR(3) DEFAULT 'TRY',
    current_balance DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_accounts_company ON accounts(company_id);
CREATE INDEX idx_accounts_type ON accounts(company_id, account_type);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounts_select_company" ON accounts
    FOR SELECT USING (company_id = get_current_company_id());

CREATE POLICY "accounts_insert_company" ON accounts
    FOR INSERT WITH CHECK (company_id = get_current_company_id());

CREATE POLICY "accounts_update_company" ON accounts
    FOR UPDATE USING (company_id = get_current_company_id());

-- ============================================
-- FİNANSAL HAREKETLER
-- ============================================

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_number VARCHAR(50) UNIQUE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id),

    transaction_type transaction_type NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    exchange_rate DECIMAL(10,4) DEFAULT 1,

    entity_type VARCHAR(50),
    entity_id UUID,
    entity_name VARCHAR(255),

    reference_type VARCHAR(50),
    reference_id UUID,

    description TEXT,
    attachments JSONB DEFAULT '[]',

    transaction_date DATE NOT NULL,

    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_transactions_company ON transactions(company_id);
CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX idx_transactions_entity ON transactions(entity_type, entity_id);
CREATE INDEX idx_transactions_reference ON transactions(reference_type, reference_id);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_select_company" ON transactions
    FOR SELECT USING (company_id = get_current_company_id());

CREATE POLICY "transactions_insert_company" ON transactions
    FOR INSERT WITH CHECK (company_id = get_current_company_id());

-- ============================================
-- HESAP BAKİYE GÜNCELLEME
-- ============================================

CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.transaction_type IN ('income', 'customer_payment') THEN
            UPDATE accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.account_id;
        ELSIF NEW.transaction_type IN ('expense', 'supplier_payment', 'salary', 'rent', 'utility') THEN
            UPDATE accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.account_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.transaction_type IN ('income', 'customer_payment') THEN
            UPDATE accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.account_id;
        ELSIF OLD.transaction_type IN ('expense', 'supplier_payment', 'salary', 'rent', 'utility') THEN
            UPDATE accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.account_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_transactions_balance
    AFTER INSERT OR DELETE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_account_balance();

-- ============================================
-- ORTAK YATIRIMLARI
-- ============================================

CREATE TABLE partner_investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES users(id),
    investment_type investment_type NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(15,2),
    asset_id UUID,
    stock_item_id UUID REFERENCES stock_items(id),
    quantity DECIMAL(10,2),
    is_approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_partner_investments_company ON partner_investments(company_id);
CREATE INDEX idx_partner_investments_partner ON partner_investments(partner_id);
CREATE INDEX idx_partner_investments_approved ON partner_investments(is_approved);

ALTER TABLE partner_investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partner_investments_select_company" ON partner_investments
    FOR SELECT USING (company_id = get_current_company_id());

CREATE POLICY "partner_investments_insert_company" ON partner_investments
    FOR INSERT WITH CHECK (company_id = get_current_company_id());

CREATE POLICY "partner_investments_update_company" ON partner_investments
    FOR UPDATE USING (company_id = get_current_company_id());

-- ============================================
-- DEMİRBAŞLAR
-- ============================================

CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),

    asset_code VARCHAR(50) UNIQUE DEFAULT generate_asset_code(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category asset_category NOT NULL,

    purchase_price DECIMAL(15,2),
    purchase_date DATE,
    currency VARCHAR(3) DEFAULT 'TRY',

    condition asset_condition DEFAULT 'new',
    status asset_status DEFAULT 'active',
    location VARCHAR(255),

    depreciation_method VARCHAR(20) DEFAULT 'straight_line' CHECK (depreciation_method IN ('straight_line', 'declining_balance')),
    useful_life_years INT,
    salvage_value DECIMAL(15,2) DEFAULT 0,
    monthly_depreciation DECIMAL(15,2),
    accumulated_depreciation DECIMAL(15,2) DEFAULT 0,
    book_value DECIMAL(15,2),

    assigned_to UUID REFERENCES users(id),

    serial_number VARCHAR(100),
    brand VARCHAR(100),
    model VARCHAR(100),
    supplier_id UUID REFERENCES suppliers(id),
    warranty_until DATE,
    documents JSONB DEFAULT '[]',
    notes TEXT,

    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_assets_company ON assets(company_id);
CREATE INDEX idx_assets_code ON assets(asset_code);
CREATE INDEX idx_assets_category ON assets(company_id, category);
CREATE INDEX idx_assets_status ON assets(company_id, status);

CREATE TRIGGER trigger_assets_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assets_select_company" ON assets
    FOR SELECT USING (company_id = get_current_company_id());

CREATE POLICY "assets_insert_company" ON assets
    FOR INSERT WITH CHECK (company_id = get_current_company_id());

CREATE POLICY "assets_update_company" ON assets
    FOR UPDATE USING (company_id = get_current_company_id());

-- ============================================
-- DEMİRBAŞ BAKIM KAYITLARI
-- ============================================

CREATE TABLE asset_maintenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    maintenance_type VARCHAR(20) DEFAULT 'routine' CHECK (maintenance_type IN ('routine', 'repair', 'upgrade')),
    description TEXT,
    cost DECIMAL(15,2),
    performed_by UUID REFERENCES users(id),
    performed_date DATE,
    next_due_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_asset_maintenance_asset ON asset_maintenance(asset_id);

ALTER TABLE asset_maintenance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "asset_maintenance_select_company" ON asset_maintenance
    FOR SELECT USING (
        asset_id IN (SELECT id FROM assets WHERE company_id = get_current_company_id())
    );

-- ============================================
-- BİLDİRİMLER
-- ============================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),

    title VARCHAR(255) NOT NULL,
    message TEXT,
    type notification_type DEFAULT 'info',
    category notification_category,

    entity_type VARCHAR(50),
    entity_id UUID,

    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,

    sent_via JSONB DEFAULT '["app"]',
    whatsapp_sent BOOLEAN DEFAULT false,
    whatsapp_sent_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_company ON notifications(company_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_category ON notifications(company_id, category);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_user" ON notifications
    FOR SELECT USING (
        company_id = get_current_company_id()
        AND (user_id IS NULL OR user_id = auth.uid())
    );

CREATE POLICY "notifications_update_user" ON notifications
    FOR UPDATE USING (
        company_id = get_current_company_id()
        AND (user_id IS NULL OR user_id = auth.uid())
    );

-- ============================================
-- BİLDİRİM ŞABLONLARI
-- ============================================

CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    channel notification_channel DEFAULT 'whatsapp',
    subject VARCHAR(255),
    template_body TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notification_templates_company ON notification_templates(company_id);
CREATE INDEX idx_notification_templates_category ON notification_templates(company_id, category);

ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_templates_select_company" ON notification_templates
    FOR SELECT USING (company_id = get_current_company_id());

CREATE POLICY "notification_templates_insert_company" ON notification_templates
    FOR INSERT WITH CHECK (company_id = get_current_company_id());

-- ============================================
-- ŞİRKET AYARLARI
-- ============================================

CREATE TABLE company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE,

    default_currency VARCHAR(3) DEFAULT 'TRY',
    timezone VARCHAR(50) DEFAULT 'Europe/Istanbul',
    date_format VARCHAR(20) DEFAULT 'DD.MM.YYYY',

    default_warranty_months INT DEFAULT 3,
    auto_assign_technician BOOLEAN DEFAULT true,
    service_number_prefix VARCHAR(10) DEFAULT 'SR',

    low_stock_threshold INT DEFAULT 10,
    auto_calculate_sale_price BOOLEAN DEFAULT true,
    default_profit_margin DECIMAL(5,2) DEFAULT 30,

    default_payment_terms INT DEFAULT 30,

    whatsapp_enabled BOOLEAN DEFAULT true,
    auto_notify_customer BOOLEAN DEFAULT true,

    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER trigger_company_settings_updated_at
    BEFORE UPDATE ON company_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_settings_select_company" ON company_settings
    FOR SELECT USING (company_id = get_current_company_id());

CREATE POLICY "company_settings_update_admin" ON company_settings
    FOR UPDATE USING (
        company_id = get_current_company_id()
        AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- DASHBOARD METRICS (MATERIALIZED VIEW)
-- ============================================

CREATE MATERIALIZED VIEW dashboard_metrics AS
SELECT 
    c.id as company_id,

    -- Bugünkü servis sayısı
    (SELECT COUNT(*) FROM service_orders so 
     WHERE so.company_id = c.id 
     AND so.deleted_at IS NULL 
     AND DATE(so.created_at) = CURRENT_DATE) as today_services,

    -- Bekleyen servis sayısı
    (SELECT COUNT(*) FROM service_orders so 
     JOIN service_statuses ss ON so.status_id = ss.id
     WHERE so.company_id = c.id 
     AND so.deleted_at IS NULL 
     AND ss.is_final = false) as pending_services,

    -- Hazır cihazlar
    (SELECT COUNT(*) FROM service_orders so 
     JOIN service_statuses ss ON so.status_id = ss.id
     WHERE so.company_id = c.id 
     AND so.deleted_at IS NULL 
     AND ss.name = 'Hazır') as ready_devices,

    -- Teslim bekleyen
    (SELECT COUNT(*) FROM service_orders so 
     JOIN service_statuses ss ON so.status_id = ss.id
     WHERE so.company_id = c.id 
     AND so.deleted_at IS NULL 
     AND ss.name = 'Hazır'
     AND so.payment_status = 'paid') as waiting_delivery,

    -- Bugünkü ciro
    (SELECT COALESCE(SUM(total_amount), 0) FROM service_orders so 
     WHERE so.company_id = c.id 
     AND so.deleted_at IS NULL 
     AND DATE(so.created_at) = CURRENT_DATE
     AND so.payment_status = 'paid') as today_revenue,

    -- Düşük stok sayısı
    (SELECT COUNT(*) FROM stock_items si 
     WHERE si.company_id = c.id 
     AND si.deleted_at IS NULL 
     AND si.quantity <= si.min_stock 
     AND si.min_stock > 0) as low_stock_count,

    -- Toplam müşteri
    (SELECT COUNT(*) FROM customers cu 
     WHERE cu.company_id = c.id 
     AND cu.deleted_at IS NULL) as total_customers,

    -- Toplam borç (müşterilerden alınacak)
    (SELECT COALESCE(SUM(current_balance), 0) FROM customers cu 
     WHERE cu.company_id = c.id 
     AND cu.deleted_at IS NULL 
     AND cu.current_balance > 0) as total_receivables,

    -- Toplam alacak (tedarikçilere ödenecek)
    (SELECT COALESCE(SUM(current_balance), 0) FROM suppliers s 
     WHERE s.company_id = c.id 
     AND s.current_balance > 0) as total_payables,

    CURRENT_DATE as calculated_date

FROM companies c;

CREATE UNIQUE INDEX idx_dashboard_metrics_company ON dashboard_metrics(company_id);

-- Dashboard metrics yenileme fonksiyonu
CREATE OR REPLACE FUNCTION refresh_dashboard_metrics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_metrics;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED DATA - Varsayılan Hesaplar
-- ============================================

INSERT INTO accounts (company_id, name, account_type, currency)
SELECT id, 'Ana Kasa', 'cash', 'TRY' FROM companies LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO accounts (company_id, name, account_type, currency)
SELECT id, 'Banka Hesabı', 'bank', 'TRY' FROM companies LIMIT 1
ON CONFLICT DO NOTHING;


-- ============================================
-- ŞİRKET OLUŞTURULDUĞUNDA AYARLARI OTOMAYİK EKLE
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_company()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO company_settings (company_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_new_company
    AFTER INSERT ON companies
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_company();

-- Mevcut şirket için ayarları ekle (eğer yoksa)
INSERT INTO company_settings (company_id)
SELECT id FROM companies
WHERE id NOT IN (SELECT company_id FROM company_settings)
ON CONFLICT DO NOTHING;

