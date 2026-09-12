-- Connect manual-operations payment lifecycle.
-- A booking now exists before checkout, allowing webhook recovery when the
-- browser closes after payment but before client-side verification finishes.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS clerk_user_id text,
  ADD COLUMN IF NOT EXISTS payment_amount integer,
  ADD COLUMN IF NOT EXISTS payment_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_failure_reason text,
  ADD COLUMN IF NOT EXISTS refund_reference text,
  ADD COLUMN IF NOT EXISTS refund_amount integer,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancellation_reason text;

CREATE INDEX IF NOT EXISTS bookings_clerk_user_idx
  ON public.bookings (clerk_user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS bookings_razorpay_order_unique
  ON public.bookings (razorpay_order_id)
  WHERE razorpay_order_id IS NOT NULL;

DROP INDEX IF EXISTS public.unique_expert_active_slot;
CREATE UNIQUE INDEX unique_expert_active_slot
  ON public.bookings (expert_id, date, start_time)
  WHERE status IN ('payment_pending', 'paid', 'confirmed');

CREATE INDEX IF NOT EXISTS bookings_payment_expiry_idx
  ON public.bookings (payment_expires_at)
  WHERE status = 'payment_pending';

-- Remove the old email-as-password booking-history RPC entirely.
REVOKE ALL ON FUNCTION public.get_bookings_by_email(text) FROM PUBLIC;
DROP FUNCTION IF EXISTS public.get_bookings_by_email(text);

CREATE OR REPLACE FUNCTION public.get_booked_slots(
  p_expert_id uuid,
  p_date date
)
RETURNS TABLE (start_time time, end_time time)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT b.start_time, b.end_time
  FROM public.bookings b
  WHERE b.expert_id = p_expert_id
    AND b.date = p_date
    AND (
      b.status IN ('paid', 'confirmed')
      OR (b.status = 'payment_pending' AND b.payment_expires_at > now())
    );
$$;
