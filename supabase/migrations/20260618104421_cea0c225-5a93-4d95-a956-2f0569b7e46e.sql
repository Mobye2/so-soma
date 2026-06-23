
DROP POLICY IF EXISTS "Published posts viewable by everyone" ON public.blog_posts;
CREATE POLICY "Published posts viewable by everyone" ON public.blog_posts
FOR SELECT USING (published = true AND (published_at IS NULL OR published_at <= now()));

DROP POLICY IF EXISTS "Published IG posts are viewable by everyone" ON public.ig_posts;
CREATE POLICY "Published IG posts are viewable by everyone" ON public.ig_posts
FOR SELECT USING (published = true AND post_date <= CURRENT_DATE);
