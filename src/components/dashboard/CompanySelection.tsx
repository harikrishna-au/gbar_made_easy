import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { ArrowUpRight, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ConnectFeature } from "./ConnectFeature";

const PREMIUM_RESOURCES_URL =
  "https://drive.google.com/drive/folders/1wepyyapyvzyUR9T26CZJjQE-fGesd3A3?usp=sharing";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-focus)]";

interface CellLinkProps {
  id?: string;
  to?: string;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
}

// Real <a>/<button> so keyboard, middle-click and deep links work.
const CellLink = ({ id, to, onClick, className, children }: CellLinkProps) =>
  to ? (
    <Link id={id} to={to} className={cn("group block transition-colors duration-150 hover:bg-muted/60 active:bg-muted", FOCUS, className)}>
      {children}
    </Link>
  ) : (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className={cn("group block w-full text-left transition-colors duration-150 hover:bg-muted/60 active:bg-muted", FOCUS, className)}
    >
      {children}
    </button>
  );

const SectionHeading = ({ title, hint }: { title: string; hint?: string }) => (
  <div className="mb-4 mt-14 flex items-baseline justify-between gap-4 border-b-2 border-[var(--color-ink)] pb-2">
    <h2 className="font-display text-4xl font-normal uppercase leading-none text-foreground">{title}</h2>
    {hint && <p className="hidden text-sm text-muted-foreground sm:block">{hint}</p>}
  </div>
);

// ─── Practice rounds: one ruled table, three columns ─────────────────────────

interface RoundProps {
  id?: string;
  label: string;
  title: string;
  body: string;
  covers: string;
  cta: string;
  to?: string;
  onClick?: () => void;
}

const Round = ({ id, label, title, body, covers, cta, to, onClick }: RoundProps) => (
  <CellLink
    id={id}
    to={to}
    onClick={onClick}
    className="border-b border-[var(--color-rule)] p-6 last:border-b-0 sm:p-8 md:border-b-0 md:border-r md:last:border-r-0"
  >
    <span className="flex h-full flex-col">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="mt-2 block text-xl font-semibold leading-tight text-foreground">{title}</span>
      <span className="mt-2 block text-[15px] leading-relaxed text-foreground/80">{body}</span>
      <span className="mt-3 block text-sm text-muted-foreground">Covers {covers}.</span>
      <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-semibold text-foreground underline decoration-transparent underline-offset-4 transition-colors group-hover:decoration-foreground">
        {cta}
        <ArrowUpRight className="h-4 w-4" aria-hidden />
      </span>
    </span>
  </CellLink>
);

// ─── Toolkit: plain ruled list ────────────────────────────────────────────────

interface ToolProps {
  id?: string;
  title: string;
  body: string;
  note: string;
  locked?: boolean;
  to?: string;
  onClick?: () => void;
}

const Tool = ({ id, title, body, note, locked, to, onClick }: ToolProps) => (
  <CellLink
    id={id}
    to={to}
    onClick={onClick}
    className="border-b border-border px-1 py-4 sm:px-2"
  >
    <span className="flex items-center gap-4">
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold text-foreground">{title}</span>
        <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">{body}</span>
      </span>
      <span className="flex flex-shrink-0 items-center gap-1.5 text-sm font-medium text-foreground/80">
        {locked && <Lock className="h-3.5 w-3.5" aria-hidden />}
        {note}
        <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" aria-hidden />
      </span>
    </span>
  </CellLink>
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
    <div className="mx-auto w-full max-w-[1360px] px-1 py-6 sm:px-6 sm:py-12">
      <header className="mb-7 sm:mb-9">
        <p className="mb-2 text-base font-medium text-muted-foreground">Accenture 2026</p>
        <h1 className="font-display text-6xl font-normal uppercase leading-[0.95] text-foreground sm:text-7xl">
          Your prep dashboard
        </h1>
      </header>

      <ConnectFeature />

      <SectionHeading title="Practice the rounds first" hint="The same round types you will face" />
      <Card className="grid overflow-hidden rounded-none border-0 bg-[var(--color-paper-3)] shadow-[var(--shadow-sheet)] md:grid-cols-3">
        <Round
          label="Round 1"
          title="Cognitive Puzzles"
          body="Game-based simulations of how large companies test reasoning speed, memory and problem-solving."
          covers="Matrix Flow, Balloon Math and Maze"
          cta="Start practicing"
          onClick={() => onSelectCompany("accenture")}
        />
        <Round
          id="onboarding-comm-card"
          label="Round 2"
          title="Communication Tests"
          body="Reading, listening and speaking exercises taken from real assessment rounds."
          covers="two assessment patterns"
          cta="Start round"
          to="/game/communication-patterns"
        />
        <Round
          id="onboarding-ai-card"
          label="Interview"
          title="AI Mock Interview"
          body="Answer a live interviewer and get feedback on your answers, confidence and communication."
          covers="HR and technical questions"
          cta="Start interview"
          to="/ai-interview"
        />
      </Card>

      <SectionHeading title="Toolkit" hint="Extra prep alongside the rounds" />
      <div className="border-t border-border md:grid md:grid-cols-2 md:gap-x-10">
        <Tool
          title="Important Coding Questions"
          body="330+ DSA problems across 16 topics, with a progress checklist."
          note="DSA"
          to="/coding-questions"
        />
        <Tool
          title="Study Resources"
          body="Prep materials and guides for Accenture 2026."
          note="Premium"
          locked={!isPremium}
          onClick={() => {
            if (isPremium) window.open(PREMIUM_RESOURCES_URL, "_blank", "noopener,noreferrer");
            else onSubscribe();
          }}
        />
        <Tool
          id="onboarding-premium-card"
          title="Resume Builder"
          body="Upload a PDF or DOCX and export it as LaTeX."
          note="Free"
          to="/forge"
        />
        <Tool
          id="onboarding-radar-card"
          title="Job Match"
          body="Your skills scanned against real openings, with a match score and gaps."
          note="Radar"
          to="/radar"
        />
      </div>
    </div>
  );
};
