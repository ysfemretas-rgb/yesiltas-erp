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

