import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, ExternalLink, MapPin, Share2, Check } from "lucide-react";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";

type Opportunity = {
  title: string;
  company: string | null;
  type: string;
  location: string | null;
  description: string | null;
  apply_url: string | null;
  package_lpa: number | null;
  skills_required: string[] | null;
  code: string | null;
};

const INK = "#1a1613";
const PAPER = "#f7f4ec";
const SHEET = "#fffdf8";
const ACCENT = "#f4592a";
const MUTED = "#6b625a";
const DISPLAY = "Anton, Impact, sans-serif";

const clean = (v: string) => v.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");

/** Public, no sign-in. /placement shows a code box; /placement/:code shows that opportunity. */
export default function PlacementPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [job, setJob] = useState<Opportunity | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "found" | "missing">("idle");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!code) {
      setState("idle");
      setJob(null);
      return;
    }
    let cancelled = false;
    setState("loading");
    const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code);
    const q = (supabase as any)
      .from("jobs")
      .select("title,company,type,location,description,apply_url,package_lpa,skills_required,code")
      .eq("active", true);
    (isId ? q.eq("id", code) : q.ilike("code", clean(code)))
      .maybeSingle()
      .then(({ data }: { data: Opportunity | null }) => {
        if (cancelled) return;
        setJob(data);
        setState(data ? "found" : "missing");
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    const c = clean(input);
    if (c) navigate(`/placement/${c}`);
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: job?.title, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const title = job ? `${job.title}${job.company ? ` at ${job.company}` : ""}` : "Placement opportunity";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: PAPER, color: INK, fontFamily: "Inter, sans-serif" }}>
      <SEO title={`${title} | Harry The Blaze`} description={job?.description?.slice(0, 150) || "Placement opportunity shared by Harry The Blaze"} />

      <header style={{ background: INK }} className="px-5 py-4">
        <Link to="/" className="text-white uppercase tracking-wider text-xl" style={{ fontFamily: DISPLAY }}>
          <span style={{ color: ACCENT }}>●</span>&nbsp; Harry The Blaze
        </Link>
      </header>
      <div style={{ background: ACCENT, height: 6 }} />

      <main className="flex-1 mx-auto w-full max-w-xl px-4 py-8">
        {state === "loading" && <p style={{ color: MUTED }}>Loading…</p>}

        {(state === "idle" || state === "missing") && (
          <div>
            <h1 className="uppercase text-4xl leading-tight" style={{ fontFamily: DISPLAY }}>
              {state === "missing" ? "Code not found" : "Enter placement code"}
            </h1>
            <p className="mt-3 text-[15px]" style={{ color: MUTED }}>
              {state === "missing"
                ? `We couldn't find "${code}". It may have closed, or the code has a typo.`
                : "Type the code from the message you received to open that opportunity."}
            </p>
            <form onSubmit={go} className="mt-6 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. tcs-nov26"
                aria-label="Placement code"
                className="flex-1 px-4 py-3 text-[15px] bg-white outline-none"
                style={{ border: `2px solid ${INK}` }}
              />
              <button type="submit" className="px-5 font-extrabold uppercase text-sm" style={{ background: ACCENT, border: `2px solid ${INK}` }}>
                Open
              </button>
            </form>
          </div>
        )}

        {state === "found" && job && (
          <article style={{ background: SHEET, border: `2px solid ${INK}`, borderBottomWidth: 6, borderRightWidth: 6 }} className="p-6">
            <p className="text-[11px] font-bold uppercase tracking-[.16em]" style={{ color: MUTED }}>
              {job.type}
              {job.package_lpa ? ` · ₹${job.package_lpa} LPA` : ""}
            </p>
            <h1 className="mt-2 uppercase text-4xl leading-tight" style={{ fontFamily: DISPLAY }}>
              {job.title}
            </h1>
            {job.company && <p className="mt-1 text-lg font-bold">{job.company}</p>}
            {job.location && (
              <p className="mt-1 flex items-center gap-1 text-sm" style={{ color: MUTED }}>
                <MapPin size={14} aria-hidden /> {job.location}
              </p>
            )}

            {job.description && (
              <p className="mt-5 whitespace-pre-line text-[15px] leading-relaxed" style={{ color: "#3d3630" }}>
                {job.description}
              </p>
            )}

            {!!job.skills_required?.length && (
              <div className="mt-5 flex flex-wrap gap-2">
                {job.skills_required.map((s) => (
                  <span key={s} className="px-2.5 py-1 text-xs font-semibold bg-white" style={{ border: `1px solid ${INK}` }}>
                    {s}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-7 flex gap-2">
              {job.apply_url && (
                <a
                  href={job.apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-4 font-extrabold uppercase tracking-wide text-[15px]"
                  style={{ background: ACCENT, border: `2px solid ${INK}`, borderBottomWidth: 5, borderRightWidth: 5 }}
                >
                  Apply now <ExternalLink size={16} aria-hidden />
                </a>
              )}
              <button
                onClick={share}
                aria-label="Share this opportunity"
                className="px-4 bg-white"
                style={{ border: `2px solid ${INK}` }}
              >
                {copied ? <Check size={18} /> : <Share2 size={18} />}
              </button>
            </div>
          </article>
        )}
      </main>

      {/* Site ad strip */}
      <footer style={{ background: INK }} className="px-5 py-6">
        <div className="mx-auto max-w-xl flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <p className="text-white text-[15px] leading-snug">
            <span className="uppercase text-xl block" style={{ fontFamily: DISPLAY }}>
              Interview coming up?
            </span>
            <span style={{ color: "#bdb4a8" }}>Practice the cognitive and communication rounds, then talk to someone who just got placed.</span>
          </p>
          <Link
            to="/"
            className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 font-extrabold uppercase text-sm"
            style={{ background: ACCENT, color: INK }}
          >
            Try Harry The Blaze <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </footer>
    </div>
  );
}
