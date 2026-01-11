
-- Insert Categories
INSERT INTO public.categories (name, slug, description)
VALUES 
('Premium İpek', 'premium-ipek', 'Saf ipek kumaşlar.'),
('Doğal Keten', 'dogal-keten', 'Yazlık nefes alan ketenler.');

-- Insert Products
INSERT INTO public.products (name, slug, description, price, fabric_type, width_cm, weight_gsm, category_id, is_active)
VALUES 
('Saf İpek Şifon - Bordo', 'saf-ipek-sifon-bordo', '%100 Saf İpek, dökümlü.', 1250.00, 'İpek', 140, 45, (SELECT id FROM categories WHERE slug='premium-ipek' LIMIT 1), true),
('Organik Ham Keten', 'organik-ham-keten', 'Doğal dokulu keten.', 450.00, 'Keten', 150, 220, (SELECT id FROM categories WHERE slug='dogal-keten' LIMIT 1), true),
('İtalyan Kadife - Zümrüt', 'italyan-kadife-zumrut', 'Döşemelik kadife.', 850.00, 'Kadife', 140, 300, (SELECT id FROM categories WHERE slug='premium-ipek' LIMIT 1), true);
