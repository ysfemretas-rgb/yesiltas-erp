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

