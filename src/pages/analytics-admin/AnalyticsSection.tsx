import { useCallback, useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Loader2, RefreshCw } from "lucide-react";
import { getAdminSecret } from "@/lib/admin-auth";

type Range = 7 | 30 | 90;

interface Stats {
  today: string;
  totals: {
    visitors: number; signedInUsers: number; signups: number; pageViews: number; sessions: number;
    premiumSales: number; premiumRevenue: number; connectBookings: number; connectRevenue: number;
    visitorsToday: number; usersToday: number;
  };
  daily: { day: string; visitors: number; users: number; signups: number; pageViews: number }[];
  funnel: { label: string; users: number; ofPrevious: number | null }[];
  connectFunnel: { label: string; users: number; ofPrevious: number | null }[];
  retention: {
    newUsers: number;
    day1: Rate; day7: Rate; withinWeek: Rate;
  };
  features: { event: string; what: string; opens: number; people: number }[];
  sources: { source: string; visitors: number; signups: number }[];
  devices: { mobile: number; desktop: number; installedAppUsers: number };
  installs: { cardShown: number; buttonClicks: number; accepted: number; declined: number; installed: number };
  payments: { premiumPopupViews: number; started: number; succeeded: number; delayed: number; failed: number };
}
interface Rate { rate: number | null; returned: number; eligible: number }
interface Response { generatedAt: string; rows: number; truncated: boolean; stats: Stats }

const FEATURE_LABEL: Record<string, string> = {
  game_open: "Game", communication_open: "Communication", infosys_open: "Infosys", company_open: "Company page",
  ai_interview_open: "AI interview", connect_view: "Connect", blog_open: "Blog",
};

const card = "rounded-xl border border-stone-200 bg-white p-4 shadow-sm";
const h3 = "font-['Inter'] text-[11px] font-semibold uppercase tracking-widest text-stone-400";
const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

function Kpi({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className={card}>
      <p className={h3}>{label}</p>
      <p className="mt-1 font-['Merriweather'] text-3xl font-bold text-stone-900">{value}</p>
      {sub && <p className="mt-0.5 font-['Inter'] text-xs text-stone-500">{sub}</p>}
    </div>
  );
}

function Funnel({ steps }: { steps: Stats["funnel"] }) {
  const max = Math.max(1, ...steps.map((s) => s.users));
  return (
    <div className="space-y-2.5">
      {steps.map((s) => (
        <div key={s.label}>
          <div className="flex items-baseline justify-between font-['Inter'] text-[13px]">
            <span className="font-medium text-stone-700">{s.label}</span>
            <span className="text-stone-500">
              <b className="text-stone-900">{s.users}</b>
              {s.ofPrevious !== null && <span className="ml-2 text-xs">{s.ofPrevious}% of previous step</span>}
            </span>
          </div>
          <div className="mt-1 h-2.5 rounded bg-stone-100">
            <div className="h-2.5 rounded bg-stone-800" style={{ width: `${(100 * s.users) / max}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function RetentionCell({ title, r }: { title: string; r: Rate }) {
  return (
    <div className="rounded-lg border border-stone-200 p-3">
      <p className={h3}>{title}</p>
      <p className="mt-1 font-['Merriweather'] text-2xl font-bold text-stone-900">{r.rate === null ? "n/a" : `${r.rate}%`}</p>
      <p className="font-['Inter'] text-xs text-stone-500">
        {r.eligible ? `${r.returned} of ${r.eligible} came back` : "too early to tell"}
      </p>
    </div>
  );
}

export default function AnalyticsSection() {
  const [range, setRange] = useState<Range>(30);
  const [data, setData] = useState<Response | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (days: Range) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-analytics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          "x-admin-key": getAdminSecret(),
        },
        body: JSON.stringify({ days }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          res.status === 401 ? "Admin session expired. Log out and log in again."
            : body?.hint ? `${body.error} — ${body.hint}` : body?.error || `Request failed (${res.status})`,
        );
      }
      setData(body as Response);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(range); }, [load, range]);

  const s = data?.stats;
  const empty = !!data && data.rows === 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-['Merriweather'] text-xl font-bold text-stone-900">Site analytics</h2>
          <p className="font-['Inter'] text-xs text-stone-500">
            {data ? `${data.rows.toLocaleString("en-IN")} events read · updated ${new Date(data.generatedAt).toLocaleTimeString()} · days in IST` : "Loading…"}
            {data?.truncated && " · showing the most recent part only"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-stone-100 p-1">
            {([7, 30, 90] as Range[]).map((d) => (
              <button key={d} onClick={() => setRange(d)}
                className={`rounded-md px-3 py-1.5 font-['Inter'] text-xs font-semibold transition-all ${range === d ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}>
                {d} days
              </button>
            ))}
          </div>
          <button onClick={() => load(range)} disabled={loading} aria-label="Refresh"
            className="rounded-lg border border-stone-200 bg-white p-2 text-stone-600 hover:bg-stone-50 disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 font-['Inter'] text-sm text-red-700">{error}</div>}

      {empty && (
        <div className={`${card} text-center`}>
          <p className="font-['Merriweather'] text-lg font-bold text-stone-800">No events yet</p>
          <p className="mt-1 font-['Inter'] text-sm text-stone-500">
            Numbers appear as soon as visitors use the site. Open the site in a normal browser window (not private, with Do Not Track off) and refresh here.
          </p>
        </div>
      )}

      {s && !empty && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Kpi label="Visitors" value={s.totals.visitors.toLocaleString("en-IN")} sub={`${s.totals.visitorsToday} today`} />
            <Kpi label="Signed-in users" value={s.totals.signedInUsers.toLocaleString("en-IN")} sub={`${s.totals.usersToday} today`} />
            <Kpi label="New sign-ups" value={s.totals.signups.toLocaleString("en-IN")} />
            <Kpi label="Premium sales" value={s.totals.premiumSales} sub={`${inr(s.totals.premiumRevenue)} through the website`} />
            <Kpi label="Connect bookings" value={s.totals.connectBookings} sub={`${inr(s.totals.connectRevenue)} booked`} />
          </div>

          <div className={card}>
            <p className={h3}>Visitors, signed-in users and sign-ups per day</p>
            <div className="mt-3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={s.daily} margin={{ left: -18, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="day" tickFormatter={(d: string) => d.slice(5)} tick={{ fontSize: 11, fill: "#78716c" }} minTickGap={24} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#78716c" }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="visitors" name="Visitors" stroke="#1c1917" fill="#1c1917" fillOpacity={0.08} strokeWidth={2} isAnimationActive={false} />
                  <Area type="monotone" dataKey="users" name="Signed-in users" stroke="#d97706" fill="#d97706" fillOpacity={0.1} strokeWidth={2} isAnimationActive={false} />
                  <Area type="monotone" dataKey="signups" name="Sign-ups" stroke="#16a34a" fill="#16a34a" fillOpacity={0.1} strokeWidth={2} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className={card}>
              <p className={`${h3} mb-3`}>Premium funnel</p>
              <Funnel steps={s.funnel} />
            </div>
            <div className={card}>
              <p className={`${h3} mb-3`}>Connect funnel</p>
              <Funnel steps={s.connectFunnel} />
              <p className="mt-3 font-['Inter'] text-xs text-stone-500">
                Where this drops is where students lose interest or trust in Connect.
              </p>
            </div>
          </div>

          <div className={card}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className={h3}>Do people come back? (new users in this period)</p>
              <p className="font-['Inter'] text-xs text-stone-500">{s.retention.newUsers} new users</p>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <RetentionCell title="Next day" r={s.retention.day1} />
              <RetentionCell title="After 7 days" r={s.retention.day7} />
              <RetentionCell title="Within a week" r={s.retention.withinWeek} />
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className={card}>
              <p className={`${h3} mb-2`}>What people open</p>
              <table className="w-full font-['Inter'] text-[13px]">
                <thead><tr className="text-left text-xs text-stone-400"><th className="pb-1 font-medium">Feature</th><th className="pb-1 text-right font-medium">Opens</th><th className="pb-1 text-right font-medium">People</th></tr></thead>
                <tbody>
                  {s.features.map((f) => (
                    <tr key={`${f.event}|${f.what}`} className="border-t border-stone-100">
                      <td className="py-1.5 text-stone-700">{FEATURE_LABEL[f.event] ?? f.event}{f.what && <span className="text-stone-400"> · {f.what}</span>}</td>
                      <td className="py-1.5 text-right font-semibold text-stone-900">{f.opens}</td>
                      <td className="py-1.5 text-right text-stone-500">{f.people}</td>
                    </tr>
                  ))}
                  {!s.features.length && <tr><td colSpan={3} className="py-3 text-stone-400">Nothing opened in this period.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className={card}>
              <p className={`${h3} mb-2`}>Where visitors come from</p>
              <table className="w-full font-['Inter'] text-[13px]">
                <thead><tr className="text-left text-xs text-stone-400"><th className="pb-1 font-medium">Source</th><th className="pb-1 text-right font-medium">Visitors</th><th className="pb-1 text-right font-medium">Sign-ups</th></tr></thead>
                <tbody>
                  {s.sources.map((x) => (
                    <tr key={x.source} className="border-t border-stone-100">
                      <td className="py-1.5 text-stone-700">{x.source}</td>
                      <td className="py-1.5 text-right font-semibold text-stone-900">{x.visitors}</td>
                      <td className="py-1.5 text-right text-stone-500">{x.signups}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 font-['Inter'] text-xs text-stone-500">Tip: share links as <code>?utm_source=youtube</code> to see which channel works.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className={card}>
              <p className={h3}>Devices</p>
              <p className="mt-2 font-['Inter'] text-sm text-stone-700">{s.devices.mobile} on phone · {s.devices.desktop} on desktop</p>
              <p className="font-['Inter'] text-sm text-stone-700">{s.devices.installedAppUsers} using the installed app</p>
            </div>
            <div className={card}>
              <p className={h3}>Install the app</p>
              <p className="mt-2 font-['Inter'] text-sm text-stone-700">{s.installs.cardShown} saw the card · {s.installs.buttonClicks} tapped the button</p>
              <p className="font-['Inter'] text-sm text-stone-700">{s.installs.accepted} accepted · {s.installs.declined} declined · {s.installs.installed} installed</p>
            </div>
            <div className={card}>
              <p className={h3}>Premium payments</p>
              <p className="mt-2 font-['Inter'] text-sm text-stone-700">{s.payments.premiumPopupViews} saw the offer · {s.payments.started} started</p>
              <p className="font-['Inter'] text-sm text-stone-700">{s.payments.succeeded} paid · {s.payments.delayed} delayed · {s.payments.failed} failed</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
