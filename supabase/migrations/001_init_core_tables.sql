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

