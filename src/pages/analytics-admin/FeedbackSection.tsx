import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Mail, Phone, RefreshCw } from "lucide-react";
import { getAdminSecret } from "@/lib/admin-auth";
import { parseFeedback, tallyFeatures, type FeedbackKind, type FeedbackRow } from "./feedback-parse";

type Filter = "all" | FeedbackKind;
const PAGE = 20;

const card = "rounded-xl border border-stone-200 bg-white p-4 shadow-sm";
const h3 = "font-['Inter'] text-[11px] font-semibold uppercase tracking-widest text-stone-400";

const KIND_LABEL: Record<FeedbackKind, string> = { feature: "Feature request", feedback: "Feedback", survey: "Prep survey" };
const KIND_STYLE: Record<FeedbackKind, string> = {
  feature: "bg-amber-50 text-amber-800 border-amber-200",
  feedback: "bg-sky-50 text-sky-800 border-sky-200",
  survey: "bg-stone-100 text-stone-700 border-stone-200",
};

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

export default function FeedbackSection() {
  const [rows, setRows] = useState<FeedbackRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [shown, setShown] = useState(PAGE);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-feedback`, {
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
      setRows(body.rows as FeedbackRow[]);
      setTotal(body.total as number);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load feedback");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const parsed = useMemo(() => (rows ?? []).map((r) => ({ r, p: parseFeedback(r) })), [rows]);
  const counts = useMemo(() => ({
    all: parsed.length,
    feature: parsed.filter((x) => x.p.kind === "feature").length,
    feedback: parsed.filter((x) => x.p.kind === "feedback").length,
    survey: parsed.filter((x) => x.p.kind === "survey").length,
  }), [parsed]);
  const tally = useMemo(() => tallyFeatures(rows ?? []), [rows]);
  const visible = parsed.filter((x) => filter === "all" || x.p.kind === filter);

  const tabs: Array<[Filter, string]> = [["all", "All"], ["feature", "Feature requests"], ["feedback", "Feedback"], ["survey", "Prep surveys"]];

  return (
    <div className="space-y-4 border-t border-stone-200 pt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-['Merriweather'] text-xl font-bold text-stone-900">Feedback and feature requests</h2>
          <p className="font-['Inter'] text-xs text-stone-500">
            {rows ? `${total.toLocaleString("en-IN")} submissions · newest first${total > rows.length ? ` · showing the latest ${rows.length}` : ""}` : "Loading…"}
          </p>
        </div>
        <button onClick={load} disabled={loading} aria-label="Refresh feedback"
          className="rounded-lg border border-stone-200 bg-white p-2 text-stone-600 hover:bg-stone-50 disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 font-['Inter'] text-sm text-red-700">{error}</div>}

      {tally.length > 0 && (
        <div className={card}>
          <p className={`${h3} mb-3`}>Most requested features</p>
          <div className="space-y-2">
            {tally.slice(0, 10).map((t) => (
              <div key={t.feature}>
                <div className="flex justify-between font-['Inter'] text-[13px]">
                  <span className="text-stone-700">{t.feature}</span>
                  <b className="text-stone-900">{t.count}</b>
                </div>
                <div className="mt-1 h-2 rounded bg-stone-100">
                  <div className="h-2 rounded bg-amber-600" style={{ width: `${(100 * t.count) / tally[0].count}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {rows && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {tabs.map(([key, label]) => (
              <button key={key} onClick={() => { setFilter(key); setShown(PAGE); }}
                className={`rounded-full border px-3 py-1 font-['Inter'] text-xs font-semibold transition-all ${filter === key ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"}`}>
                {label} <span className="opacity-60">{counts[key]}</span>
              </button>
            ))}
          </div>

          {!visible.length && (
            <div className={`${card} text-center font-['Inter'] text-sm text-stone-500`}>
              {rows.length ? "Nothing in this filter yet." : "No feedback yet. Submissions from the “Request a feature” and survey forms will appear here."}
            </div>
          )}

          <div className="space-y-3">
            {visible.slice(0, shown).map(({ r, p }) => (
              <article key={r.id} className={card}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 font-['Inter'] text-[11px] font-bold uppercase tracking-wider ${KIND_STYLE[p.kind]}`}>{KIND_LABEL[p.kind]}</span>
                  <span className="font-['Inter'] text-sm font-semibold text-stone-900">{r.name || "Anonymous"}</span>
                  {r.college && r.college !== "N/A" && <span className="font-['Inter'] text-xs text-stone-500">· {r.college}</span>}
                  {r.graduating_year && <span className="font-['Inter'] text-xs text-stone-500">· {r.graduating_year}</span>}
                  <span className="ml-auto font-['Inter'] text-xs text-stone-400">{when(r.created_at)}</span>
                </div>

                {p.features.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.features.map((f) => <span key={f} className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 font-['Inter'] text-xs text-amber-900">{f}</span>)}
                  </div>
                )}
                {p.otherFeature && <p className="mt-3 whitespace-pre-wrap font-['Inter'] text-sm text-stone-800"><b className="text-stone-500">Wants:</b> {p.otherFeature}</p>}
                {p.message && <p className="mt-2 whitespace-pre-wrap font-['Inter'] text-sm text-stone-800">{p.kind === "feature" && <b className="text-stone-500">Feedback: </b>}{p.message}</p>}

                {p.kind === "survey" && (
                  <dl className="mt-3 grid gap-x-6 gap-y-1 font-['Inter'] text-sm sm:grid-cols-2">
                    {r.target_company && <div><dt className="inline text-stone-500">Preparing for: </dt><dd className="inline text-stone-900">{r.target_company}</dd></div>}
                    {p.rounds.length > 0 && <div><dt className="inline text-stone-500">Rounds: </dt><dd className="inline text-stone-900">{p.rounds.join(", ")}</dd></div>}
                    {r.placement_type && <div><dt className="inline text-stone-500">Placement: </dt><dd className="inline text-stone-900">{r.placement_type}</dd></div>}
                    {r.help_needed && <div className="sm:col-span-2"><dt className="inline text-stone-500">Wants help with: </dt><dd className="inline text-stone-900">{r.help_needed}</dd></div>}
                  </dl>
                )}

                {(r.mobile_number || p.notifyEmail) && (
                  <div className="mt-3 flex flex-wrap gap-4 font-['Inter'] text-xs">
                    {r.mobile_number && <a href={`tel:${r.mobile_number}`} className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-900"><Phone className="h-3.5 w-3.5" />{r.mobile_number}</a>}
                    {p.notifyEmail && <a href={`mailto:${p.notifyEmail}`} className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-900"><Mail className="h-3.5 w-3.5" />{p.notifyEmail} <span className="text-stone-400">(wants to hear when it ships)</span></a>}
                  </div>
                )}
              </article>
            ))}
          </div>

          {visible.length > shown && (
            <button onClick={() => setShown((n) => n + PAGE)}
              className="w-full rounded-lg border border-stone-200 bg-white py-2.5 font-['Inter'] text-sm font-semibold text-stone-700 hover:bg-stone-50">
              Show {Math.min(PAGE, visible.length - shown)} more
            </button>
          )}
        </>
      )}
    </div>
  );
}
