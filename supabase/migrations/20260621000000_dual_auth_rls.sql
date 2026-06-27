-- 重新啟用 RLS policies for 雙 Auth 方案
-- Cognito 登入後會同步到 Supabase Auth，user_id 保持一致

-- ============================================================
-- Profiles: 用戶可以查看和更新自己的 profile
-- ============================================================
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles can be inserted by anyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles can be updated by anyone" ON public.profiles;

CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (id = auth.uid());

CREATE POLICY "Allow sync_auth to insert profiles" 
  ON public.profiles FOR INSERT 
  WITH CHECK (true);

-- ============================================================
-- Orders: 用戶可以查看自己的訂單（用 email 比對），admin 可以查看所有
-- ============================================================
DROP POLICY IF EXISTS "Orders viewable by everyone" ON public.orders;
DROP POLICY IF EXISTS "Orders insertable by everyone" ON public.orders;
DROP POLICY IF EXISTS "Orders viewable by email match" ON public.orders;
DROP POLICY IF EXISTS "Orders can be inserted by anyone" ON public.orders;

CREATE POLICY "Users can view own orders by email" 
  ON public.orders FOR SELECT 
  USING (
    customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Service can insert orders" 
  ON public.orders FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admins can update orders" 
  ON public.orders FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- Order Items: 跟隨訂單的權限（用 email 比對）
-- ============================================================
DROP POLICY IF EXISTS "Order items viewable by everyone" ON public.order_items;
DROP POLICY IF EXISTS "Order items viewable with order" ON public.order_items;
DROP POLICY IF EXISTS "Order items can be inserted by anyone" ON public.order_items;

CREATE POLICY "Users can view own order items by email" 
  ON public.order_items FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND (
        orders.customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
        EXISTS (
          SELECT 1 FROM public.user_roles 
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Service can insert order items" 
  ON public.order_items FOR INSERT 
  WITH CHECK (true);

-- ============================================================
-- Blog Posts: 已經有 policies，只需確保正確
-- ============================================================
-- 已存在的 policies 應該已經正確，不需要修改

-- ============================================================
-- Courses: 已經有 policies，不需要修改
-- ============================================================
-- 已存在的 policies 已經正確

-- ============================================================
-- Course Enrollments: 已經有 policies，不需要修改
-- ============================================================
-- 已存在的 policies 已經正確

-- ============================================================
-- Storage: blog-images bucket
-- ============================================================
-- Admins 可以上傳和刪除
DROP POLICY IF EXISTS "Admins can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete blog images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view blog images" ON storage.objects;

CREATE POLICY "Admins can upload blog images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'blog-images' AND
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete blog images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'blog-images' AND
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 所有人可以讀取（公開圖片）
CREATE POLICY "Anyone can view blog images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'blog-images');
