import { Link } from "react-router-dom";
import type { ComponentType, ReactNode } from "react";
import { ArrowUpRight, Bot, BookOpen, Code2, Hammer, Layers, Lock, Mic2, Radar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ConnectFeature } from "./ConnectFeature";

const PREMIUM_RESOURCES_URL =
  "https://drive.google.com/drive/folders/1wepyyapyvzyUR9T26CZJjQE-fGesd3A3?usp=sharing";

type IconType = ComponentType<{ className?: string }>;

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

interface CardLinkProps {
  id?: string;
  to?: string;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
}

// Real <a>/<button> wrapper around a shadcn Card: keyboard, middle-click and deep links work.
const CardLink = ({ id, to, onClick, className, children }: CardLinkProps) =>
  to ? (
    <Link id={id} to={to} className={cn("group block rounded-2xl", FOCUS, className)}>
      {children}
    </Link>
  ) : (
    <button id={id} type="button" onClick={onClick} className={cn("group block w-full rounded-2xl text-left", FOCUS, className)}>
      {children}
    </button>
  );

// ─── Section heading ──────────────────────────────────────────────────────────

const SectionHeading = ({ step, title, hint }: { step?: string; title: string; hint?: string }) => (
  <div className="mb-5 mt-14">
    <div className="flex items-end justify-between gap-4 pb-3">
      <div className="flex items-center gap-3">
        {step && (
          <Badge aria-hidden className="h-7 w-7 justify-center rounded-full bg-foreground p-0 text-xs text-background hover:bg-foreground">
            {step}
          </Badge>
        )}
        <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
      </div>
      {hint && <p className="hidden text-right text-sm text-muted-foreground sm:block">{hint}</p>}
    </div>
    <Separator />
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

// Fixed anatomy so the three cards line up: header row, title+body, tags, footer pinned to the bottom.
const PracticeCard = ({ id, icon: Icon, label, title, body, tags, cta, to, onClick }: PracticeCardProps) => (
  <CardLink id={id} to={to} onClick={onClick} className="h-full">
    <Card className="flex h-full flex-col rounded-2xl p-5 shadow-none transition-[border-color,box-shadow,transform] duration-200 group-hover:-translate-y-0.5 group-hover:border-stone-300 group-hover:shadow-[0_10px_30px_-18px_rgba(28,25,23,0.35)] motion-reduce:transform-none motion-reduce:transition-none sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-foreground">
          <Icon className="h-5 w-5" />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>

      <h3 className="mb-2 text-lg font-bold tracking-tight text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>

      <div className="mb-6 mt-5 flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <Badge key={t} variant="outline" className="bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground">
            {t}
          </Badge>
        ))}
      </div>

      <Separator className="mt-auto" />
      <div className="flex items-center justify-between pt-4">
        <span className="text-sm font-semibold text-foreground">{cta}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background transition-colors duration-200 group-hover:bg-primary">
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </span>
      </div>
    </Card>
  </CardLink>
);

// ─── Tool row (lives inside one shared Card) ──────────────────────────────────

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
    className={cn(
      "rounded-none transition-colors duration-200 hover:bg-muted/50 focus-visible:ring-inset focus-visible:ring-offset-0",
      "border-b last:border-b-0 md:[&:nth-child(3)]:border-b-0 md:odd:border-r",
    )}
  >
    <div className="flex items-center gap-4 p-4 sm:p-5">
      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-base font-bold tracking-tight text-foreground">{title}</span>
          <Badge variant="secondary" className="px-2 py-0.5 text-[11px] uppercase tracking-wide">
            {badge}
          </Badge>
        </span>
        <span className="mt-1 block text-sm leading-snug text-muted-foreground">{body}</span>
      </span>
      {locked ? (
        <Lock className="h-5 w-5 flex-shrink-0 text-muted-foreground" aria-label="Locked: premium only" />
      ) : (
        <ArrowUpRight
          className="h-5 w-5 flex-shrink-0 text-muted-foreground transition-colors duration-200 group-hover:text-foreground"
          aria-hidden
        />
      )}
    </div>
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
      <header className="mb-6 sm:mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Accenture 2026</p>
        <h1 className="font-serif text-3xl tracking-tight text-foreground sm:text-4xl">Your prep dashboard</h1>
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
      <Card className="grid overflow-hidden rounded-2xl shadow-none md:grid-cols-2">
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
      </Card>
    </div>
  );
};
