# Connect super-admin v1

Connect now uses a manually operated workflow:

1. A student chooses an expert, time, and pays.
2. The booking enters the super-admin queue with status `paid`.
3. The operator reviews both parties and the requested schedule.
4. The operator creates a meeting link manually and pastes it into the booking.
5. **Confirm & send to both sides** emails one shared link to the student and expert.
6. The operator marks the call completed, cancelled, refunded, or no-show.

## Deploy

Run the migration:

```bash
supabase db push
```

Create a strong password that is used only for Connect operations:

```bash
supabase secrets set CONNECT_ADMIN_SECRET='replace-with-a-long-random-password'
```

Email delivery also requires the existing `RESEND_API_KEY` and `FROM_EMAIL`
secrets. `FROM_EMAIL` must be a sender verified in Resend.

Deploy the changed functions:

```bash
supabase functions deploy connect-admin
supabase functions deploy connect-expert-bookings
supabase functions deploy connect-my-bookings
supabase functions deploy verify-booking-payment
supabase functions deploy generate-meet-link
```

Deploy the web application, then open:

```text
https://www.harrytheblaze.site/admin/connect
```

Use the value of `CONNECT_ADMIN_SECRET` to sign in. It is retained only in the
current browser tab's session storage and is validated server-side.

## Operations rules

- Never send a meeting link until both the schedule and expert are confirmed.
- Keep private context in **Operator notes**; students and experts cannot see it.
- Use **Urgent** only for calls within 24 hours or payment/support escalations.
- **Confirm & send** also moves the booking to `confirmed`.
- Resending is safe and is recorded in the booking event log.
- Keep payment IDs for reconciliation; do not paste secrets into operator notes.

## Deliberately manual in v1

- No automatic Google Meet creation.
- No student-triggered meeting-link generation.
- No expert accept/decline controls.
- No automatic rescheduling or refunds.

These constraints give the operator one source of truth while the service is
young. Automation can be added after real operating patterns are understood.
