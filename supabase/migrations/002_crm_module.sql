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

