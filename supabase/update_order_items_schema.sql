-- =====================================================
-- ORDER ITEMS UPDATE FOR VARIANTS
-- Sipariş kalemlerinde varyant detaylarını saklamak için güncelleme
-- =====================================================

-- 1. order_items tablosuna yeni sütunlar ekle
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS selected_options JSONB, -- Seçilen opsiyonların detayı (örn: {"width": "200cm", "color": "Blue"})
ADD COLUMN IF NOT EXISTS variant_name TEXT;      -- Okunabilir varyant özeti (örn: "200cm, Blue, Premium")

-- Mevcut kayıtlar için variant_name null kalabilir veya varsayılan bir değer atanabilir.
