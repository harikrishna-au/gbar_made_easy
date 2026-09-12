-- Connect v1: manual super-admin operations
-- The super-admin reviews every paid booking, confirms it, assigns a meeting
-- link, and communicates details to the student and expert.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS meet_link_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS bookings_ops_queue_idx
  ON public.bookings (status, date, start_time);

CREATE INDEX IF NOT EXISTS bookings_ops_created_idx
  ON public.bookings (created_at DESC);

CREATE TABLE IF NOT EXISTS public.booking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  from_status text,
  to_status text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages booking events" ON public.booking_events;
CREATE POLICY "Service role manages booking events"
  ON public.booking_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS booking_events_booking_idx
  ON public.booking_events (booking_id, created_at DESC);

-- Experts should see their sessions, but v1 operations are controlled by the
-- super-admin. Remove the old expert-side status mutation policy.
DROP POLICY IF EXISTS "Experts can update own bookings" ON public.bookings;

-- The public slot picker only needs occupied intervals, never booking PII.
-- Direct booking SELECT remains blocked.
CREATE OR REPLACE FUNCTION public.get_booked_slots(
  p_expert_id uuid,
  p_date date
)
RETURNS TABLE (
  start_time time,
  end_time time
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT b.start_time, b.end_time
  FROM public.bookings b
  WHERE b.expert_id = p_expert_id
    AND b.date = p_date
    AND b.status IN ('paid', 'confirmed');
$$;

REVOKE ALL ON FUNCTION public.get_booked_slots(uuid, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_booked_slots(uuid, date) TO anon, authenticated;

-- Customer booking history now goes through connect-my-bookings, which verifies
-- the Clerk session and derives email addresses server-side.
REVOKE EXECUTE ON FUNCTION public.get_bookings_by_email(text) FROM anon, authenticated;
