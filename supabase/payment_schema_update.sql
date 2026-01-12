-- ===========================================
-- GROHN FABRICS - ÖDEME SİSTEMİ DB GÜNCELLEMELERİ
-- ===========================================
-- iyzico entegrasyonu için gerekli alanlar
-- ===========================================

-- ===========================================
-- 1. ORDERS TABLOSU - YENİ ALANLAR
-- ===========================================

-- Ödeme yöntemi
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'iyzico';

-- iyzico conversation ID (işlem takibi için)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS conversation_id VARCHAR(100);

-- iyzico payment token (3D secure için)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_token TEXT;

-- iyzico payment page URL
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_page_url TEXT;

-- iyzico payment ID (başarılı ödeme sonrası)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_id VARCHAR(100);

-- Ödeme detayları (kart bilgileri, taksit vb. - JSON)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_details JSONB;

-- Ödeme hatası mesajı
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_error TEXT;

-- Para birimi
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'TRY';

-- İndirim tutarı
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0;

-- Fatura adresi (JSON)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS billing_address JSONB;

-- ===========================================
-- 2. STOCK HELPER FUNCTIONS
-- ===========================================

-- Ürün stok azaltma fonksiyonu
CREATE OR REPLACE FUNCTION public.decrement_product_stock(
    p_product_id UUID,
    p_quantity DECIMAL
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.products 
    SET stock = GREATEST(0, COALESCE(stock, 0) - p_quantity)
    WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- Varyant stok azaltma fonksiyonu
CREATE OR REPLACE FUNCTION public.decrement_variant_stock(
    p_variant_id UUID,
    p_quantity DECIMAL
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.variants 
    SET stock = GREATEST(0, COALESCE(stock, 0) - p_quantity)
    WHERE id = p_variant_id;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- 3. SİPARİŞ DURUMU GÜNCELLEMELERİ
-- ===========================================

-- Sipariş durumu enum benzeri kontrol (constraint olarak)
-- Durumlar: pending_payment, paid, processing, shipped, delivered, cancelled, refunded, payment_failed

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_token ON public.orders(payment_token);
CREATE INDEX IF NOT EXISTS idx_orders_conversation_id ON public.orders(conversation_id);

-- ===========================================
-- TAMAMLANDI!
-- ===========================================
