-- ===========================================
-- GROHN FABRICS - COMPREHENSIVE RLS POLICIES
-- ===========================================
-- Bu dosyayı Supabase SQL Editor'da çalıştırın.
-- ÖNCE mevcut zayıf policy'leri kaldırır, sonra güvenli olanları ekler.
-- ===========================================

-- ===========================================
-- 1. ADMIN ROLE HELPER FUNCTION
-- ===========================================
-- Admin kontrolü için yardımcı fonksiyon
-- NOT: Supabase'de user_metadata içinde 'role' alanı kullanıyoruz

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
      false
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 2. DROP OLD INSECURE POLICIES
-- ===========================================

-- Orders tablosu - eski policy'leri kaldır
DROP POLICY IF EXISTS "Allow insert orders for everyone" ON public.orders;
DROP POLICY IF EXISTS "Allow update orders for everyone" ON public.orders;
DROP POLICY IF EXISTS "Allow read orders for everyone" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;

-- Order Items tablosu
DROP POLICY IF EXISTS "Allow insert order_items for everyone" ON public.order_items;
DROP POLICY IF EXISTS "Allow read order_items for everyone" ON public.order_items;

-- Products tablosu
DROP POLICY IF EXISTS "Public read products" ON public.products;

-- Variants tablosu
DROP POLICY IF EXISTS "Public read variants" ON public.variants;

-- Categories tablosu
DROP POLICY IF EXISTS "Public read categories" ON public.categories;

-- ===========================================
-- 3. PRODUCTS TABLOSU
-- ===========================================

-- Herkes aktif ürünleri okuyabilir
CREATE POLICY "products_select_public"
ON public.products
FOR SELECT
USING (is_active = true);

-- Sadece admin tüm ürünleri (aktif/pasif) okuyabilir
CREATE POLICY "products_select_admin"
ON public.products
FOR SELECT
USING (public.is_admin() = true);

-- Sadece admin yeni ürün ekleyebilir
CREATE POLICY "products_insert_admin"
ON public.products
FOR INSERT
WITH CHECK (public.is_admin() = true);

-- Sadece admin ürün güncelleyebilir
CREATE POLICY "products_update_admin"
ON public.products
FOR UPDATE
USING (public.is_admin() = true);

-- Sadece admin ürün silebilir
CREATE POLICY "products_delete_admin"
ON public.products
FOR DELETE
USING (public.is_admin() = true);

-- ===========================================
-- 4. VARIANTS TABLOSU
-- ===========================================

-- Herkes varyantları okuyabilir (ürün detayları için)
CREATE POLICY "variants_select_public"
ON public.variants
FOR SELECT
USING (true);

-- Sadece admin varyant ekleyebilir
CREATE POLICY "variants_insert_admin"
ON public.variants
FOR INSERT
WITH CHECK (public.is_admin() = true);

-- Sadece admin varyant güncelleyebilir
CREATE POLICY "variants_update_admin"
ON public.variants
FOR UPDATE
USING (public.is_admin() = true);

-- Sadece admin varyant silebilir
CREATE POLICY "variants_delete_admin"
ON public.variants
FOR DELETE
USING (public.is_admin() = true);

-- ===========================================
-- 5. CATEGORIES TABLOSU
-- ===========================================

-- Herkes kategorileri okuyabilir
CREATE POLICY "categories_select_public"
ON public.categories
FOR SELECT
USING (true);

-- Sadece admin kategori yönetimi
CREATE POLICY "categories_insert_admin"
ON public.categories
FOR INSERT
WITH CHECK (public.is_admin() = true);

CREATE POLICY "categories_update_admin"
ON public.categories
FOR UPDATE
USING (public.is_admin() = true);

CREATE POLICY "categories_delete_admin"
ON public.categories
FOR DELETE
USING (public.is_admin() = true);

-- ===========================================
-- 6. ORDERS TABLOSU (En Kritik!)
-- ===========================================

-- Guest checkout için sipariş oluşturma (herkes)
CREATE POLICY "orders_insert_public"
ON public.orders
FOR INSERT
WITH CHECK (true);

-- Kullanıcı kendi siparişlerini görebilir
-- Guest ise guest_email eşleşmeli (cookie ile kontrol)
CREATE POLICY "orders_select_own"
ON public.orders
FOR SELECT
USING (
  -- Authenticated user kendi siparişleri
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  -- VEYA admin tüm siparişleri görebilir
  OR public.is_admin() = true
);

-- Sadece admin sipariş güncelleyebilir (status değişikliği vb.)
CREATE POLICY "orders_update_admin"
ON public.orders
FOR UPDATE
USING (public.is_admin() = true);

-- Siparişler silinemez (soft delete tercih edilmeli)
-- DELETE policy yok = kimse silemez

-- ===========================================
-- 7. ORDER_ITEMS TABLOSU
-- ===========================================

-- RLS etkin değilse etkinleştir
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Sipariş kalemi ekleme (checkout sırasında)
CREATE POLICY "order_items_insert_public"
ON public.order_items
FOR INSERT
WITH CHECK (true);

-- Kullanıcı kendi sipariş kalemlerini görebilir
CREATE POLICY "order_items_select_own"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id
    AND (
      (auth.uid() IS NOT NULL AND o.user_id = auth.uid())
      OR public.is_admin() = true
    )
  )
);

-- Sadece admin güncelleyebilir
CREATE POLICY "order_items_update_admin"
ON public.order_items
FOR UPDATE
USING (public.is_admin() = true);

-- ===========================================
-- 8. SITE_PAGES TABLOSU (CMS)
-- ===========================================

-- RLS etkin değilse etkinleştir
ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;

-- Yayınlanmış sayfaları herkes okuyabilir
CREATE POLICY "site_pages_select_published"
ON public.site_pages
FOR SELECT
USING (is_published = true);

-- Admin tüm sayfaları (yayınlanmamış dahil) okuyabilir
CREATE POLICY "site_pages_select_admin"
ON public.site_pages
FOR SELECT
USING (public.is_admin() = true);

-- Sadece admin sayfa yönetimi
CREATE POLICY "site_pages_insert_admin"
ON public.site_pages
FOR INSERT
WITH CHECK (public.is_admin() = true);

CREATE POLICY "site_pages_update_admin"
ON public.site_pages
FOR UPDATE
USING (public.is_admin() = true);

CREATE POLICY "site_pages_delete_admin"
ON public.site_pages
FOR DELETE
USING (public.is_admin() = true);

-- ===========================================
-- 9. INQUIRIES TABLOSU (Müşteri Soruları)
-- ===========================================

-- RLS etkin değilse etkinleştir
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Herkes soru gönderebilir
CREATE POLICY "inquiries_insert_public"
ON public.inquiries
FOR INSERT
WITH CHECK (true);

-- Sadece admin soruları okuyabilir
CREATE POLICY "inquiries_select_admin"
ON public.inquiries
FOR SELECT
USING (public.is_admin() = true);

-- Sadece admin soruları güncelleyebilir (cevaplama, durum)
CREATE POLICY "inquiries_update_admin"
ON public.inquiries
FOR UPDATE
USING (public.is_admin() = true);

-- ===========================================
-- 10. ERP TABLOLARI (Sadece Admin)
-- ===========================================

-- COUPONS (Aktif kuponlar checkout'ta okunabilir)
DROP POLICY IF EXISTS "Public read active coupons" ON public.coupons;

CREATE POLICY "coupons_select_active"
ON public.coupons
FOR SELECT
USING (is_active = true OR public.is_admin() = true);

CREATE POLICY "coupons_manage_admin"
ON public.coupons
FOR ALL
USING (public.is_admin() = true);

-- STOCK MOVEMENTS (Sadece Admin)
CREATE POLICY "stock_movements_admin"
ON public.stock_movements
FOR ALL
USING (public.is_admin() = true);

-- EXPENSES (Sadece Admin)
CREATE POLICY "expenses_admin"
ON public.expenses
FOR ALL
USING (public.is_admin() = true);

-- SUPPLIERS (Sadece Admin)
CREATE POLICY "suppliers_admin"
ON public.suppliers
FOR ALL
USING (public.is_admin() = true);

-- SUPPLIER ORDERS (Sadece Admin)
CREATE POLICY "supplier_orders_admin"
ON public.supplier_orders
FOR ALL
USING (public.is_admin() = true);

CREATE POLICY "supplier_order_items_admin"
ON public.supplier_order_items
FOR ALL
USING (public.is_admin() = true);

-- SETTINGS (Herkes okuyabilir, admin yazabilir)
DROP POLICY IF EXISTS "Public read settings" ON public.settings;

CREATE POLICY "settings_select_public"
ON public.settings
FOR SELECT
USING (true);

CREATE POLICY "settings_manage_admin"
ON public.settings
FOR ALL
USING (public.is_admin() = true);

-- NOTIFICATIONS (Sadece Admin)
CREATE POLICY "notifications_admin"
ON public.notifications
FOR ALL
USING (public.is_admin() = true);

-- ===========================================
-- 11. PROFILES TABLOSU
-- ===========================================

-- Kullanıcı kendi profilini okuyabilir
-- (Mevcut policy korunuyor, kontrol edelim)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
USING (auth.uid() = id OR public.is_admin() = true);

CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Yeni profil sadece kendi için oluşturulabilir
CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- ===========================================
-- 12. ADDRESSES TABLOSU
-- ===========================================

-- Kullanıcı kendi adreslerini yönetebilir
DROP POLICY IF EXISTS "Users can manage own addresses" ON public.addresses;

CREATE POLICY "addresses_select_own"
ON public.addresses
FOR SELECT
USING (user_id = auth.uid() OR public.is_admin() = true);

CREATE POLICY "addresses_insert_own"
ON public.addresses
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "addresses_update_own"
ON public.addresses
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "addresses_delete_own"
ON public.addresses
FOR DELETE
USING (user_id = auth.uid());

-- ===========================================
-- TAMAMLANDI!
-- ===========================================
-- Bu script çalıştırıldıktan sonra:
-- 1. Test: Anonim kullanıcı olarak orders tablosunu okumaya çalışın (başarısız olmalı)
-- 2. Test: Admin rolüyle giriş yapıp tüm siparişleri görün (başarılı olmalı)
-- 3. Test: Yeni sipariş oluşturun (başarılı olmalı)
-- ===========================================
