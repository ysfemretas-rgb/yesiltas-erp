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

