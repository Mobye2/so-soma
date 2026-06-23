INSERT INTO public.user_roles (user_id, role)
VALUES ('8b0ab355-1729-4342-a266-fc086b64023d', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;