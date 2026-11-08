import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import {
  ArrowLeft, ChevronDown, Search, X, Check, RotateCcw, ExternalLink, Lock, ArrowRight,
} from "lucide-react";
import SEO from "@/components/SEO";
import PaymentPopup from "@/components/PaymentPopup";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";
import { useGsapReveal } from "@/hooks/useGsapReveal";
import { PROMO_ACTIVE, PROMO_PRICE, REGULAR_PRICE } from "@/lib/promo";
import { CODING_TOPICS, TOTAL_PROBLEMS, FREE_COUNT, FREE_IDS, type Difficulty } from "./data";

const STORAGE_KEY = "cq_done_v1";

// Difficulty reads from shape and weight, not from a traffic-light palette.
const DIFF_STYLE: Record<Difficulty, string> = {
  Easy: "bg-[var(--color-paper-2)] text-[var(--color-ink)]",
  Medium: "bg-[var(--color-accent)] text-[var(--color-ink)]",
  Hard: "bg-[var(--color-ink)] text-[var(--color-paper)]",
};

type FilterDiff = "All" | Difficulty;
const DIFF_FILTERS: FilterDiff[] = ["All", "Easy", "Medium", "Hard"];

const BTN =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap px-6 py-3.5 text-[15px] font-semibold text-[var(--color-ink)] " +
  "shadow-[var(--shadow-offset)] transition-[transform,box-shadow] duration-[120ms] hover:translate-x-px hover:translate-y-px " +
  "hover:shadow-[3px_3px_0_var(--color-ink)] active:translate-x-1 active:translate-y-1 active:shadow-none " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-focus)]";

export default function CodingQuestionsPage() {
  const page = useRef<HTMLDivElement>(null);
  const { isSignedIn } = useAuth();
  const { isPremium, loading: premiumLoading } = usePremiumStatus();
  const [showPayment, setShowPayment] = useState(false);
  useGsapReveal(page);

  const unlocked = isPremium;
  const visibleTotal = unlocked ? TOTAL_PROBLEMS : FREE_COUNT;
  const price = PROMO_ACTIVE ? PROMO_PRICE : REGULAR_PRICE;

  const unlock = () => {
    if (!isSignedIn) {
      try { localStorage.setItem("auto_open_payment", "true"); } catch { /* ignore */ }
      window.location.href = "/login";
      return;
    }
    setShowPayment(true);
  };

  // ── Checked state, kept in this browser ──
  const [done, setDone] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  });
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...done])); } catch { /* ignore */ }
  }, [done]);
  const toggle = (id: string) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // ── Filters ──
  const [search, setSearch] = useState("");
  const [diffFilter, setDiffFilter] = useState<FilterDiff>("All");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggleSection = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const sections = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CODING_TOPICS.map((topic) => {
      const open = unlocked ? topic.problems : topic.problems.filter((p) => FREE_IDS.has(p.id));
      const shown = open.filter(
        (p) => (diffFilter === "All" || p.difficulty === diffFilter) && (!q || p.title.toLowerCase().includes(q)),
      );
      return { topic, shown, openCount: open.length, lockedCount: topic.problems.length - open.length };
    }).filter((s) => s.shown.length > 0 || (!search && diffFilter === "All"));
  }, [search, diffFilter, unlocked]);

  const visibleIds = useMemo(() => {
    const ids = new Set<string>();
    CODING_TOPICS.forEach((t) => t.problems.forEach((p) => { if (unlocked || FREE_IDS.has(p.id)) ids.add(p.id); }));
    return ids;
  }, [unlocked]);
  const totalDone = [...done].filter((id) => visibleIds.has(id)).length;
  const pct = Math.round((totalDone / visibleTotal) * 100);

  const handleReset = () => {
    if (window.confirm(`Reset all ${totalDone} checked items?`)) setDone(new Set());
  };

  return (
    <div ref={page} className="min-h-screen bg-[var(--color-paper)] font-sans text-[var(--color-ink)]">
      <SEO
        title="Infosys SP & DSE Coding Questions | Harry The Blaze"
        description="Coding questions collected from a survey of people who got Infosys SP and DSE roles. 50 free, the full set for Premium."
      />

      <div className="mx-auto max-w-[1100px] px-4 pb-24 pt-8 sm:px-8 sm:pt-12">
        <Link
          to="/dashboard"
          className="mb-10 inline-flex items-center gap-2 text-[15px] underline decoration-[var(--color-rule)] underline-offset-4 hover:decoration-[var(--color-ink)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Dashboard
        </Link>

        {/* ── Header ── */}
        <header>
          <p data-intro className="text-base font-medium text-[var(--color-muted)]">Infosys · SP and DSE roles</p>
          <h1
            data-intro
            className="mt-2 max-w-[16ch] font-display font-normal uppercase leading-[0.92] tracking-[0.005em]"
            style={{ fontSize: "clamp(3rem, 8vw, 6.5rem)" }}
          >
            The questions Infosys actually asked.
          </h1>
          <p data-intro className="mt-6 max-w-[62ch] text-lg leading-snug">
            These questions were collected from a large survey of people who got into the Infosys SP and DSE roles,
            with references for every one. The full set is for Premium members.
          </p>
        </header>

        {/* ── Numbers + offer ── */}
        <div data-reveal className="mt-10 grid gap-6 lg:grid-cols-12">
          <dl className="grid grid-cols-3 gap-px bg-[var(--color-ink)] lg:col-span-7">
            {[
              [String(TOTAL_PROBLEMS), "questions in the full set"],
              [String(CODING_TOPICS.length), "topics"],
              [String(FREE_COUNT), "free to open"],
            ].map(([n, l]) => (
              <div key={l} className="bg-[var(--color-paper-3)] p-5">
                <dt className="font-display text-5xl leading-none sm:text-6xl">{n}</dt>
                <dd className="mt-2 text-sm text-[var(--color-muted)]">{l}</dd>
              </div>
            ))}
          </dl>

          {!unlocked && !premiumLoading && (
            <div data-drop="1" className="bg-[var(--color-accent)] p-6 shadow-[var(--shadow-sheet)] lg:col-span-5">
              <p className="font-display text-4xl uppercase leading-none">Get all {TOTAL_PROBLEMS}</p>
              <p className="mt-3 flex items-baseline gap-3">
                <span className="font-display text-5xl leading-none tabular-nums">₹{price}</span>
                {PROMO_ACTIVE && <span className="text-lg line-through tabular-nums">₹{REGULAR_PRICE}</span>}
              </p>
              <p className="mt-2 text-[15px] leading-snug">
                Every section complete, plus the rest of Premium practice. One payment.
              </p>
              <button onClick={unlock} className={`${BTN} mt-5 w-full bg-[var(--color-ink)] !text-[var(--color-paper)] !shadow-[4px_4px_0_var(--color-paper)]`}>
                {isSignedIn ? "Unlock the full set" : "Sign up to unlock"}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          )}
        </div>

        {/* ── Progress ── */}
        <section data-reveal className="mt-10 bg-[var(--color-paper-3)] p-5 shadow-[var(--shadow-card)]" aria-label="Progress">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[15px] font-semibold">
              Your progress <span className="font-normal text-[var(--color-muted)]">· saved in this browser</span>
            </p>
            <div className="flex items-center gap-4 text-sm">
              <span className="tabular-nums">{totalDone}/{visibleTotal}</span>
              {totalDone > 0 && (
                <button onClick={handleReset} className="inline-flex items-center gap-1 underline decoration-[var(--color-rule)] underline-offset-4 hover:decoration-[var(--color-ink)]">
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset
                </button>
              )}
            </div>
          </div>
          <div className="mt-3 h-2.5 bg-[var(--color-paper-2)]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-[var(--color-accent)] transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </div>
        </section>

        {/* ── Filters ── */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" aria-hidden />
            <input
              type="text"
              aria-label="Search questions"
              placeholder="Search questions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-[1.5px] border-[var(--color-ink)] bg-[var(--color-paper-3)] py-2.5 pl-9 pr-9 text-[15px] placeholder:text-[var(--color-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            />
            {search && (
              <button onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-ink)]">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Difficulty">
            {DIFF_FILTERS.map((d) => (
              <button
                key={d}
                aria-pressed={diffFilter === d}
                onClick={() => setDiffFilter(d)}
                className={`px-4 py-2.5 text-sm font-semibold transition-[transform,box-shadow] duration-[120ms] ${
                  diffFilter === d
                    ? "bg-[var(--color-accent)] shadow-[3px_3px_0_var(--color-ink)]"
                    : "bg-[var(--color-paper-3)] shadow-[var(--shadow-card)] hover:-translate-y-0.5"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* ── Sections ── */}
        {sections.length === 0 ? (
          <div className="mt-12 py-12">
            <p className="font-display text-4xl uppercase leading-none">No questions found</p>
            <p className="mt-3 text-base">Try a different search or difficulty.</p>
          </div>
        ) : (
          <div data-reveal-group className="mt-8 flex flex-col gap-5">
            {sections.map(({ topic, shown, openCount, lockedCount }) => {
              const isOpen = !collapsed.has(topic.id);
              const doneHere = topic.problems.filter((p) => done.has(p.id) && visibleIds.has(p.id)).length;
              return (
                <section key={topic.id} className="bg-[var(--color-paper-3)] shadow-[var(--shadow-sheet)]">
                  <button
                    onClick={() => toggleSection(topic.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[var(--color-focus)] sm:p-6"
                  >
                    <div className="min-w-0">
                      <h2 className="font-display text-3xl font-normal uppercase leading-none sm:text-4xl">{topic.title}</h2>
                      <p className="mt-2 text-sm text-[var(--color-muted)]">
                        <span className="tabular-nums">{doneHere}/{openCount}</span> done
                        {lockedCount > 0 && <> · <span className="tabular-nums">{lockedCount}</span> more in the full set</>}
                      </p>
                    </div>
                    <ChevronDown className={`h-5 w-5 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden />
                  </button>

                  {isOpen && (
                    <div className="border-t-2 border-[var(--color-ink)]">
                      <ul>
                        {shown.map((p, idx) => {
                          const checked = done.has(p.id);
                          return (
                            <li key={p.id} className="flex items-center gap-3 border-b border-[var(--color-rule)] pr-3 last:border-b-0 sm:pr-5">
                              <button
                                onClick={() => toggle(p.id)}
                                aria-pressed={checked}
                                className="flex min-w-0 flex-1 items-center gap-3 py-3.5 pl-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--color-focus)] sm:pl-6"
                              >
                                <span
                                  aria-hidden
                                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center border-2 border-[var(--color-ink)] ${checked ? "bg-[var(--color-accent)]" : "bg-transparent"}`}
                                >
                                  {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                                </span>
                                <span className="w-6 flex-shrink-0 text-right text-xs tabular-nums text-[var(--color-muted)]">{idx + 1}</span>
                                <span className={`min-w-0 flex-1 text-[15px] ${checked ? "text-[var(--color-muted)] line-through" : "font-medium"}`}>
                                  {p.title}
                                </span>
                              </button>
                              {p.link && (
                                <a
                                  href={p.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label={`Open ${p.title}`}
                                  className="flex-shrink-0 p-1.5 hover:bg-[var(--color-paper-2)]"
                                >
                                  <ExternalLink className="h-4 w-4" aria-hidden />
                                </a>
                              )}
                              <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-semibold ${DIFF_STYLE[p.difficulty]}`}>{p.difficulty}</span>
                            </li>
                          );
                        })}
                      </ul>

                      {lockedCount > 0 && !search && diffFilter === "All" && (
                        <button
                          onClick={unlock}
                          className="group relative block w-full overflow-hidden border-t-2 border-[var(--color-ink)] bg-[var(--color-paper-2)] p-5 text-left sm:px-6"
                        >
                          <span aria-hidden className="pointer-events-none block select-none space-y-2.5 opacity-40 blur-[3px]">
                            {[72, 58, 66].slice(0, Math.min(3, lockedCount)).map((w, i) => (
                              <span key={i} className="flex items-center gap-3">
                                <span className="h-5 w-5 border-2 border-[var(--color-ink)]" />
                                <span className="h-3 bg-[var(--color-ink)]" style={{ width: `${w}%` }} />
                              </span>
                            ))}
                          </span>
                          <span className="mt-4 flex items-center justify-between gap-3 text-[15px] font-semibold">
                            <span className="inline-flex items-center gap-2">
                              <Lock className="h-4 w-4" aria-hidden />
                              {lockedCount} more {topic.title} {lockedCount === 1 ? "question" : "questions"} in the full set
                            </span>
                            <span className="inline-flex items-center gap-1 underline decoration-[var(--color-ink)] underline-offset-4">
                              Unlock <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                            </span>
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {/* ── Closing offer ── */}
        {!unlocked && !premiumLoading && (
          <section data-reveal className="mt-16 bg-[var(--color-ink)] p-8 text-[var(--color-paper)] sm:p-12">
            <h2 className="max-w-[18ch] font-display text-[clamp(2.5rem,6vw,4.75rem)] font-normal uppercase leading-[0.95]">
              You have seen {FREE_COUNT}. There are {TOTAL_PROBLEMS - FREE_COUNT} more.
            </h2>
            <p className="mt-5 max-w-[52ch] text-lg leading-snug opacity-85">
              The full set covers every topic the survey flagged, from first-round basics to the harder graph and DP
              questions. It comes with the rest of Premium practice.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <button onClick={unlock} className={`${BTN} bg-[var(--color-accent)] !shadow-[4px_4px_0_var(--color-paper)] active:!shadow-none`}>
                {isSignedIn ? `Unlock all ${TOTAL_PROBLEMS} for ₹${price}` : "Sign up to unlock"}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
              {PROMO_ACTIVE && <span className="text-base opacity-80">Launch price. Regular price is ₹{REGULAR_PRICE}.</span>}
            </div>
          </section>
        )}
      </div>

      <PaymentPopup isOpen={showPayment} onClose={() => setShowPayment(false)} />
    </div>
  );
}
