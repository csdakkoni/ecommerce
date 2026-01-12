-- ===========================================
-- GROHN FABRICS - MÜŞTERİ DENEYİMİ DB GÜNCELLEMELERİ
-- ===========================================
-- Ürün değerlendirme sistemi, abandoned cart ve analytics
-- ===========================================

-- ===========================================
-- 1. ÜRÜN DEĞERLENDİRME SİSTEMİ
-- ===========================================

CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    
    -- Review content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    review_text TEXT,
    
    -- Reviewer info (for guests or display)
    reviewer_name VARCHAR(100),
    reviewer_email VARCHAR(255),
    
    -- Verification
    is_verified_purchase BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false, -- Admin approval
    is_featured BOOLEAN DEFAULT false,
    
    -- Helpful votes
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    
    -- Media
    images TEXT[], -- Array of image URLs
    
    -- Admin response
    admin_response TEXT,
    admin_responded_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Review helpful votes tracking
CREATE TABLE IF NOT EXISTS public.review_votes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    review_id UUID NOT NULL REFERENCES public.product_reviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_ip VARCHAR(45), -- For guest voting
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Prevent duplicate votes
    UNIQUE(review_id, user_id),
    UNIQUE(review_id, user_ip)
);

-- RLS for reviews
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "reviews_select_approved" ON public.product_reviews;
DROP POLICY IF EXISTS "reviews_insert_authenticated" ON public.product_reviews;
DROP POLICY IF EXISTS "reviews_admin" ON public.product_reviews;

-- Anyone can read approved reviews
CREATE POLICY "reviews_select_approved"
ON public.product_reviews
FOR SELECT
USING (is_approved = true OR public.is_admin() = true);

-- Authenticated users can create reviews
CREATE POLICY "reviews_insert_authenticated"
ON public.product_reviews
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL OR reviewer_email IS NOT NULL);

-- Users can update their own reviews
CREATE POLICY "reviews_update_own"
ON public.product_reviews
FOR UPDATE
USING (user_id = auth.uid() OR public.is_admin() = true);

-- Admin full access
CREATE POLICY "reviews_admin"
ON public.product_reviews
FOR ALL
USING (public.is_admin() = true);

-- Vote policies
DROP POLICY IF EXISTS "votes_select" ON public.review_votes;
DROP POLICY IF EXISTS "votes_insert" ON public.review_votes;

CREATE POLICY "votes_select"
ON public.review_votes
FOR SELECT
USING (true);

CREATE POLICY "votes_insert"
ON public.review_votes
FOR INSERT
WITH CHECK (true);

-- ===========================================
-- 2. ÜRÜN ORTALAMA RATING HESAPLAMA
-- ===========================================

-- Add rating columns to products (for fast querying)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(3,2) DEFAULT 0;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Function to update product rating
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.products
    SET 
        avg_rating = (
            SELECT COALESCE(AVG(rating), 0)
            FROM public.product_reviews
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
            AND is_approved = true
        ),
        review_count = (
            SELECT COUNT(*)
            FROM public.product_reviews
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
            AND is_approved = true
        )
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for rating updates
DROP TRIGGER IF EXISTS trigger_update_product_rating ON public.product_reviews;
CREATE TRIGGER trigger_update_product_rating
AFTER INSERT OR UPDATE OR DELETE ON public.product_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_product_rating();

-- ===========================================
-- 3. ABANDONED CART TRACKING
-- ===========================================

CREATE TABLE IF NOT EXISTS public.abandoned_carts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email VARCHAR(255),
    cart_data JSONB NOT NULL, -- Cart items snapshot
    cart_total DECIMAL(12,2),
    currency VARCHAR(10) DEFAULT 'TRY',
    
    -- Tracking
    last_activity_at TIMESTAMPTZ DEFAULT now(),
    recovery_email_sent BOOLEAN DEFAULT false,
    recovery_email_sent_at TIMESTAMPTZ,
    
    -- Recovery
    recovery_token VARCHAR(100) UNIQUE,
    recovered BOOLEAN DEFAULT false,
    recovered_order_id UUID REFERENCES public.orders(id),
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "abandoned_carts_own" ON public.abandoned_carts;
DROP POLICY IF EXISTS "abandoned_carts_admin" ON public.abandoned_carts;

CREATE POLICY "abandoned_carts_own"
ON public.abandoned_carts
FOR ALL
USING (user_id = auth.uid() OR email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "abandoned_carts_admin"
ON public.abandoned_carts
FOR ALL
USING (public.is_admin() = true);

-- ===========================================
-- 4. İNDEKSLER
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON public.product_reviews(is_approved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_email ON public.abandoned_carts(email);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_recovery ON public.abandoned_carts(recovery_email_sent, last_activity_at);

-- ===========================================
-- TAMAMLANDI!
-- ===========================================
