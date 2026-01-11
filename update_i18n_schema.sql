-- Add internationalization columns to Products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS name_en TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS name_de TEXT, -- Alman pazarı için hazırlık (opsiyonel doldurulabilir)
ADD COLUMN IF NOT EXISTS description_de TEXT,
ADD COLUMN IF NOT EXISTS price_usd DECIMAL(10, 2), -- Dolar fiyatı
ADD COLUMN IF NOT EXISTS sale_price_usd DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS price_eur DECIMAL(10, 2), -- Euro fiyatı
ADD COLUMN IF NOT EXISTS sale_price_eur DECIMAL(10, 2);

-- Add internationalization columns to Categories
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS name_en TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS name_de TEXT,
ADD COLUMN IF NOT EXISTS description_de TEXT;
