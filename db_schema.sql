-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS (Extends Supabase Auth)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ADDRESSES
CREATE TABLE public.addresses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL, -- e.g. "Ev", "İş"
  full_address TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  zip_code TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CATEGORIES
CREATE TABLE public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCTS
CREATE TABLE public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  sale_price DECIMAL(10, 2), -- Discounted price
  
  -- Fabric Specifics
  fabric_type TEXT, -- Cotton, Silk, Polyester etc.
  pattern TEXT, -- Floral, Geometric, Plain
  width_cm INTEGER, -- e.g. 140
  weight_gsm INTEGER, -- e.g. 200
  usage_areas TEXT[], -- ['Dress', 'Curtain']
  
  is_active BOOLEAN DEFAULT TRUE,
  images TEXT[], -- Array of image URLs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- VARIANTS (e.g. Color)
CREATE TABLE public.variants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g. "Red", "Blue"
  color_code TEXT, -- Hex code e.g. #FF0000
  stock_quantity INTEGER DEFAULT 0,
  sku TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDERS
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded');

CREATE TABLE public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Null if guest checkout (future implement)
  guest_email TEXT, -- If user_id is null
  guest_info JSONB, -- Name, Phone etc.
  
  status order_status DEFAULT 'pending',
  total_amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'TRY',
  
  shipping_address JSONB NOT NULL, -- Snapshot of address
  billing_address JSONB NOT NULL,
  
  payment_provider TEXT DEFAULT 'paytr',
  payment_id TEXT,
  
  tracking_company TEXT,
  tracking_number TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDER ITEMS
CREATE TABLE public.order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  variant_id UUID REFERENCES public.variants(id),
  
  product_name TEXT NOT NULL, -- Snapshot
  variant_name TEXT, -- Snapshot
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) - Basic setup
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Policy: Public read access for products
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public read variants" ON public.variants FOR SELECT USING (true);

-- Policy: Users can see own orders
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);

