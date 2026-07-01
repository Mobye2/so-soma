-- Fix courses: remove duplicate SELECT policy
DROP POLICY IF EXISTS "public read published courses" ON public.courses;
