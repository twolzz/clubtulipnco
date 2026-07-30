-- Fix public.has_role() — restores real per-user admin checks.
--
-- WHAT WAS WRONG
-- Migration 20260704182508 defined the body as:
--     WHERE user_id = user_id AND role = _role
-- The parameter was named `user_id`, which is also the column name. Postgres
-- resolves that ambiguity in favour of the COLUMN, so `user_id = user_id` is
-- always true. The function was answering "does any admin exist?" instead of
-- "is THIS user an admin?". Every `if (!isAdmin) throw new Error("Forbidden")`
-- in src/lib/pop-ups.functions.ts sits behind that check.
--
-- That migration also switched the function to SECURITY INVOKER, which makes it
-- read public.user_roles under RLS — and the RLS policy on user_roles calls
-- has_role, so the check can also fail outright with infinite recursion.
--
-- WHAT THIS DOES
--   1. Names the parameter `_user_id` so it can never collide with a column,
--      and so it matches what the app already calls:
--      supabase.rpc("has_role", { _user_id, _role })
--   2. Returns to SECURITY DEFINER with a pinned search_path, which is the
--      standard Supabase pattern for a role-check helper and breaks the
--      RLS recursion.
--   3. Locks execution down to authenticated + service_role.
--
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 0. Make sure the pieces this depends on exist. No-ops if they already do.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  role       public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 1. Drop the policies that depend on has_role, so the function can be dropped.
--    They are recreated in step 4.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage all roles"   ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view subscribers"   ON public.subscribers;
DROP POLICY IF EXISTS "Admins can update subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Admins can delete subscribers" ON public.subscribers;

-- ---------------------------------------------------------------------------
-- 2. Drop the broken function.
--    DROP matches on argument TYPES, so this catches the definition whether its
--    first parameter was named `user_id` or `_user_id`. CREATE OR REPLACE could
--    not be used here: Postgres refuses to rename an existing parameter.
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- ---------------------------------------------------------------------------
-- 3. Recreate it correctly.
-- ---------------------------------------------------------------------------
CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id   -- aliased table: no ambiguity possible
      AND ur.role    = _role
  );
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. Recreate the policies.
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING      (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can view subscribers"
ON public.subscribers
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update subscribers"
ON public.subscribers
FOR UPDATE
TO authenticated
USING      (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete subscribers"
ON public.subscribers
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ---------------------------------------------------------------------------
-- 5. Verify (run these by hand in the Supabase SQL editor after migrating).
--
--   -- Should list your admin account(s), and nobody else:
--   SELECT user_id, role FROM public.user_roles WHERE role = 'admin';
--
--   -- Should be true for an admin's id, false for any other id:
--   SELECT public.has_role('<paste-an-admin-user-id>'::uuid, 'admin');
--   SELECT public.has_role('00000000-0000-0000-0000-000000000000'::uuid, 'admin');
--
-- If the second one returns true, the fix did not take effect.
-- ---------------------------------------------------------------------------
