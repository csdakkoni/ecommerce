-- ===========================================
-- GROHN FABRICS - BLOG SİSTEMİ
-- ===========================================
-- SEO-optimized blog system with categories, tags, and comments
-- ===========================================

-- ===========================================
-- 1. BLOG POSTS
-- ===========================================

CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- URL & SEO
    slug VARCHAR(255) NOT NULL UNIQUE,
    
    -- Content (Turkish)
    title VARCHAR(255) NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    
    -- Content (English)
    title_en VARCHAR(255),
    excerpt_en TEXT,
    content_en TEXT,
    
    -- Media
    featured_image TEXT,
    images TEXT[],
    
    -- Metadata
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name VARCHAR(100),
    
    -- Categorization
    category VARCHAR(100),
    tags TEXT[],
    
    -- SEO
    meta_title VARCHAR(70),
    meta_description VARCHAR(160),
    meta_title_en VARCHAR(70),
    meta_description_en VARCHAR(160),
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- draft, published, scheduled, archived
    published_at TIMESTAMPTZ,
    scheduled_for TIMESTAMPTZ,
    
    -- Stats
    view_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- 2. BLOG CATEGORIES
-- ===========================================

CREATE TABLE IF NOT EXISTS public.blog_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    slug VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    description TEXT,
    description_en TEXT,
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Default categories
INSERT INTO public.blog_categories (slug, name, name_en, icon, sort_order) VALUES
    ('tekstil-rehberi', 'Tekstil Rehberi', 'Textile Guide', '📚', 1),
    ('kumas-bakim', 'Kumaş Bakımı', 'Fabric Care', '🧵', 2),
    ('dekorasyon', 'Dekorasyon', 'Decoration', '🏠', 3),
    ('moda', 'Moda', 'Fashion', '👗', 4),
    ('haberler', 'Haberler', 'News', '📰', 5)
ON CONFLICT (slug) DO NOTHING;

-- ===========================================
-- 3. BLOG COMMENTS
-- ===========================================

CREATE TABLE IF NOT EXISTS public.blog_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.blog_comments(id) ON DELETE CASCADE, -- For replies
    
    -- Author
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name VARCHAR(100) NOT NULL,
    author_email VARCHAR(255),
    
    -- Content
    content TEXT NOT NULL,
    
    -- Moderation
    is_approved BOOLEAN DEFAULT false,
    is_spam BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- 4. RLS POLICIES
-- ===========================================

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

-- Blog posts - public can read published
DROP POLICY IF EXISTS "blog_posts_read_published" ON public.blog_posts;
CREATE POLICY "blog_posts_read_published"
ON public.blog_posts FOR SELECT
USING (status = 'published' OR public.is_admin() = true);

-- Blog posts - admin can manage
DROP POLICY IF EXISTS "blog_posts_admin" ON public.blog_posts;
CREATE POLICY "blog_posts_admin"
ON public.blog_posts FOR ALL
USING (public.is_admin() = true);

-- Categories - public read
DROP POLICY IF EXISTS "blog_categories_read" ON public.blog_categories;
CREATE POLICY "blog_categories_read"
ON public.blog_categories FOR SELECT
USING (true);

-- Comments - public read approved
DROP POLICY IF EXISTS "blog_comments_read" ON public.blog_comments;
CREATE POLICY "blog_comments_read"
ON public.blog_comments FOR SELECT
USING (is_approved = true OR public.is_admin() = true);

-- Comments - anyone can submit
DROP POLICY IF EXISTS "blog_comments_insert" ON public.blog_comments;
CREATE POLICY "blog_comments_insert"
ON public.blog_comments FOR INSERT
WITH CHECK (true);

-- Comments - admin manage
DROP POLICY IF EXISTS "blog_comments_admin" ON public.blog_comments;
CREATE POLICY "blog_comments_admin"
ON public.blog_comments FOR ALL
USING (public.is_admin() = true);

-- ===========================================
-- 5. INDEXES
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON public.blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON public.blog_comments(post_id);

-- ===========================================
-- 6. VIEW COUNT FUNCTION
-- ===========================================

CREATE OR REPLACE FUNCTION public.increment_blog_view(post_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.blog_posts 
    SET view_count = view_count + 1 
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- TAMAMLANDI!
-- ===========================================
