-- ===========================================
-- GROHN FABRICS - TEKSTİL SATIŞ ŞEMA GÜNCELLEMELERİ
-- ===========================================
-- Bu dosyayı Supabase SQL Editor'da çalıştırın.
-- Metraj bazlı satış desteği için gerekli değişiklikler.
-- ===========================================

-- ===========================================
-- 1. PRODUCTS TABLOSU GÜNCELLEMELERİ
-- ===========================================

-- Birim tipi: Ürün metreyle mi yoksa adetle mi satılacak?
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS unit_type VARCHAR(20) DEFAULT 'adet';

-- COMMENT: unit_type değerleri: 'adet' | 'metre'

-- Minimum sipariş miktarı (örn: en az 0.5 metre)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS min_order_quantity DECIMAL(10,2) DEFAULT 1;

-- Artış miktarı (örn: 0.5 metre artışla satış)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS step_quantity DECIMAL(10,2) DEFAULT 1;

-- Dinamik ürün özellikleri (kumaş için: GSM, içerik; yastık için: fermuar tipi vb.)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}';

-- Kumaş için özel alanlar
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS fabric_content TEXT; -- Örn: "%100 Pamuk", "%60 Keten, %40 Pamuk"

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS care_instructions TEXT; -- Yıkama/bakım talimatları

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS origin_country VARCHAR(100); -- Menşei ülke

-- ===========================================
-- 2. ORDER_ITEMS TABLOSU GÜNCELLEMELERİ
-- ===========================================

-- Quantity'yi float yap (2.5 metre gibi değerler için)
-- Önce mevcut verileri yedekle
ALTER TABLE public.order_items 
ALTER COLUMN quantity TYPE DECIMAL(10,2);

-- Birim tipi snapshot (sipariş anındaki birim)
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS unit_type VARCHAR(20) DEFAULT 'adet';

-- ===========================================
-- 3. CART İÇİN YARDIMCI FONKSİYON
-- ===========================================

-- Ürün fiyatı hesaplama fonksiyonu
CREATE OR REPLACE FUNCTION public.calculate_product_price(
    p_product_id UUID,
    p_quantity DECIMAL,
    p_currency VARCHAR DEFAULT 'TRY'
)
RETURNS TABLE (
    unit_price DECIMAL,
    total_price DECIMAL,
    currency VARCHAR,
    unit_type VARCHAR,
    is_valid BOOLEAN,
    error_message TEXT
) AS $$
DECLARE
    v_product RECORD;
    v_unit_price DECIMAL;
    v_total DECIMAL;
BEGIN
    -- Ürünü getir
    SELECT * INTO v_product 
    FROM public.products 
    WHERE id = p_product_id AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            NULL::DECIMAL, NULL::DECIMAL, NULL::VARCHAR, NULL::VARCHAR, 
            false, 'Ürün bulunamadı veya aktif değil'::TEXT;
        RETURN;
    END IF;
    
    -- Minimum miktar kontrolü
    IF p_quantity < v_product.min_order_quantity THEN
        RETURN QUERY SELECT 
            NULL::DECIMAL, NULL::DECIMAL, NULL::VARCHAR, NULL::VARCHAR, 
            false, ('Minimum sipariş miktarı: ' || v_product.min_order_quantity || ' ' || v_product.unit_type)::TEXT;
        RETURN;
    END IF;
    
    -- Artış miktarı kontrolü (step)
    IF v_product.step_quantity > 0 THEN
        -- Miktar, step'in katı olmalı
        IF MOD(p_quantity, v_product.step_quantity) != 0 THEN
            RETURN QUERY SELECT 
                NULL::DECIMAL, NULL::DECIMAL, NULL::VARCHAR, NULL::VARCHAR,
                false, ('Miktar ' || v_product.step_quantity || ' ' || v_product.unit_type || ' artışlarla olmalıdır')::TEXT;
            RETURN;
        END IF;
    END IF;
    
    -- Fiyatı belirle (currency'ye göre)
    IF p_currency = 'EUR' AND v_product.price_eur IS NOT NULL THEN
        v_unit_price := COALESCE(v_product.sale_price_eur, v_product.price_eur);
    ELSE
        v_unit_price := COALESCE(v_product.sale_price, v_product.price);
    END IF;
    
    -- Toplam hesapla
    v_total := v_unit_price * p_quantity;
    
    RETURN QUERY SELECT 
        v_unit_price, 
        v_total, 
        p_currency, 
        v_product.unit_type,
        true, 
        NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- 4. NUMUNE TALEP TABLOSU
-- ===========================================

-- Numune (sample) talepleri için ayrı tablo
-- (veya inquiries tablosuna type ekleyebiliriz)
CREATE TABLE IF NOT EXISTS public.sample_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    customer_address TEXT,
    customer_city TEXT,
    customer_district TEXT,
    customer_zip TEXT,
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, shipped, delivered, rejected
    tracking_number TEXT,
    notes TEXT, -- Admin notları
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for sample_requests
ALTER TABLE public.sample_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (prevents duplicate errors)
DROP POLICY IF EXISTS "sample_requests_insert_public" ON public.sample_requests;
DROP POLICY IF EXISTS "sample_requests_admin" ON public.sample_requests;

-- Herkes numune talep edebilir
CREATE POLICY "sample_requests_insert_public"
ON public.sample_requests
FOR INSERT
WITH CHECK (true);

-- Sadece admin okuyup yönetebilir
CREATE POLICY "sample_requests_admin"
ON public.sample_requests
FOR ALL
USING (public.is_admin() = true);

-- ===========================================
-- 5. MEVCUT VERİLERİ GÜNCELLE
-- ===========================================

-- Mevcut tüm ürünleri 'adet' olarak işaretle (varsayılan)
UPDATE public.products 
SET unit_type = 'adet' 
WHERE unit_type IS NULL;

-- Kumaş ürünlerini 'metre' olarak işaretle (fabric_type'a göre)
UPDATE public.products 
SET 
    unit_type = 'metre',
    min_order_quantity = 0.5,
    step_quantity = 0.5
WHERE fabric_type IS NOT NULL 
  AND fabric_type != ''
  AND unit_type = 'adet';

-- ===========================================
-- 6. İNDEKSLER
-- ===========================================

-- Performans için index
CREATE INDEX IF NOT EXISTS idx_products_unit_type ON public.products(unit_type);
CREATE INDEX IF NOT EXISTS idx_sample_requests_status ON public.sample_requests(status);

-- ===========================================
-- TAMAMLANDI!
-- ===========================================
-- Artık:
-- 1. Ürünler 'metre' veya 'adet' olarak satılabilir
-- 2. Sipariş miktarları ondalıklı olabilir (2.5 metre)
-- 3. Minimum ve step miktarları tanımlanabilir
-- 4. Numune talep sistemi hazır
-- ===========================================
