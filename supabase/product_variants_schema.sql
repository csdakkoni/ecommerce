-- =====================================================
-- PRODUCT VARIANTS SCHEMA
-- Ürün Varyant Sistemi (Perde, Kumaş ölçü seçimi vb.)
-- =====================================================

-- 1. Seçenek Grupları (Genişlik, Uzunluk, Renk, Kalite vb.)
CREATE TABLE IF NOT EXISTS product_option_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    type VARCHAR(20) DEFAULT 'select' CHECK (type IN ('select', 'radio', 'color_swatch', 'size_grid')),
    is_required BOOLEAN DEFAULT true,
    affects_price BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Seçenek Değerleri (100cm, 150cm, Beyaz, Premium vb.)
CREATE TABLE IF NOT EXISTS product_option_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    option_group_id UUID NOT NULL REFERENCES product_option_groups(id) ON DELETE CASCADE,
    value VARCHAR(100) NOT NULL,
    value_en VARCHAR(100),
    price_modifier DECIMAL(10,2) DEFAULT 0, -- Sabit fiyat ekleme (+100₺)
    price_modifier_percent DECIMAL(5,2) DEFAULT 0, -- Yüzde ekleme (+%30)
    sku_suffix VARCHAR(50), -- Stok takibi için (örn: -200CM)
    image TEXT, -- Renk örnekleri için görsel URL
    hex_color VARCHAR(7), -- Renk seçimi için hex kod (#FFFFFF)
    is_default BOOLEAN DEFAULT false,
    is_available BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Ürün Varyantları (Stok takibi için kombinasyonlar - opsiyonel)
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    option_combination JSONB NOT NULL, -- {"width": "200cm", "length": "250cm", "color": "Beyaz"}
    sku VARCHAR(100) UNIQUE,
    stock INTEGER DEFAULT 0,
    price_override DECIMAL(10,2), -- Kombinasyon için özel fiyat (null = hesaplanmış fiyat kullan)
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_option_groups_product ON product_option_groups(product_id);
CREATE INDEX IF NOT EXISTS idx_product_option_values_group ON product_option_values(option_group_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE product_option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- product_option_groups policies
DROP POLICY IF EXISTS "Anyone can view option groups" ON product_option_groups;
CREATE POLICY "Anyone can view option groups" ON product_option_groups
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can manage option groups" ON product_option_groups;
CREATE POLICY "Admin can manage option groups" ON product_option_groups
    FOR ALL USING (public.is_admin() = true);

-- product_option_values policies
DROP POLICY IF EXISTS "Anyone can view option values" ON product_option_values;
CREATE POLICY "Anyone can view option values" ON product_option_values
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can manage option values" ON product_option_values;
CREATE POLICY "Admin can manage option values" ON product_option_values
    FOR ALL USING (public.is_admin() = true);

-- product_variants policies
DROP POLICY IF EXISTS "Anyone can view variants" ON product_variants;
CREATE POLICY "Anyone can view variants" ON product_variants
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can manage variants" ON product_variants;
CREATE POLICY "Admin can manage variants" ON product_variants
    FOR ALL USING (public.is_admin() = true);

-- =====================================================
-- products tablosuna has_variants alanı ekle
-- =====================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false;

-- =====================================================
-- Updated_at trigger fonksiyonu
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS update_product_option_groups_updated_at ON product_option_groups;
CREATE TRIGGER update_product_option_groups_updated_at
    BEFORE UPDATE ON product_option_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_option_values_updated_at ON product_option_values;
CREATE TRIGGER update_product_option_values_updated_at
    BEFORE UPDATE ON product_option_values
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_variants_updated_at ON product_variants;
CREATE TRIGGER update_product_variants_updated_at
    BEFORE UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ÖRNEK VERİ (Test için - opsiyonel)
-- Bu kısım, mevcut bir ürün için örnek varyant ekler
-- =====================================================

-- Önce örnek ürün ID'sini bulup varyant eklemek için:
-- (Bu kısım manuel çalıştırılabilir veya geçici test için kullanılabilir)

/*
-- Örnek: İlk aktif ürüne varyant ekle
DO $$
DECLARE
    v_product_id UUID;
    v_group_width UUID;
    v_group_length UUID;
    v_group_color UUID;
    v_group_quality UUID;
BEGIN
    -- İlk aktif ürünü bul
    SELECT id INTO v_product_id FROM products WHERE is_active = true LIMIT 1;
    
    IF v_product_id IS NULL THEN
        RAISE NOTICE 'Aktif ürün bulunamadı';
        RETURN;
    END IF;
    
    -- Ürünü varyantlı olarak işaretle
    UPDATE products SET has_variants = true WHERE id = v_product_id;
    
    -- Genişlik grubu
    INSERT INTO product_option_groups (product_id, name, name_en, type, is_required, affects_price, sort_order)
    VALUES (v_product_id, 'Genişlik', 'Width', 'select', true, true, 1)
    RETURNING id INTO v_group_width;
    
    -- Genişlik değerleri
    INSERT INTO product_option_values (option_group_id, value, value_en, price_modifier, is_default, sort_order) VALUES
    (v_group_width, '100cm', '100cm', 0, true, 1),
    (v_group_width, '150cm', '150cm', 100, false, 2),
    (v_group_width, '200cm', '200cm', 200, false, 3),
    (v_group_width, '250cm', '250cm', 300, false, 4);
    
    -- Uzunluk grubu
    INSERT INTO product_option_groups (product_id, name, name_en, type, is_required, affects_price, sort_order)
    VALUES (v_product_id, 'Uzunluk', 'Length', 'select', true, true, 2)
    RETURNING id INTO v_group_length;
    
    -- Uzunluk değerleri
    INSERT INTO product_option_values (option_group_id, value, value_en, price_modifier, is_default, sort_order) VALUES
    (v_group_length, '150cm', '150cm', 0, true, 1),
    (v_group_length, '200cm', '200cm', 75, false, 2),
    (v_group_length, '250cm', '250cm', 150, false, 3),
    (v_group_length, '300cm', '300cm', 225, false, 4);
    
    -- Renk grubu
    INSERT INTO product_option_groups (product_id, name, name_en, type, is_required, affects_price, sort_order)
    VALUES (v_product_id, 'Renk', 'Color', 'color_swatch', true, false, 3)
    RETURNING id INTO v_group_color;
    
    -- Renk değerleri
    INSERT INTO product_option_values (option_group_id, value, value_en, hex_color, is_default, sort_order) VALUES
    (v_group_color, 'Beyaz', 'White', '#FFFFFF', true, 1),
    (v_group_color, 'Krem', 'Cream', '#FFFDD0', false, 2),
    (v_group_color, 'Gri', 'Gray', '#808080', false, 3),
    (v_group_color, 'Bej', 'Beige', '#F5F5DC', false, 4);
    
    -- Kumaş kalitesi grubu
    INSERT INTO product_option_groups (product_id, name, name_en, type, is_required, affects_price, sort_order)
    VALUES (v_product_id, 'Kumaş Kalitesi', 'Fabric Quality', 'radio', true, true, 4)
    RETURNING id INTO v_group_quality;
    
    -- Kalite değerleri
    INSERT INTO product_option_values (option_group_id, value, value_en, price_modifier_percent, is_default, sort_order) VALUES
    (v_group_quality, 'Standart', 'Standard', 0, true, 1),
    (v_group_quality, 'Premium', 'Premium', 30, false, 2);
    
    RAISE NOTICE 'Örnek varyantlar oluşturuldu: %', v_product_id;
END $$;
*/
