import { useCallback, useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Loader2, RefreshCw } from "lucide-react";
import { getAdminSecret } from "@/lib/admin-auth";

interface Coupon {
  code: string;
  count: number;
  firstUsed: string;
  lastUsed: string;
  variants: string[];
}
interface Result { totalRedemptions: number; rows: number; truncated: boolean; coupons: Coupon[] }

const card = "rounded-xl border border-stone-200 bg-white p-4 shadow-sm";
const h3 = "font-['Inter'] text-[11px] font-semibold uppercase tracking-widest text-stone-400";
const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function PaymentsSection() {
  const [data, setData] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-coupons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          "x-admin-key": getAdminSecret(),
        },
        body: "{}",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(res.status === 401 ? "Admin session expired. Log out and log in again." : body?.error || `Request failed (${res.status})`);
      setData(body as Result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load coupon stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-['Merriweather'] text-xl font-bold text-stone-900">Coupon usage</h2>
          <p className="font-['Inter'] text-xs text-stone-500">
            All time. Upper and lower case count as the same coupon.
            {data?.truncated && " Showing the oldest part only."}
          </p>
        </div>
        <button onClick={load} disabled={loading} aria-label="Refresh"
          className="rounded-lg border border-stone-200 bg-white p-2 text-stone-600 hover:bg-stone-50 disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 font-['Inter'] text-sm text-red-700">{error}</div>}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className={card}>
              <p className={h3}>Total redemptions</p>
              <p className="mt-1 font-['Merriweather'] text-3xl font-bold text-stone-900">{data.totalRedemptions.toLocaleString("en-IN")}</p>
            </div>
            <div className={card}>
              <p className={h3}>Different coupons</p>
              <p className="mt-1 font-['Merriweather'] text-3xl font-bold text-stone-900">{data.coupons.length}</p>
            </div>
            <div className={`${card} col-span-2 sm:col-span-1`}>
              <p className={h3}>Most used</p>
              <p className="mt-1 truncate font-['Merriweather'] text-xl font-bold text-stone-900">{data.coupons[0]?.code ?? "—"}</p>
              {data.coupons[0] && <p className="font-['Inter'] text-xs text-stone-500">{data.coupons[0].count} redemptions</p>}
            </div>
          </div>

          {data.coupons.length === 0 ? (
            <div className={`${card} text-center font-['Inter'] text-sm text-stone-500`}>No coupons used yet.</div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.coupons.map((c) => (
                  <div key={c.code} className={card}>
                    <p className="truncate font-['Inter'] text-sm font-semibold text-stone-900" title={c.code}>{c.code}</p>
                    <p className="mt-1 font-['Merriweather'] text-2xl font-bold text-stone-900">{c.count}</p>
                    <p className="font-['Inter'] text-xs text-stone-500">redemptions · last used {day(c.lastUsed)}</p>
                    {c.variants.length > 1 && (
                      <p className="mt-2 font-['Inter'] text-[11px] text-stone-400">Merged from: {c.variants.join(", ")}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className={card}>
                <p className={h3}>Redemptions by coupon</p>
                <div className="mt-3 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.coupons} margin={{ left: -18, right: 8, top: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                      <XAxis dataKey="code" tick={{ fontSize: 11, fill: "#78716c" }} interval={0} angle={-20} textAnchor="end" height={60} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#78716c" }} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Bar dataKey="count" name="Redemptions" fill="#d97706" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
