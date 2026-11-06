import { Link } from "react-router-dom";
import type { ComponentType, ReactNode } from "react";
import {
  Layers,
  Mic2,
  Bot,
  ArrowUpRight,
  Code2,
  Hammer,
  Radar,
  BookOpen,
  Lock,
} from "lucide-react";
import { ConnectFeature } from "./ConnectFeature";

const PREMIUM_RESOURCES_URL =
  "https://drive.google.com/drive/folders/1wepyyapyvzyUR9T26CZJjQE-fGesd3A3?usp=sharing";

type IconType = ComponentType<{ className?: string }>;

// Shared surface for every secondary card: one border, one radius, one hover state.
const CARD_BASE =
  "group relative flex w-full text-left rounded-2xl border border-stone-200 bg-white " +
  "transition-[border-color,box-shadow,transform] duration-200 " +
  "hover:border-stone-300 hover:shadow-[0_10px_30px_-18px_rgba(28,25,23,0.35)] hover:-translate-y-0.5 " +
  "motion-reduce:transition-none motion-reduce:hover:translate-y-0 " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#43695a]";

interface CardLinkProps {
  id?: string;
  to?: string;
  onClick?: () => void;
  ariaLabel?: string;
  className: string;
  children: ReactNode;
}

// Real <a>/<button> instead of div[role=button]: keyboard, middle-click and deep links work.
const CardLink = ({ id, to, onClick, ariaLabel, className, children }: CardLinkProps) =>
  to ? (
    <Link id={id} to={to} aria-label={ariaLabel} className={className}>
      {children}
    </Link>
  ) : (
    <button id={id} type="button" onClick={onClick} aria-label={ariaLabel} className={className}>
      {children}
    </button>
  );

// ─── Section heading ──────────────────────────────────────────────────────────

const SectionHeading = ({ step, title, hint }: { step?: string; title: string; hint?: string }) => (
  <div className="mb-5 mt-14 flex items-end justify-between gap-4 border-b border-stone-200 pb-3">
    <div className="flex items-center gap-3">
      {step && (
        <span
          aria-hidden
          className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-900 font-['Inter'] text-xs font-bold text-white"
        >
          {step}
        </span>
      )}
      <h2 className="font-['Inter'] text-xl font-bold tracking-tight text-stone-900">{title}</h2>
    </div>
    {hint && <p className="hidden text-right font-['Inter'] text-sm text-stone-600 sm:block">{hint}</p>}
  </div>
);

// ─── Practice round card ──────────────────────────────────────────────────────

interface PracticeCardProps {
  id?: string;
  icon: IconType;
  label: string;
  title: string;
  body: string;
  tags: string[];
  cta: string;
  to?: string;
  onClick?: () => void;
}

// Fixed anatomy so the three cards line up: header row, title+body, then a footer pinned to the bottom.
const PracticeCard = ({ id, icon: Icon, label, title, body, tags, cta, to, onClick }: PracticeCardProps) => (
  <CardLink id={id} to={to} onClick={onClick} className={`${CARD_BASE} h-full flex-col p-5 sm:p-6`}>
    <span className="mb-5 flex items-center justify-between">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 text-stone-900">
        <Icon className="h-5 w-5" />
      </span>
      <span className="font-['Inter'] text-xs font-semibold uppercase tracking-wider text-stone-500">{label}</span>
    </span>

    <span className="block">
      <span className="mb-2 block font-['Inter'] text-lg font-bold tracking-tight text-stone-900">{title}</span>
      <span className="block font-['Inter'] text-sm leading-relaxed text-stone-600">{body}</span>
    </span>

    <span className="mb-6 mt-5 flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <span
          key={t}
          className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 font-['Inter'] text-xs font-medium text-stone-700"
        >
          {t}
        </span>
      ))}
    </span>

    <span className="mt-auto flex items-center justify-between border-t border-stone-100 pt-4">
      <span className="font-['Inter'] text-sm font-semibold text-stone-900">{cta}</span>
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-900 text-white transition-colors duration-200 group-hover:bg-[#43695a]">
        <ArrowUpRight className="h-4 w-4" aria-hidden />
      </span>
    </span>
  </CardLink>
);

// ─── Tool row (lives inside one shared panel) ─────────────────────────────────

interface ToolRowProps {
  id?: string;
  icon: IconType;
  title: string;
  body: string;
  badge: string;
  locked?: boolean;
  to?: string;
  onClick?: () => void;
}

const ToolRow = ({ id, icon: Icon, title, body, badge, locked, to, onClick }: ToolRowProps) => (
  <CardLink
    id={id}
    to={to}
    onClick={onClick}
    className={
      "group flex w-full items-center gap-4 p-4 text-left sm:p-5 transition-colors duration-200 hover:bg-stone-50 " +
      "border-b border-stone-200 last:border-b-0 md:[&:nth-child(3)]:border-b-0 md:odd:border-r " +
      "focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#43695a]"
    }
  >
    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-900">
      <Icon className="h-5 w-5" />
    </span>
    <span className="min-w-0 flex-1">
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-['Inter'] text-base font-bold tracking-tight text-stone-900">{title}</span>
        <span className="rounded-full bg-stone-100 px-2 py-0.5 font-['Inter'] text-[11px] font-semibold uppercase tracking-wide text-stone-600">
          {badge}
        </span>
      </span>
      <span className="mt-1 block font-['Inter'] text-sm leading-snug text-stone-600">{body}</span>
    </span>
    {locked ? (
      <Lock className="h-5 w-5 flex-shrink-0 text-stone-500" aria-label="Locked: premium only" />
    ) : (
      <ArrowUpRight
        className="h-5 w-5 flex-shrink-0 text-stone-400 transition-colors duration-200 group-hover:text-stone-900"
        aria-hidden
      />
    )}
  </CardLink>
);

// ─── Main component ───────────────────────────────────────────────────────────

interface CompanySelectionProps {
  onSelectCompany: (companyId: string) => void;
  onFeedbackClick: () => void;
  onSupportClick: () => void;
  isPremium: boolean;
  onSubscribe: () => void;
}

export const CompanySelection = ({ onSelectCompany, isPremium, onSubscribe }: CompanySelectionProps) => {
  return (
    <div className="mx-auto w-full max-w-6xl px-1 py-6 sm:px-6 sm:py-12">
      {/* Short page title: the Connect card below is the main event */}
      <header className="mb-6 sm:mb-8">
        <p className="mb-1 font-['Inter'] text-xs font-semibold uppercase tracking-wider text-stone-600">
          Accenture 2026
        </p>
        <h1 className="font-serif text-3xl tracking-tight text-stone-900 sm:text-4xl">Your prep dashboard</h1>
      </header>

      {/* ── Featured: Connect 1:1 ── */}
      <ConnectFeature />

      {/* ── 1. Practice the rounds ── */}
      <SectionHeading step="1" title="Practice the rounds first" hint="The same round types you will face" />
      <div className="grid items-stretch gap-4 md:grid-cols-3">
        <PracticeCard
          icon={Layers}
          label="Round 1"
          title="Cognitive Puzzles"
          body="Game-based simulations of how top MNCs test reasoning speed, memory and problem-solving."
          tags={["Matrix Flow", "Balloon Math", "Maze"]}
          cta="Start practicing"
          onClick={() => onSelectCompany("accenture")}
        />
        <PracticeCard
          id="onboarding-comm-card"
          icon={Mic2}
          label="Round 2"
          title="Communication Tests"
          body="Reading, listening and speaking simulations from real MNC assessment rounds."
          tags={["Reading", "Listening", "Speaking"]}
          cta="Start round"
          to="/game/communication-patterns"
        />
        <PracticeCard
          id="onboarding-ai-card"
          icon={Bot}
          label="Interview"
          title="AI Mock Interview"
          body="Face a live interviewer and get instant feedback on answers, confidence and communication."
          tags={["Live", "Instant feedback"]}
          cta="Start interview"
          to="/ai-interview"
        />
      </div>

      {/* ── 2. Toolkit ── */}
      <SectionHeading step="2" title="Toolkit" hint="Extra prep alongside the rounds" />
      <div className="grid overflow-hidden rounded-2xl border border-stone-200 bg-white md:grid-cols-2">
        <ToolRow
          icon={Code2}
          title="Important Coding Questions"
          body="330+ curated DSA problems across 16 topics with a progress checklist."
          badge="DSA"
          to="/coding-questions"
        />
        <ToolRow
          icon={BookOpen}
          title="Study Resources"
          body="Prep materials and guides for Accenture 2026."
          badge="Premium"
          locked={!isPremium}
          onClick={() => {
            if (isPremium) window.open(PREMIUM_RESOURCES_URL, "_blank", "noopener,noreferrer");
            else onSubscribe();
          }}
        />
        <ToolRow
          id="onboarding-premium-card"
          icon={Hammer}
          title="Resume Builder"
          body="Upload a PDF or DOCX, AI extracts everything. Export as LaTeX."
          badge="Free"
          to="/forge"
        />
        <ToolRow
          id="onboarding-radar-card"
          icon={Radar}
          title="Job Match"
          body="Your skills scanned against real openings, with match score and gaps."
          badge="Radar"
          to="/radar"
        />
      </div>
    </div>
  );
};
