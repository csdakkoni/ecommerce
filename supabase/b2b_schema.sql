-- ===========================================
-- GROHN FABRICS - B2B PORTAL
-- ===========================================
-- Wholesale/business customer portal system
-- ===========================================

-- ===========================================
-- 1. B2B MÜŞTERİ TABLOSU
-- ===========================================

CREATE TABLE IF NOT EXISTS public.b2b_customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Company Info
    company_name VARCHAR(255) NOT NULL,
    tax_number VARCHAR(50), -- Vergi numarası
    tax_office VARCHAR(100), -- Vergi dairesi
    
    -- Contact
    contact_name VARCHAR(100) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    
    -- Address
    address TEXT,
    city VARCHAR(100),
    district VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Türkiye',
    
    -- Business Details
    business_type VARCHAR(50), -- manufacturer, retailer, wholesaler, designer
    annual_revenue VARCHAR(50), -- Range: <100K, 100K-500K, 500K-1M, 1M+
    employee_count VARCHAR(50), -- 1-10, 11-50, 51-200, 200+
    website VARCHAR(255),
    
    -- Approval & Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, suspended
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Pricing
    discount_percentage DECIMAL(5,2) DEFAULT 0, -- Default B2B discount
    price_tier VARCHAR(20) DEFAULT 'standard', -- standard, silver, gold, platinum
    credit_limit DECIMAL(12,2) DEFAULT 0,
    payment_terms INTEGER DEFAULT 0, -- Days for payment (0 = immediate, 30, 60, 90)
    
    -- Documents
    documents JSONB DEFAULT '[]', -- Tax certificate, trade registry, etc.
    
    -- Notes
    internal_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- 2. B2B FİYAT TIER'LARI
-- ===========================================

CREATE TABLE IF NOT EXISTS public.b2b_price_tiers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tier_name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    discount_percentage DECIMAL(5,2) NOT NULL,
    min_order_amount DECIMAL(12,2) DEFAULT 0,
    benefits TEXT[],
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Default tiers
INSERT INTO public.b2b_price_tiers (tier_name, display_name, discount_percentage, min_order_amount, benefits, sort_order) VALUES
    ('standard', 'Standart', 5, 0, ARRAY['%5 indirim', 'Fatura kesimi'], 1),
    ('silver', 'Gümüş', 10, 5000, ARRAY['%10 indirim', 'Öncelikli kargo', '30 gün vade'], 2),
    ('gold', 'Altın', 15, 15000, ARRAY['%15 indirim', 'Ücretsiz kargo', '60 gün vade', 'Özel müşteri temsilcisi'], 3),
    ('platinum', 'Platin', 20, 50000, ARRAY['%20 indirim', 'Express kargo', '90 gün vade', 'Özel müşteri temsilcisi', 'Numune gönderimi'], 4)
ON CONFLICT (tier_name) DO NOTHING;

-- ===========================================
-- 3. B2B SİPARİŞLER
-- ===========================================

CREATE TABLE IF NOT EXISTS public.b2b_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    b2b_customer_id UUID NOT NULL REFERENCES public.b2b_customers(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL, -- Link to main orders
    
    -- Order specific B2B data
    purchase_order_number VARCHAR(100), -- Müşterinin kendi sipariş numarası
    discount_applied DECIMAL(5,2),
    payment_terms_days INTEGER,
    payment_due_date DATE,
    
    -- Proforma
    proforma_sent BOOLEAN DEFAULT false,
    proforma_sent_at TIMESTAMPTZ,
    proforma_url TEXT,
    
    -- Invoice
    invoice_number VARCHAR(50),
    invoice_date DATE,
    invoice_url TEXT,
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- 4. B2B QUOTE REQUESTS (TEKLİF TALEPLERİ)
-- ===========================================

CREATE TABLE IF NOT EXISTS public.b2b_quote_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    b2b_customer_id UUID REFERENCES public.b2b_customers(id) ON DELETE CASCADE,
    
    -- If not registered B2B customer
    company_name VARCHAR(255),
    contact_name VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    
    -- Request details
    items JSONB NOT NULL, -- Array of {product_id, quantity, notes}
    total_quantity DECIMAL(12,2),
    delivery_date DATE,
    delivery_address TEXT,
    special_requirements TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, quoted, accepted, rejected, expired
    
    -- Quote response
    quote_amount DECIMAL(12,2),
    quote_currency VARCHAR(10) DEFAULT 'TRY',
    quote_valid_until DATE,
    quote_notes TEXT,
    quoted_by UUID REFERENCES auth.users(id),
    quoted_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- 5. RLS POLICIES
-- ===========================================

ALTER TABLE public.b2b_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_price_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_quote_requests ENABLE ROW LEVEL SECURITY;

-- B2B Customers - own + admin
DROP POLICY IF EXISTS "b2b_customers_own" ON public.b2b_customers;
CREATE POLICY "b2b_customers_own"
ON public.b2b_customers FOR SELECT
USING (user_id = auth.uid() OR public.is_admin() = true);

DROP POLICY IF EXISTS "b2b_customers_insert" ON public.b2b_customers;
CREATE POLICY "b2b_customers_insert"
ON public.b2b_customers FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "b2b_customers_admin" ON public.b2b_customers;
CREATE POLICY "b2b_customers_admin"
ON public.b2b_customers FOR ALL
USING (public.is_admin() = true);

-- Price tiers - public read
DROP POLICY IF EXISTS "b2b_tiers_read" ON public.b2b_price_tiers;
CREATE POLICY "b2b_tiers_read"
ON public.b2b_price_tiers FOR SELECT
USING (true);

-- B2B Orders - own + admin
DROP POLICY IF EXISTS "b2b_orders_policy" ON public.b2b_orders;
CREATE POLICY "b2b_orders_policy"
ON public.b2b_orders FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.b2b_customers WHERE id = b2b_customer_id AND user_id = auth.uid())
    OR public.is_admin() = true
);

-- Quote requests
DROP POLICY IF EXISTS "b2b_quotes_own" ON public.b2b_quote_requests;
CREATE POLICY "b2b_quotes_own"
ON public.b2b_quote_requests FOR SELECT
USING (
    contact_email = current_setting('request.jwt.claims', true)::json->>'email'
    OR EXISTS (SELECT 1 FROM public.b2b_customers WHERE id = b2b_customer_id AND user_id = auth.uid())
    OR public.is_admin() = true
);

DROP POLICY IF EXISTS "b2b_quotes_insert" ON public.b2b_quote_requests;
CREATE POLICY "b2b_quotes_insert"
ON public.b2b_quote_requests FOR INSERT
WITH CHECK (true);

-- ===========================================
-- 6. INDEXES
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_b2b_customers_status ON public.b2b_customers(status);
CREATE INDEX IF NOT EXISTS idx_b2b_customers_user ON public.b2b_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_b2b_orders_customer ON public.b2b_orders(b2b_customer_id);
CREATE INDEX IF NOT EXISTS idx_b2b_quotes_status ON public.b2b_quote_requests(status);

-- ===========================================
-- 7. B2B FİYAT HESAPLAMA FONKSİYONU
-- ===========================================

CREATE OR REPLACE FUNCTION public.get_b2b_price(
    p_product_id UUID,
    p_b2b_customer_id UUID,
    p_quantity DECIMAL DEFAULT 1
)
RETURNS TABLE (
    original_price DECIMAL,
    b2b_price DECIMAL,
    discount_percentage DECIMAL,
    tier_name VARCHAR
) AS $$
DECLARE
    v_product RECORD;
    v_customer RECORD;
    v_tier RECORD;
    v_discount DECIMAL;
BEGIN
    -- Get product
    SELECT price, sale_price INTO v_product FROM public.products WHERE id = p_product_id;
    
    -- Get customer tier
    SELECT bc.discount_percentage, bc.price_tier INTO v_customer 
    FROM public.b2b_customers bc 
    WHERE bc.id = p_b2b_customer_id AND bc.status = 'approved';
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT v_product.price, v_product.price, 0::DECIMAL, 'none'::VARCHAR;
        RETURN;
    END IF;
    
    -- Get tier info
    SELECT * INTO v_tier FROM public.b2b_price_tiers WHERE tier_name = v_customer.price_tier;
    
    v_discount := COALESCE(v_customer.discount_percentage, v_tier.discount_percentage, 0);
    
    RETURN QUERY SELECT 
        v_product.price,
        v_product.price * (1 - v_discount / 100),
        v_discount,
        v_customer.price_tier;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- TAMAMLANDI!
-- ===========================================
