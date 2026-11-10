import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, ExternalLink, MapPin, Share2, Check, Briefcase, IndianRupee, Clock, Link2, Linkedin, MessageCircle, FileText, Radar, Gamepad2, Sparkles } from "lucide-react";
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
  created_at?: string | null;
};

type Related = { id: string; title: string; company: string | null; location: string | null; package_lpa: number | null; code: string | null };

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
  const [related, setRelated] = useState<Related[]>([]);

  useEffect(() => {
    (supabase as any)
      .from("jobs")
      .select("id,title,company,location,package_lpa,code")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(7)
      .then(({ data }: { data: Related[] | null }) => setRelated(data ?? []));
  }, []);

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
      .select("title,company,type,location,description,apply_url,package_lpa,skills_required,code,created_at")
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

      <main className={`flex-1 mx-auto w-full px-4 py-8 ${state === "found" ? "max-w-5xl pb-28 lg:pb-12" : "max-w-xl"}`}>
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

        {state === "found" && job && <JobView job={job} related={related.filter((r) => (r.code ?? r.id) !== (job.code ?? code)).slice(0, 3)} share={share} copied={copied} />}
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


const card = { background: SHEET, border: `2px solid ${INK}`, borderBottomWidth: 5, borderRightWidth: 5 } as const;
const applyBtn = { background: ACCENT, border: `2px solid ${INK}`, borderBottomWidth: 5, borderRightWidth: 5 } as const;

function postedAgo(iso?: string | null) {
  if (!iso) return null;
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return "Posted today";
  if (d === 1) return "Posted yesterday";
  if (d < 30) return `Posted ${d} days ago`;
  return `Posted ${Math.floor(d / 30)} mo ago`;
}

/** Break a paragraph into readable bullet points (one per sentence). */
function toPoints(text: string) {
  return text
    .split(/\n+|(?<=[.!?])\s+(?=[A-Z])/)
    .map((t) => t.trim().replace(/^[-•*]\s*/, ""))
    .filter((t) => t.length > 3);
}

function JobView({ job, related, share, copied }: { job: Opportunity; related: Related[]; share: () => void; copied: boolean }) {
  const points = job.description ? toPoints(job.description) : [];
  const ago = postedAgo(job.created_at);
  const url = typeof window !== "undefined" ? window.location.href : "";
  const text = encodeURIComponent(`${job.title}${job.company ? ` at ${job.company}` : ""} — apply here: `);
  const facts = [
    { icon: Briefcase, label: "Job type", value: job.type },
    job.package_lpa ? { icon: IndianRupee, label: "Package", value: `₹${job.package_lpa} LPA` } : null,
    job.location ? { icon: MapPin, label: "Location", value: job.location } : null,
    ago ? { icon: Clock, label: "Status", value: ago } : null,
  ].filter(Boolean) as { icon: any; label: string; value: string }[];

  const ApplyButton = ({ className = "" }: { className?: string }) =>
    job.apply_url ? (
      <a href={job.apply_url} target="_blank" rel="noopener noreferrer"
        className={`flex items-center justify-center gap-2 py-4 font-extrabold uppercase tracking-wide text-[15px] ${className}`} style={applyBtn}>
        Apply now <ExternalLink size={16} aria-hidden />
      </a>
    ) : null;

  return (
    <>
      {/* Hero */}
      <section style={card} className="p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-16 h-16 flex items-center justify-center text-3xl uppercase"
            style={{ background: INK, color: ACCENT, fontFamily: DISPLAY }} aria-hidden>
            {(job.company || job.title).charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[.16em]" style={{ color: ACCENT }}>
              Now hiring{ago ? ` · ${ago.replace("Posted ", "")}` : ""}
            </p>
            <h1 className="mt-1 uppercase text-4xl sm:text-5xl leading-[1.05]" style={{ fontFamily: DISPLAY }}>{job.title}</h1>
            {job.company && <p className="mt-2 text-lg font-bold">{job.company}</p>}
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {facts.map(({ icon: Icon, label, value }) => (
            <div key={label} className="p-3 bg-white" style={{ border: `1.5px solid ${INK}` }}>
              <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.14em]" style={{ color: MUTED }}>
                <Icon size={12} aria-hidden /> {label}
              </dt>
              <dd className="mt-1 text-sm font-bold leading-snug">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-6 grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="space-y-6">
          {/* About */}
          {points.length > 0 && (
            <section style={card} className="p-6 sm:p-8">
              <h2 className="uppercase text-2xl" style={{ fontFamily: DISPLAY }}>About the role</h2>
              <ul className="mt-4 space-y-3">
                {points.map((t, i) => (
                  <li key={i} className="flex gap-3 text-[15px] leading-relaxed" style={{ color: "#3d3630" }}>
                    <span className="mt-2 shrink-0 w-2 h-2" style={{ background: ACCENT }} aria-hidden />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Skills */}
          {!!job.skills_required?.length && (
            <section style={card} className="p-6 sm:p-8">
              <h2 className="uppercase text-2xl" style={{ fontFamily: DISPLAY }}>Skills they look for</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {job.skills_required.map((sk) => (
                  <span key={sk} className="px-3 py-1.5 text-sm font-semibold bg-white" style={{ border: `1.5px solid ${INK}` }}>{sk}</span>
                ))}
              </div>
            </section>
          )}

          {/* How to apply */}
          <section style={card} className="p-6 sm:p-8">
            <h2 className="uppercase text-2xl" style={{ fontFamily: DISPLAY }}>How to apply</h2>
            <ol className="mt-4 space-y-4">
              {[
                ["Get your resume ready", "Tailor it to this role — keep it to one page and lead with the skills listed above."],
                ["Click Apply now", `You'll be taken to ${job.company ? `${job.company}'s` : "the official"} application page to submit.`],
                ["Prepare while you wait", "Practice aptitude and communication rounds so you're ready when the call comes."],
              ].map(([h, d], i) => (
                <li key={h} className="flex gap-4">
                  <span className="shrink-0 w-9 h-9 flex items-center justify-center text-lg" style={{ background: INK, color: "#fff", fontFamily: DISPLAY }}>{i + 1}</span>
                  <div>
                    <p className="font-bold">{h}</p>
                    <p className="text-sm mt-0.5" style={{ color: MUTED }}>{d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <ApplyButton className="mt-6 w-full sm:w-auto sm:px-10" />
          </section>

          {/* Prep tools */}
          <section>
            <h2 className="uppercase text-2xl mb-3 flex items-center gap-2" style={{ fontFamily: DISPLAY }}>
              <Sparkles size={20} style={{ color: ACCENT }} aria-hidden /> Get ready with Harry The Blaze
            </h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { to: "/dashboard", icon: Gamepad2, h: "Practice rounds", d: "MNC-style aptitude & communication simulations" },
                { to: "/forge", icon: FileText, h: "Resume Forge", d: "AI-built, ATS-friendly resume in minutes" },
                { to: "/radar", icon: Radar, h: "Job Radar", d: "More openings matched to your skills" },
              ].map(({ to, icon: Icon, h, d }) => (
                <Link key={to} to={to} className="p-4 bg-white hover:-translate-y-0.5 transition-transform" style={{ border: `2px solid ${INK}` }}>
                  <Icon size={22} style={{ color: ACCENT }} aria-hidden />
                  <p className="mt-2 font-extrabold uppercase text-sm">{h}</p>
                  <p className="mt-1 text-xs leading-snug" style={{ color: MUTED }}>{d}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-6">
          <div style={card} className="p-5">
            <p className="font-extrabold uppercase text-sm">Interested?</p>
            <p className="text-xs mt-1" style={{ color: MUTED }}>Applications open on the company's official page.</p>
            <ApplyButton className="mt-4 w-full" />
            <p className="mt-5 text-[11px] font-bold uppercase tracking-[.14em]" style={{ color: MUTED }}>Share with friends</p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              <a href={`https://wa.me/?text=${text}${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp"
                className="py-2.5 flex justify-center bg-white" style={{ border: `1.5px solid ${INK}` }}><MessageCircle size={18} /></a>
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn"
                className="py-2.5 flex justify-center bg-white" style={{ border: `1.5px solid ${INK}` }}><Linkedin size={18} /></a>
              <button onClick={share} aria-label="Copy link" className="py-2.5 flex justify-center bg-white" style={{ border: `1.5px solid ${INK}` }}>
                {copied ? <Check size={18} /> : <Link2 size={18} />}
              </button>
              <button onClick={share} aria-label="Share" className="py-2.5 flex justify-center bg-white" style={{ border: `1.5px solid ${INK}` }}><Share2 size={18} /></button>
            </div>
          </div>

          {related.length > 0 && (
            <div style={card} className="p-5">
              <p className="font-extrabold uppercase text-sm">More openings</p>
              <ul className="mt-3 divide-y" style={{ borderColor: "#e5dfd2" }}>
                {related.map((r) => (
                  <li key={r.id}>
                    <Link to={`/placement/${r.code || r.id}`} className="block py-3 group">
                      <p className="text-sm font-bold leading-snug group-hover:underline">{r.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                        {[r.company, r.location, r.package_lpa ? `₹${r.package_lpa} LPA` : null].filter(Boolean).join(" · ")}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

      {/* Mobile sticky apply bar */}
      {job.apply_url && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-20 p-3" style={{ background: SHEET, borderTop: `2px solid ${INK}` }}>
          <ApplyButton className="w-full py-3.5" />
        </div>
      )}
    </>
  );
}
