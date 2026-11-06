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

const Tag = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 font-['Inter'] text-xs font-medium text-stone-700">
    {children}
  </span>
);

// ─── Practice round card ──────────────────────────────────────────────────────

interface PracticeCardProps {
  id?: string;
  icon: IconType;
  title: string;
  body: string;
  tags: string;
  cta: string;
  to?: string;
  onClick?: () => void;
}

const PracticeCard = ({ id, icon: Icon, title, body, tags, cta, to, onClick }: PracticeCardProps) => (
  <CardLink id={id} to={to} onClick={onClick} className={`${CARD_BASE} flex-col gap-4 p-5 sm:p-6`}>
    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100 text-stone-900">
      <Icon className="h-5 w-5" />
    </span>
    <span className="block">
      <span className="mb-1.5 block font-['Inter'] text-lg font-bold tracking-tight text-stone-900">{title}</span>
      <span className="block font-['Inter'] text-sm leading-relaxed text-stone-600">{body}</span>
    </span>
    <span className="mt-auto flex flex-col gap-3 pt-2">
      <Tag>{tags}</Tag>
      <span className="inline-flex min-h-[44px] items-center gap-1.5 font-['Inter'] text-sm font-semibold text-stone-900">
        {cta}
        <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none" />
      </span>
    </span>
  </CardLink>
);

// ─── Compact tool row ─────────────────────────────────────────────────────────

interface ToolRowProps {
  id?: string;
  icon: IconType;
  title: string;
  body: string;
  badge: string;
  cta?: ReactNode;
  to?: string;
  onClick?: () => void;
}

const ToolRow = ({ id, icon: Icon, title, body, badge, cta, to, onClick }: ToolRowProps) => (
  <CardLink id={id} to={to} onClick={onClick} className={`${CARD_BASE} items-center gap-4 p-4 sm:p-5`}>
    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-900">
      <Icon className="h-5 w-5" />
    </span>
    <span className="min-w-0 flex-1">
      <span className="flex items-center gap-2">
        <span className="font-['Inter'] text-base font-bold tracking-tight text-stone-900">{title}</span>
        <span className="rounded-full bg-stone-100 px-2 py-0.5 font-['Inter'] text-[11px] font-semibold uppercase tracking-wide text-stone-600">
          {badge}
        </span>
      </span>
      <span className="mt-0.5 block font-['Inter'] text-sm leading-snug text-stone-600">{body}</span>
    </span>
    <span className="flex-shrink-0 text-stone-500 group-hover:text-stone-900">
      {cta ?? <ArrowUpRight className="h-5 w-5" aria-hidden />}
    </span>
  </CardLink>
);

const SectionHeading = ({ title, hint }: { title: string; hint?: string }) => (
  <div className="mb-4 mt-12 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
    <h2 className="font-['Inter'] text-xl font-bold tracking-tight text-stone-900">{title}</h2>
    {hint && <p className="font-['Inter'] text-sm text-stone-600">{hint}</p>}
  </div>
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

      {/* ── Practice the rounds ── */}
      <SectionHeading title="Practice the rounds first" hint="The same round types you will face" />
      <div className="grid gap-4 md:grid-cols-3">
        <PracticeCard
          icon={Layers}
          title="Cognitive Puzzles"
          body="Game-based simulations of how top MNCs test reasoning speed, memory and problem-solving."
          tags="Matrix Flow · Balloon Math · Maze"
          cta="Start practicing"
          onClick={() => onSelectCompany("accenture")}
        />
        <PracticeCard
          id="onboarding-comm-card"
          icon={Mic2}
          title="Communication Tests"
          body="Reading, listening and speaking simulations from real MNC assessment rounds."
          tags="Reading · Listening · Speaking"
          cta="Start round"
          to="/game/communication-patterns"
        />
        <PracticeCard
          id="onboarding-ai-card"
          icon={Bot}
          title="AI Mock Interview"
          body="Face a live interviewer and get instant feedback on answers, confidence and communication."
          tags="Live · Instant feedback"
          cta="Start interview"
          to="/ai-interview"
        />
      </div>

      {/* ── More tools ── */}
      <SectionHeading title="More tools" />
      <div className="grid gap-4 md:grid-cols-2">
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
          cta={
            isPremium ? (
              <ArrowUpRight className="h-5 w-5" aria-hidden />
            ) : (
              <Lock className="h-5 w-5" aria-label="Locked: premium only" />
            )
          }
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
