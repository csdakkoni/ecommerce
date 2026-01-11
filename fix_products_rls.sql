-- Fix RLS policies for Products table
-- Run this in Supabase SQL Editor

-- Allow insert for everyone (for demo/development)
-- In production, you should restrict this to authenticated admin users only
CREATE POLICY "Allow insert products for everyone" 
ON public.products 
FOR INSERT 
WITH CHECK (true);

-- Allow update for everyone
CREATE POLICY "Allow update products for everyone" 
ON public.products 
FOR UPDATE 
USING (true);

-- Allow delete for everyone
CREATE POLICY "Allow delete products for everyone" 
ON public.products 
FOR DELETE 
USING (true);

-- Same for categories
CREATE POLICY "Allow insert categories for everyone" 
ON public.categories 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update categories for everyone" 
ON public.categories 
FOR UPDATE 
USING (true);

-- Same for variants
CREATE POLICY "Allow insert variants for everyone" 
ON public.variants 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update variants for everyone" 
ON public.variants 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow delete variants for everyone" 
ON public.variants 
FOR DELETE 
USING (true);
