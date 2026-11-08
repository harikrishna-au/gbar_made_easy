import { useState, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { ArrowLeft, Search, X, Check, RotateCcw, ExternalLink, Lock, ArrowRight } from "lucide-react";
import SEO from "@/components/SEO";
import PaymentPopup from "@/components/PaymentPopup";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";
import { useCodingProgress } from "@/hooks/useCodingProgress";
import { useGsapReveal } from "@/hooks/useGsapReveal";
import { PROMO_ACTIVE, PROMO_PRICE, REGULAR_PRICE } from "@/lib/promo";
import { CODING_TOPICS, TOTAL_PROBLEMS, FREE_COUNT, FREE_IDS, type Difficulty } from "./data";

// Difficulty reads from shape and weight, not from a traffic-light palette.
const DIFF_STYLE: Record<Difficulty, string> = {
  Easy: "bg-[var(--color-paper-2)] text-[var(--color-ink)]",
  Medium: "bg-[var(--color-accent)] text-[var(--color-ink)]",
  Hard: "bg-[var(--color-ink)] text-[var(--color-paper)]",
};

type FilterDiff = "All" | Difficulty;
const DIFF_FILTERS: FilterDiff[] = ["All", "Easy", "Medium", "Hard"];

const BTN =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap px-5 py-3 text-[15px] font-semibold text-[var(--color-ink)] " +
  "shadow-[var(--shadow-offset)] transition-[transform,box-shadow] duration-[120ms] hover:translate-x-px hover:translate-y-px " +
  "hover:shadow-[3px_3px_0_var(--color-ink)] active:translate-x-1 active:translate-y-1 active:shadow-none " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-focus)]";

export default function CodingQuestionsPage() {
  const page = useRef<HTMLDivElement>(null);
  const { isSignedIn } = useAuth();
  const { isPremium, loading: premiumLoading } = usePremiumStatus();
  const { done, toggle, reset, signedIn } = useCodingProgress();
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

  const [active, setActive] = useState(CODING_TOPICS[0].id);
  const [search, setSearch] = useState("");
  const [diffFilter, setDiffFilter] = useState<FilterDiff>("All");

  const canSee = (id: string) => unlocked || FREE_IDS.has(id);

  const stats = useMemo(
    () =>
      CODING_TOPICS.map((t) => {
        const open = t.problems.filter((p) => canSee(p.id));
        return { id: t.id, openCount: open.length, doneCount: open.filter((p) => done.has(p.id)).length };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [done, unlocked],
  );
  const statOf = (id: string) => stats.find((s) => s.id === id)!;
  const totalDone = stats.reduce((n, s) => n + s.doneCount, 0);
  const pct = Math.round((totalDone / visibleTotal) * 100);

  const topic = CODING_TOPICS.find((t) => t.id === active)!;
  const q = search.trim().toLowerCase();
  const matches = (title: string, d: Difficulty) =>
    (diffFilter === "All" || d === diffFilter) && (!q || title.toLowerCase().includes(q));

  // Searching looks across every topic; otherwise one topic at a time.
  const rows = useMemo(() => {
    const pool = q ? CODING_TOPICS : [topic];
    return pool.flatMap((t) =>
      t.problems.filter((p) => canSee(p.id) && matches(p.title, p.difficulty)).map((p) => ({ p, topic: t })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, diffFilter, topic, unlocked]);
  const lockedInTopic = topic.problems.length - statOf(topic.id).openCount;

  const handleReset = () => {
    const ids = [...done].filter(canSee);
    if (window.confirm(`Reset all ${ids.length} checked items?`)) reset(ids);
  };

  return (
    <div ref={page} className="min-h-screen bg-[var(--color-paper)] font-sans text-[var(--color-ink)]">
      <SEO
        title="Infosys SP & DSE Coding Questions | Harry The Blaze"
        description="Coding questions collected from a survey of people who got Infosys SP and DSE roles. 50 free, the full set for Premium."
      />

      <div className="mx-auto max-w-[1180px] px-4 pb-16 pt-6 sm:px-8 sm:pt-8">
        <Link
          to="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-[15px] underline decoration-[var(--color-rule)] underline-offset-4 hover:decoration-[var(--color-ink)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Dashboard
        </Link>

        {/* ── Header: title + offer side by side ── */}
        <header className="grid items-end gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <h1
              data-intro
              className="font-display font-normal uppercase leading-[0.95] tracking-[0.005em]"
              style={{ fontSize: "clamp(2.5rem, 5.5vw, 4.5rem)" }}
            >
              The questions Infosys actually asked
            </h1>
            <p data-intro className="mt-4 max-w-[60ch] text-base leading-snug sm:text-lg">
              These questions were collected from a large survey of people who got into the Infosys SP and DSE roles,
              with references for every one. The full set is for Premium members.
            </p>
          </div>

          {!unlocked && !premiumLoading && (
            <div data-intro className="flex items-center justify-between gap-4 bg-[var(--color-accent)] p-4 shadow-[var(--shadow-sheet)] lg:col-span-4 lg:flex-col lg:items-stretch">
              <div>
                <p className="font-display text-2xl uppercase leading-none">All {TOTAL_PROBLEMS} questions</p>
                <p className="mt-1 flex items-baseline gap-2">
                  <span className="font-display text-3xl leading-none tabular-nums">₹{price}</span>
                  {PROMO_ACTIVE && <span className="text-sm line-through tabular-nums">₹{REGULAR_PRICE}</span>}
                </p>
              </div>
              <button onClick={unlock} className={`${BTN} bg-[var(--color-ink)] !text-[var(--color-paper)] !shadow-[3px_3px_0_var(--color-paper)]`}>
                {isSignedIn ? "Unlock" : "Sign up to unlock"}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          )}
        </header>

        {/* ── Progress strip ── */}
        <div data-intro className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <span className="tabular-nums">
            <b className="font-semibold">{totalDone}</b> of {visibleTotal} done
          </span>
          <div className="h-2 min-w-[140px] flex-1 bg-[var(--color-paper-2)]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progress">
            <div className="h-full bg-[var(--color-accent)] transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[var(--color-muted)]">
            {signedIn ? "Saved to your account" : <Link to="/login" className="underline underline-offset-4">Sign in to save progress</Link>}
          </span>
          {totalDone > 0 && (
            <button onClick={handleReset} className="inline-flex items-center gap-1 underline decoration-[var(--color-rule)] underline-offset-4 hover:decoration-[var(--color-ink)]">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset
            </button>
          )}
        </div>

        {/* ── Search + difficulty ── */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" aria-hidden />
            <input
              type="text"
              aria-label="Search all questions"
              placeholder="Search all questions…"
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
          <div className="flex gap-2" role="group" aria-label="Difficulty">
            {DIFF_FILTERS.map((d) => (
              <button
                key={d}
                aria-pressed={diffFilter === d}
                onClick={() => setDiffFilter(d)}
                className={`px-3.5 py-2.5 text-sm font-semibold transition-[transform,box-shadow] duration-[120ms] ${
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

        {/* ── Topics + questions ── */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
          {/* Topic picker: chips on small screens, sticky list on large */}
          <nav aria-label="Topics" className="lg:sticky lg:top-6 lg:self-start">
            <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] lg:mx-0 lg:block lg:space-y-1 lg:overflow-visible lg:px-0 lg:pb-0">
              {CODING_TOPICS.map((t) => {
                const s = statOf(t.id);
                const on = !q && t.id === active;
                return (
                  <li key={t.id} className="flex-shrink-0">
                    <button
                      onClick={() => { setActive(t.id); setSearch(""); }}
                      aria-current={on ? "true" : undefined}
                      className={`flex w-full items-center justify-between gap-3 whitespace-nowrap px-3.5 py-2 text-left text-[15px] transition-colors lg:py-2.5 ${
                        on
                          ? "bg-[var(--color-ink)] font-semibold text-[var(--color-paper)]"
                          : "bg-[var(--color-paper-3)] shadow-[var(--shadow-card)] hover:bg-[var(--color-paper-2)]"
                      }`}
                    >
                      <span>{t.title}</span>
                      <span className={`text-xs tabular-nums ${on ? "" : "text-[var(--color-muted)]"}`}>
                        {s.doneCount}/{s.openCount}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <section aria-label={q ? "Search results" : topic.title}>
            <div className="bg-[var(--color-paper-3)] shadow-[var(--shadow-sheet)]">
              <div className="flex items-baseline justify-between gap-3 border-b-2 border-[var(--color-ink)] px-4 py-3 sm:px-5">
                <h2 className="font-display text-3xl font-normal uppercase leading-none">{q ? "Search results" : topic.title}</h2>
                <p className="text-sm text-[var(--color-muted)]">{rows.length} shown</p>
              </div>

              {rows.length === 0 ? (
                <p className="px-5 py-10 text-base">No questions match. Try a different search or difficulty.</p>
              ) : (
                <ul>
                  {rows.map(({ p, topic: t }, idx) => {
                    const checked = done.has(p.id);
                    return (
                      <li key={p.id} className="flex items-center gap-2 border-b border-[var(--color-rule)] pr-3 last:border-b-0 sm:pr-4">
                        <button
                          onClick={() => toggle(p.id)}
                          aria-pressed={checked}
                          className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--color-focus)] sm:pl-5"
                        >
                          <span
                            aria-hidden
                            className={`flex h-5 w-5 flex-shrink-0 items-center justify-center border-2 border-[var(--color-ink)] ${checked ? "bg-[var(--color-accent)]" : ""}`}
                          >
                            {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                          </span>
                          <span className="w-5 flex-shrink-0 text-right text-xs tabular-nums text-[var(--color-muted)]">{idx + 1}</span>
                          <span className={`min-w-0 flex-1 text-[15px] leading-snug ${checked ? "text-[var(--color-muted)] line-through" : "font-medium"}`}>
                            {p.title}
                            {q && <span className="ml-2 text-xs font-normal text-[var(--color-muted)]">{t.title}</span>}
                          </span>
                        </button>
                        {p.link && (
                          <a href={p.link} target="_blank" rel="noopener noreferrer" aria-label={`Open ${p.title}`} className="flex-shrink-0 p-1.5 hover:bg-[var(--color-paper-2)]">
                            <ExternalLink className="h-4 w-4" aria-hidden />
                          </a>
                        )}
                        <span className={`hidden flex-shrink-0 px-2 py-0.5 text-xs font-semibold sm:inline ${DIFF_STYLE[p.difficulty]}`}>{p.difficulty}</span>
                      </li>
                    );
                  })}
                </ul>
              )}

              {!q && diffFilter === "All" && lockedInTopic > 0 && (
                <button
                  onClick={unlock}
                  className="group flex w-full items-center justify-between gap-3 border-t-2 border-[var(--color-ink)] bg-[var(--color-paper-2)] px-4 py-4 text-left text-[15px] font-semibold sm:px-5"
                >
                  <span className="inline-flex items-center gap-2">
                    <Lock className="h-4 w-4" aria-hidden />
                    {lockedInTopic} more {topic.title} {lockedInTopic === 1 ? "question" : "questions"} in the full set
                  </span>
                  <span className="inline-flex items-center gap-1 underline underline-offset-4">
                    Unlock <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </button>
              )}
            </div>
          </section>
        </div>
      </div>

      <PaymentPopup isOpen={showPayment} onClose={() => setShowPayment(false)} />
    </div>
  );
}
