-- ===========================================
-- GROHN FABRICS ERP EXTENSION SCHEMA
-- ===========================================

-- Kuponlar / Coupons
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  per_user_limit INTEGER DEFAULT 1,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  applies_to TEXT DEFAULT 'all', -- 'all', 'category', 'product'
  applicable_ids UUID[], -- category or product IDs
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stok Hareketleri / Stock Movements
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  variant_id UUID REFERENCES public.variants(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment')),
  quantity INTEGER NOT NULL,
  balance_after INTEGER, -- Stock balance after this movement
  reason TEXT, -- 'sale', 'return', 'manual', 'supplier', 'initial'
  reference_id UUID, -- order_id or supplier_order_id
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- Gider Kategorileri / Expense Categories
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  icon TEXT DEFAULT 'folder',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default expense categories
INSERT INTO public.expense_categories (name, color, icon) VALUES
  ('Kargo & Lojistik', '#3B82F6', 'truck'),
  ('Reklam & Pazarlama', '#8B5CF6', 'megaphone'),
  ('Personel', '#10B981', 'users'),
  ('Kira & Faturalar', '#F59E0B', 'building'),
  ('Hammadde', '#EF4444', 'package'),
  ('Diğer', '#6B7280', 'more-horizontal')
ON CONFLICT DO NOTHING;

-- Giderler / Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  expense_date DATE NOT NULL,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- Tedarikçiler / Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  tax_number TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tedarikçi Siparişleri (Alışlar) / Supplier Orders
CREATE TABLE IF NOT EXISTS public.supplier_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'received', 'cancelled')),
  order_date DATE NOT NULL,
  expected_date DATE,
  received_date DATE,
  invoice_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tedarikçi Sipariş Kalemleri
CREATE TABLE IF NOT EXISTS public.supplier_order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  supplier_order_id UUID REFERENCES public.supplier_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  variant_id UUID REFERENCES public.variants(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site Ayarları / Settings
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default settings
INSERT INTO public.settings (key, value) VALUES
  ('general', '{"site_name": "Grohn Fabrics", "tagline": "Doğanın Dokusu", "email": "info@grohnfabrics.com", "phone": "+90 212 555 0000"}'),
  ('shipping', '{"free_shipping_threshold": 500, "default_shipping_cost": 29.90, "express_shipping_cost": 59.90}'),
  ('social', '{"instagram": "", "facebook": "", "twitter": "", "whatsapp": ""}'),
  ('notifications', '{"email_new_order": true, "email_low_stock": true, "low_stock_threshold": 5}')
ON CONFLICT (key) DO NOTHING;

-- Bildirimler / Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('new_order', 'low_stock', 'new_inquiry', 'system')),
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kupon Kullanımları / Coupon Uses (for tracking per-user usage)
CREATE TABLE IF NOT EXISTS public.coupon_uses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  user_id UUID,
  user_email TEXT,
  discount_applied DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add stock fields to variants if not exists
ALTER TABLE public.variants ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5;

-- Add coupon field to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.coupons(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;

-- ===========================================
-- ROW LEVEL SECURITY POLICIES
-- ===========================================

-- Enable RLS on new tables
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_uses ENABLE ROW LEVEL SECURITY;

-- Public read for coupons (needed for checkout validation)
CREATE POLICY "Public read active coupons" ON public.coupons FOR SELECT USING (is_active = true);

-- Public read for expense categories
CREATE POLICY "Public read expense categories" ON public.expense_categories FOR SELECT USING (true);

-- Public read for settings
CREATE POLICY "Public read settings" ON public.settings FOR SELECT USING (true);

-- ===========================================
-- HELPER FUNCTIONS
-- ===========================================

-- Function to validate and apply coupon
CREATE OR REPLACE FUNCTION public.validate_coupon(
  p_code TEXT,
  p_order_total DECIMAL,
  p_user_email TEXT DEFAULT NULL
)
RETURNS TABLE (
  is_valid BOOLEAN,
  coupon_id UUID,
  discount_type TEXT,
  discount_value DECIMAL,
  discount_amount DECIMAL,
  error_message TEXT
) AS $$
DECLARE
  v_coupon RECORD;
  v_user_uses INTEGER;
  v_discount DECIMAL;
BEGIN
  -- Find coupon
  SELECT * INTO v_coupon FROM public.coupons 
  WHERE code = UPPER(p_code) AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::DECIMAL, NULL::DECIMAL, 'Kupon kodu geçersiz'::TEXT;
    RETURN;
  END IF;
  
  -- Check date validity
  IF v_coupon.valid_from > NOW() THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::DECIMAL, NULL::DECIMAL, 'Kupon henüz aktif değil'::TEXT;
    RETURN;
  END IF;
  
  IF v_coupon.valid_until IS NOT NULL AND v_coupon.valid_until < NOW() THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::DECIMAL, NULL::DECIMAL, 'Kupon süresi dolmuş'::TEXT;
    RETURN;
  END IF;
  
  -- Check max uses
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.uses_count >= v_coupon.max_uses THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::DECIMAL, NULL::DECIMAL, 'Kupon kullanım limiti dolmuş'::TEXT;
    RETURN;
  END IF;
  
  -- Check min order amount
  IF p_order_total < v_coupon.min_order_amount THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::DECIMAL, NULL::DECIMAL, 
      ('Minimum sipariş tutarı: ' || v_coupon.min_order_amount || ' ₺')::TEXT;
    RETURN;
  END IF;
  
  -- Check per-user limit
  IF p_user_email IS NOT NULL AND v_coupon.per_user_limit IS NOT NULL THEN
    SELECT COUNT(*) INTO v_user_uses FROM public.coupon_uses 
    WHERE coupon_id = v_coupon.id AND user_email = p_user_email;
    
    IF v_user_uses >= v_coupon.per_user_limit THEN
      RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::DECIMAL, NULL::DECIMAL, 'Bu kuponu daha önce kullandınız'::TEXT;
      RETURN;
    END IF;
  END IF;
  
  -- Calculate discount
  IF v_coupon.discount_type = 'percentage' THEN
    v_discount := ROUND(p_order_total * v_coupon.discount_value / 100, 2);
  ELSE
    v_discount := LEAST(v_coupon.discount_value, p_order_total);
  END IF;
  
  RETURN QUERY SELECT true, v_coupon.id, v_coupon.discount_type, v_coupon.discount_value, v_discount, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to get low stock products
CREATE OR REPLACE FUNCTION public.get_low_stock_products(p_threshold INTEGER DEFAULT 5)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  variant_id UUID,
  variant_name TEXT,
  stock_quantity INTEGER,
  threshold INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS product_id,
    p.name AS product_name,
    v.id AS variant_id,
    v.name AS variant_name,
    v.stock_quantity,
    COALESCE(v.low_stock_threshold, p_threshold) AS threshold
  FROM public.variants v
  JOIN public.products p ON p.id = v.product_id
  WHERE v.stock_quantity <= COALESCE(v.low_stock_threshold, p_threshold)
    AND p.is_active = true
  ORDER BY v.stock_quantity ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get sales summary
CREATE OR REPLACE FUNCTION public.get_sales_summary(p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  sale_date DATE,
  order_count BIGINT,
  total_revenue DECIMAL,
  avg_order_value DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(created_at) AS sale_date,
    COUNT(*) AS order_count,
    SUM(total_amount) AS total_revenue,
    ROUND(AVG(total_amount), 2) AS avg_order_value
  FROM public.orders
  WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL
    AND status NOT IN ('cancelled', 'refunded')
  GROUP BY DATE(created_at)
  ORDER BY sale_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get top selling products
CREATE OR REPLACE FUNCTION public.get_top_products(p_limit INTEGER DEFAULT 5, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  total_quantity BIGINT,
  total_revenue DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oi.product_id,
    oi.product_name,
    SUM(oi.quantity)::BIGINT AS total_quantity,
    SUM(oi.price * oi.quantity) AS total_revenue
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE o.created_at >= NOW() - (p_days || ' days')::INTERVAL
    AND o.status NOT IN ('cancelled', 'refunded')
  GROUP BY oi.product_id, oi.product_name
  ORDER BY total_quantity DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get expense summary
CREATE OR REPLACE FUNCTION public.get_expense_summary(p_start_date DATE, p_end_date DATE)
RETURNS TABLE (
  category_name TEXT,
  category_color TEXT,
  total_amount DECIMAL,
  expense_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ec.name AS category_name,
    ec.color AS category_color,
    COALESCE(SUM(e.amount), 0) AS total_amount,
    COUNT(e.id) AS expense_count
  FROM public.expense_categories ec
  LEFT JOIN public.expenses e ON e.category_id = ec.id 
    AND e.expense_date BETWEEN p_start_date AND p_end_date
  GROUP BY ec.id, ec.name, ec.color
  ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql;
