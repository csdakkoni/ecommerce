-- Enable Guest Checkout: Allow anyone to insert orders and order_items
-- This is necessary because we support guest checkout (no login required)

-- Orders table: Allow insert for anyone (guest checkout)
CREATE POLICY "Allow insert orders for everyone" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

-- Order Items table: Allow insert for anyone
CREATE POLICY "Allow insert order_items for everyone" 
ON public.order_items 
FOR INSERT 
WITH CHECK (true);

-- Orders table: Allow update for everyone (for status updates from admin - in production, add admin role check)
CREATE POLICY "Allow update orders for everyone" 
ON public.orders 
FOR UPDATE 
USING (true);

-- Orders table: Allow select for admin (in production, filter by admin role)
CREATE POLICY "Allow read orders for everyone" 
ON public.orders 
FOR SELECT 
USING (true);

-- Order Items table: Allow read for everyone
CREATE POLICY "Allow read order_items for everyone" 
ON public.order_items 
FOR SELECT 
USING (true);

-- Enable RLS on order_items if not already
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
