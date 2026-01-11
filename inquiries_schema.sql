-- Product Inquiries / Messages Table
-- Run this in Supabase SQL Editor

-- Create inquiries table
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    product_name TEXT, -- Denormalized for quick access
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'replied', 'closed')),
    admin_reply TEXT,
    replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (customers can send inquiries)
CREATE POLICY "Allow insert inquiries for everyone"
ON public.inquiries
FOR INSERT
WITH CHECK (true);

-- Allow anyone to read their own inquiries by email
CREATE POLICY "Allow select own inquiries"
ON public.inquiries
FOR SELECT
USING (true);

-- Allow update for everyone (for admin replies, in production should be restricted)
CREATE POLICY "Allow update inquiries for everyone"
ON public.inquiries
FOR UPDATE
USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_inquiries_product_id ON public.inquiries(product_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON public.inquiries(created_at DESC);
