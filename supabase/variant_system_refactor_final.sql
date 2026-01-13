-- =====================================================
-- VARIANT SYSTEM REFACTOR - FINAL MIGRATION
-- =====================================================

-- 1. order_items tablosuna variant_id ekle
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id);

-- 2. Stok azaltma fonksiyonunu güncelle (product_variants tablosunu kullanması için)
CREATE OR REPLACE FUNCTION public.decrement_variant_stock(
    p_variant_id UUID,
    p_quantity DECIMAL
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.product_variants 
    SET stock = GREATEST(0, COALESCE(stock, 0) - p_quantity)
    WHERE id = p_variant_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Opsiyonel: Eski 'variants' tablosunu product_variants'a bağlamak için bir trigger veya manuel migration gerekebilir.
-- Ancak şimdilik yeni sistemin çalışması için yukarıdakiler yeterlidir.
