-- Stop two active bookings for the same expert from overlapping in time.
-- (The existing unique index only blocks identical start times.)
-- If old rows already overlap this fails loudly (exclusion_violation). Fix or
-- cancel the overlapping bookings it reports, then run it again.
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
END $$;
