// Pure functions: turn raw analytics_events rows into the numbers shown on /admin → Analytics.
// No Deno or Supabase imports, so it can be unit-tested anywhere.

export interface EventRow {
  created_at: string;
  event: string;
  anon_id: string;
  session_id: string | null;
  user_id: string | null;
  path: string | null;
  referrer: string | null;
  utm_source: string | null;
  device: string | null;
  is_pwa: boolean | null;
  props: Record<string, unknown> | null;
}

const MIN = 60_000;
const IST_OFFSET = 330 * MIN; // days are counted in Indian time, where your students are

export const dayKey = (iso: string | number | Date): string =>
  new Date(new Date(iso).getTime() + IST_OFFSET).toISOString().slice(0, 10);

const addDays = (key: string, n: number): string => {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const pct = (a: number, b: number) => (b > 0 ? Math.round((1000 * a) / b) / 10 : null);
const num = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : 0);

const FEATURE_EVENTS = [
  "game_open", "communication_open", "infosys_open", "company_open",
  "ai_interview_open", "connect_view", "blog_open",
];

function whatFor(r: EventRow): string {
  const p = r.props ?? {};
  const v = p.game ?? p.round ?? p.section ?? p.company ?? p.type ?? p.slug ?? p.expert_id;
  return typeof v === "string" ? v : "";
}

export function computeStats(rows: EventRow[], rangeDays: number, now: Date = new Date()) {
  const today = dayKey(now);
  const start = addDays(today, -(rangeDays - 1));
  const days: string[] = [];
  for (let i = 0; i < rangeDays; i++) days.push(addDays(start, i));

  const inRange = rows.filter((r) => dayKey(r.created_at) >= start);

  // ── daily series ──
  const perDay = new Map(days.map((d) => [d, { visitors: new Set<string>(), users: new Set<string>(), signups: 0, views: 0 }]));
  for (const r of inRange) {
    const b = perDay.get(dayKey(r.created_at));
    if (!b) continue;
    b.visitors.add(r.anon_id);
    if (r.user_id) b.users.add(r.user_id);
    if (r.event === "signup") b.signups++;
    if (r.event === "page_view") b.views++;
  }
  const daily = days.map((d) => {
    const b = perDay.get(d)!;
    return { day: d, visitors: b.visitors.size, users: b.users.size, signups: b.signups, pageViews: b.views };
  });

  // ── headline numbers ──
  const visitors = new Set(inRange.map((r) => r.anon_id));
  const users = new Set(inRange.filter((r) => r.user_id).map((r) => r.user_id as string));
  const count = (ev: string) => inRange.filter((r) => r.event === ev).length;
  const sum = (ev: string) => inRange.filter((r) => r.event === ev).reduce((s, r) => s + num(r.props?.amount), 0);
  const todayRows = rows.filter((r) => dayKey(r.created_at) === today);
  const totals = {
    visitors: visitors.size,
    signedInUsers: users.size,
    signups: count("signup"),
    pageViews: count("page_view"),
    sessions: new Set(inRange.map((r) => r.session_id).filter(Boolean)).size,
    premiumSales: count("payment_success"),
    premiumRevenue: sum("payment_success"),
    connectBookings: count("connect_booking_paid"),
    connectRevenue: sum("connect_booking_paid"),
    visitorsToday: new Set(todayRows.map((r) => r.anon_id)).size,
    usersToday: new Set(todayRows.filter((r) => r.user_id).map((r) => r.user_id as string)).size,
  };

  // ── funnels (signed-in users in range) ──
  const flags = new Map<string, Set<string>>();
  for (const r of inRange) {
    if (!r.user_id) continue;
    if (!flags.has(r.user_id)) flags.set(r.user_id, new Set());
    flags.get(r.user_id)!.add(r.event);
  }
  const have = (evs: string[]) => [...flags.values()].filter((s) => evs.some((e) => s.has(e))).length;
  const mk = (steps: Array<[string, string[]]>) =>
    steps.map(([label, evs], i, all) => {
      const n = have(evs);
      const prev = i === 0 ? n : have(all[i - 1][1]);
      return { label, users: n, ofPrevious: i === 0 ? null : pct(n, prev) };
    });
  const funnel = mk([
    ["Signed in", ["signed_in", "page_view"]],
    ["Tried practice", ["game_open", "communication_open", "infosys_open"]],
    ["Saw premium offer", ["premium_popup_view"]],
    ["Started payment", ["payment_started"]],
    ["Paid for premium", ["payment_success"]],
  ]);
  const connectFunnel = mk([
    ["Opened Connect", ["connect_view"]],
    ["Started payment", ["connect_payment_started"]],
    ["Booked a session", ["connect_booking_paid"]],
  ]);

  // ── retention: cohorts by first day seen, using ALL fetched rows for first-seen ──
  const userDays = new Map<string, Set<string>>();
  for (const r of rows) {
    if (!r.user_id || r.event !== "page_view") continue;
    if (!userDays.has(r.user_id)) userDays.set(r.user_id, new Set());
    userDays.get(r.user_id)!.add(dayKey(r.created_at));
  }
  let c1 = 0, r1 = 0, c7 = 0, r7 = 0, cw = 0, rw = 0, cohort = 0;
  for (const set of userDays.values()) {
    const first = [...set].sort()[0];
    if (first < start) continue; // cohort = people who first appeared inside the range
    cohort++;
    if (first <= addDays(today, -1)) { c1++; if (set.has(addDays(first, 1))) r1++; }
    if (first <= addDays(today, -7)) {
      c7++; if (set.has(addDays(first, 7))) r7++;
      cw++; if ([1, 2, 3, 4, 5, 6, 7].some((n) => set.has(addDays(first, n)))) rw++;
    }
  }
  const retention = {
    newUsers: cohort,
    day1: { rate: pct(r1, c1), returned: r1, eligible: c1 },
    day7: { rate: pct(r7, c7), returned: r7, eligible: c7 },
    withinWeek: { rate: pct(rw, cw), returned: rw, eligible: cw },
  };

  // ── what people use ──
  const feat = new Map<string, { event: string; what: string; opens: number; people: Set<string> }>();
  for (const r of inRange) {
    if (!FEATURE_EVENTS.includes(r.event)) continue;
    const what = whatFor(r);
    const k = `${r.event}|${what}`;
    if (!feat.has(k)) feat.set(k, { event: r.event, what, opens: 0, people: new Set() });
    const f = feat.get(k)!;
    f.opens++;
    f.people.add(r.user_id ?? r.anon_id);
  }
  const features = [...feat.values()]
    .map((f) => ({ event: f.event, what: f.what, opens: f.opens, people: f.people.size }))
    .sort((a, b) => b.opens - a.opens)
    .slice(0, 15);

  // ── where people come from ──
  const firstByAnon = new Map<string, EventRow>();
  const signedUpAnons = new Set<string>();
  const sessionRef = new Map<string, string>();
  for (const r of [...inRange].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    if (!firstByAnon.has(r.anon_id)) firstByAnon.set(r.anon_id, r);
    if (r.event === "signup") signedUpAnons.add(r.anon_id);
    if (r.event === "session_start" && r.referrer && !sessionRef.has(r.anon_id)) sessionRef.set(r.anon_id, r.referrer);
  }
  const src = new Map<string, { visitors: number; signups: number }>();
  for (const [anon, r] of firstByAnon) {
    const label = r.utm_source || sessionRef.get(anon) || "(direct)";
    if (!src.has(label)) src.set(label, { visitors: 0, signups: 0 });
    const s = src.get(label)!;
    s.visitors++;
    if (signedUpAnons.has(anon)) s.signups++;
  }
  const sources = [...src.entries()].map(([source, v]) => ({ source, ...v })).sort((a, b) => b.visitors - a.visitors).slice(0, 10);

  // ── devices and installs ──
  const dev = new Map<string, { device: string; pwa: boolean }>();
  for (const r of inRange) {
    const cur = dev.get(r.anon_id) ?? { device: r.device ?? "unknown", pwa: false };
    cur.device = r.device ?? cur.device;
    if (r.is_pwa) cur.pwa = true;
    dev.set(r.anon_id, cur);
  }
  const devices = {
    mobile: [...dev.values()].filter((d) => d.device === "mobile").length,
    desktop: [...dev.values()].filter((d) => d.device === "desktop").length,
    installedAppUsers: [...dev.values()].filter((d) => d.pwa).length,
  };
  const installs = {
    cardShown: count("install_prompt_shown"),
    buttonClicks: count("install_button_click"),
    accepted: inRange.filter((r) => r.event === "install_prompt_result" && r.props?.outcome === "accepted").length,
    declined: inRange.filter((r) => r.event === "install_prompt_result" && r.props?.outcome === "dismissed").length + count("install_prompt_dismissed"),
    installed: count("pwa_installed"),
  };

  const payments = {
    premiumPopupViews: count("premium_popup_view"),
    started: count("payment_started"),
    succeeded: count("payment_success"),
    delayed: count("payment_delayed"),
    failed: count("payment_failed"),
  };

  return { rangeDays, today, totals, daily, funnel, connectFunnel, retention, features, sources, devices, installs, payments };
}
