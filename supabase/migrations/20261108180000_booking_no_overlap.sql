-- Stop two active bookings for the same expert from overlapping in time.
-- (The existing unique index only blocks identical start times.)
-- Guarded: if old data already overlaps, this is skipped instead of failing;
-- the create-booking-order function still enforces the overlap check.
CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
  ALTER TABLE public.bookings
    ADD CONSTRAINT bookings_no_expert_overlap
    EXCLUDE USING gist (
      expert_id WITH =,
      tsrange((date + start_time), (date + end_time)) WITH &&
    )
    WHERE (status IN ('payment_pending', 'paid', 'confirmed'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN exclusion_violation THEN
    RAISE NOTICE 'Existing overlapping bookings found; constraint not added.';
  WHEN others THEN
    RAISE NOTICE 'Overlap constraint skipped: %', SQLERRM;
END $$;
