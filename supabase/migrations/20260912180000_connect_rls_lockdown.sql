-- Lock Connect tables so clients cannot take over experts, rewrite
-- availability, or read every message. Writes go through edge functions.

DROP POLICY IF EXISTS "Clerk users can insert own experts" ON public.experts;
DROP POLICY IF EXISTS "Clerk users can update own experts" ON public.experts;
DROP POLICY IF EXISTS "Clerk users can delete own experts" ON public.experts;
DROP POLICY IF EXISTS "Users can insert own experts" ON public.experts;
DROP POLICY IF EXISTS "Users can update own experts" ON public.experts;
DROP POLICY IF EXISTS "Users can delete own experts" ON public.experts;
DROP POLICY IF EXISTS "Anyone can view experts" ON public.experts;

CREATE POLICY "Anyone can view approved experts"
  ON public.experts
  FOR SELECT
  USING (approved = true);

REVOKE ALL ON TABLE public.experts FROM anon, authenticated;
GRANT SELECT (
  id,
  name,
  title,
  bio,
  skills,
  photo_url,
  price_inr,
  company,
  interview_date,
  package_lpa,
  proof_url,
  approved,
  created_at
) ON public.experts TO anon, authenticated;

DROP POLICY IF EXISTS "Clerk users can insert own availability" ON public.availability;
DROP POLICY IF EXISTS "Clerk users can delete own availability" ON public.availability;
DROP POLICY IF EXISTS "Users can insert own availability" ON public.availability;
DROP POLICY IF EXISTS "Users can delete own availability" ON public.availability;

DROP POLICY IF EXISTS "Service role can read messages" ON public.messages;
DROP POLICY IF EXISTS "Service role can update messages" ON public.messages;

CREATE POLICY "Service role can read messages"
  ON public.messages
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can update messages"
  ON public.messages
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
