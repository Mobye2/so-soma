-- Remove FK constraint on profiles.id -> auth.users(id)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey;
ALTER TABLE public.profiles ADD PRIMARY KEY (id);

-- Remove auto-create profile trigger (Cognito handles auth now)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Update existing profile to use Cognito sub
UPDATE public.profiles
SET id = '9ad4502a-00b1-7096-96ff-94c88996f8ab'
WHERE id = '3a7feaa1-98bf-4d3a-982d-76e7fd0acf3f';

-- Also update user_roles to point to new Cognito sub
UPDATE public.user_roles
SET user_id = '9ad4502a-00b1-7096-96ff-94c88996f8ab'
WHERE user_id = '3a7feaa1-98bf-4d3a-982d-76e7fd0acf3f';

-- Remove RLS policies that reference auth.uid() on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Recreate with open policies (API-level auth via Cognito JWT)
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles can be inserted by anyone" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Profiles can be updated by anyone" ON public.profiles FOR UPDATE USING (true) WITH CHECK (true);
