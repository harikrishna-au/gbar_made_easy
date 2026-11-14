#!/usr/bin/env node
/**
 * One-off repair: find users who PAID on Razorpay but never got premium.
 *
 * Looks at payment_transactions rows still marked 'created' (checkout opened, but our
 * verify step / webhook never recorded the payment), asks Razorpay whether the order
 * actually has a captured payment, and — with --apply — grants lifetime premium in
 * Supabase profiles and Clerk publicMetadata.
 *
 * Dry run by default (prints what it WOULD do, writes nothing).
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   RAZORPAY_KEY_ID=... RAZORPAY_KEY_SECRET=... CLERK_SECRET_KEY=... \
 *   node scripts/reconcile-razorpay-payments.mjs [--apply] [--min-age-minutes=10]
 */
const need = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"];
for (const k of need) if (!process.env[k]) { console.error(`Missing env ${k}`); process.exit(1); }

const apply = process.argv.includes("--apply");
const minAge = Number((process.argv.find((a) => a.startsWith("--min-age-minutes=")) ?? "").split("=")[1] ?? 10) || 10;
const clerkSecret = process.env.CLERK_SECRET_KEY;

const sb = (path, init = {}) =>
  fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
const rzp = (path) =>
  fetch(`https://api.razorpay.com/v1/${path}`, {
    headers: { Authorization: "Basic " + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64") },
  });

const cutoff = new Date(Date.now() - minAge * 60_000).toISOString();
const res = await sb(`payment_transactions?status=eq.created&created_at=lt.${cutoff}&select=user_id,txnid,amount,created_at&order=created_at.desc&limit=1000`);
if (!res.ok) { console.error("Could not read payment_transactions", await res.text()); process.exit(1); }
const rows = await res.json();
console.log(`${rows.length} unconfirmed order(s) older than ${minAge} min. ${apply ? "APPLYING" : "DRY RUN"}\n`);

let fixed = 0;
for (const row of rows) {
  if (!String(row.txnid).startsWith("order_")) continue; // PayU etc.
  const pr = await rzp(`orders/${row.txnid}/payments`);
  if (!pr.ok) { console.warn(`  ${row.txnid}: Razorpay lookup failed (${pr.status})`); continue; }
  const payment = ((await pr.json()).items ?? []).find((p) => p.status === "captured");
  if (!payment) continue; // genuinely unpaid / abandoned checkout

  const prof = await (await sb(`profiles?user_id=eq.${encodeURIComponent(row.user_id)}&select=is_premium`)).json();
  const already = prof?.[0]?.is_premium === true;
  console.log(`PAID  user=${row.user_id} order=${row.txnid} payment=${payment.id} ₹${payment.amount / 100} premium_in_db=${already}`);
  if (!apply) { fixed++; continue; }

  if (!already) {
    const up = await sb("profiles?on_conflict=user_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ user_id: row.user_id, is_premium: true, plan_type: "lifetime", premium_expires_at: null, updated_at: new Date().toISOString() }),
    });
    if (!up.ok) { console.error("   profile upsert failed", await up.text()); continue; }
  }
  await sb(`payment_transactions?txnid=eq.${row.txnid}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "success", provider_reference_id: payment.id, raw_response: payment }),
  });
  if (clerkSecret) {
    const c = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(row.user_id)}/metadata`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${clerkSecret}`, "Content-Type": "application/json" },
      body: JSON.stringify({ public_metadata: { isPremium: true, planType: "lifetime", premiumExpiry: null } }),
    });
    if (!c.ok) console.warn(`   Clerk sync failed (${c.status}); user will auto-heal on next login`);
  }
  fixed++;
}
console.log(`\n${fixed} paid-but-stuck user(s) ${apply ? "repaired" : "found (re-run with --apply to repair)"}.`);
