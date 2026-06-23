
CREATE POLICY "Members can read course videos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'course-videos');

CREATE POLICY "Admins upload course videos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'course-videos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update course videos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'course-videos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete course videos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'course-videos' AND public.has_role(auth.uid(), 'admin'));
