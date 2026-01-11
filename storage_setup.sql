-- Supabase Storage Setup for Product Images
-- Run this in Supabase SQL Editor

-- Create a storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to product images
CREATE POLICY "Public read access for products bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

-- Allow authenticated users (admin) to upload images
CREATE POLICY "Allow upload for authenticated users"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'products');

-- Allow authenticated users (admin) to update images
CREATE POLICY "Allow update for authenticated users"
ON storage.objects FOR UPDATE
USING (bucket_id = 'products');

-- Allow authenticated users (admin) to delete images
CREATE POLICY "Allow delete for authenticated users"
ON storage.objects FOR DELETE
USING (bucket_id = 'products');
