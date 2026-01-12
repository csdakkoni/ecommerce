-- CMS Page Management Schema
-- Run this in Supabase SQL Editor

-- Create site_pages table
CREATE TABLE IF NOT EXISTS site_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    title_en VARCHAR(255),
    content TEXT,
    content_en TEXT,
    meta_title VARCHAR(255),
    meta_title_en VARCHAR(255),
    meta_description TEXT,
    meta_description_en TEXT,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default pages
INSERT INTO site_pages (slug, title, title_en, content, content_en) VALUES
('about', 'Hakkımızda', 'About Us', 
'<h2>Hikayemiz</h2>
<p>2015 yılında İstanbul''da kurulan Grohn Fabrics, kumaş tutkunları tarafından, kumaş tutkunları için kurulmuş bir markadır.</p>
<p>Yılların tecrübesiyle, dünyanın dört bir yanından en kaliteli kumaşları Türkiye''ye getiriyor ve sizlere sunuyoruz.</p>',
'<h2>Our Story</h2>
<p>Founded in Istanbul in 2015, Grohn Fabrics is a brand created by fabric enthusiasts, for fabric enthusiasts.</p>
<p>With years of experience, we bring the highest quality fabrics from around the world to Turkey and present them to you.</p>'),

('contact', 'İletişim', 'Contact', 
'<h2>Bize Ulaşın</h2>
<p><strong>Adres:</strong> İstanbul, Türkiye</p>
<p><strong>E-posta:</strong> info@grohnfabrics.com</p>
<p><strong>Telefon:</strong> +90 212 XXX XX XX</p>',
'<h2>Get in Touch</h2>
<p><strong>Address:</strong> Istanbul, Turkey</p>
<p><strong>Email:</strong> info@grohnfabrics.com</p>
<p><strong>Phone:</strong> +90 212 XXX XX XX</p>'),

('faq', 'Sık Sorulan Sorular', 'FAQ', 
'<h2>Sık Sorulan Sorular</h2>
<p><strong>Kargo ne kadar sürer?</strong><br/>Türkiye içi 2-4 iş günü içinde teslimat yapılır.</p>
<p><strong>İade yapabilir miyim?</strong><br/>Evet, 14 gün içinde iade kabul edilir.</p>',
'<h2>Frequently Asked Questions</h2>
<p><strong>How long does shipping take?</strong><br/>Delivery within Turkey takes 2-4 business days.</p>
<p><strong>Can I return items?</strong><br/>Yes, returns are accepted within 14 days.</p>'),

('shipping', 'Kargo ve Teslimat', 'Shipping & Delivery', 
'<h2>Kargo Bilgileri</h2>
<p>500 TL üzeri siparişlerde kargo ücretsizdir.</p>
<p>Siparişler 1-2 iş günü içinde hazırlanır ve kargoya verilir.</p>',
'<h2>Shipping Information</h2>
<p>Free shipping for orders over €50.</p>
<p>Orders are prepared and shipped within 1-2 business days.</p>'),

('privacy', 'Gizlilik Politikası', 'Privacy Policy', 
'<h2>Gizlilik Politikası</h2>
<p>Kişisel verileriniz KVKK kapsamında korunmaktadır.</p>',
'<h2>Privacy Policy</h2>
<p>Your personal data is protected under GDPR regulations.</p>'),

('returns', 'İade ve Değişim', 'Returns & Exchanges', 
'<h2>İade ve Değişim Koşulları</h2>
<p>14 gün içinde, kullanılmamış ve orijinal ambalajında ürünleri iade edebilirsiniz.</p>',
'<h2>Returns & Exchanges Policy</h2>
<p>You can return unused items in their original packaging within 14 days.</p>')

ON CONFLICT (slug) DO NOTHING;

-- Enable RLS
ALTER TABLE site_pages ENABLE ROW LEVEL SECURITY;

-- Allow public read access for published pages
CREATE POLICY "Public can view published pages" ON site_pages
    FOR SELECT USING (is_published = true);

-- Allow authenticated users to manage pages (for admin)
CREATE POLICY "Authenticated users can manage pages" ON site_pages
    FOR ALL USING (auth.role() = 'authenticated');
