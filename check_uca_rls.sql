SELECT policyname, cmd, qual FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_course_access';
