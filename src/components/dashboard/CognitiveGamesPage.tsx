import { Link } from "react-router-dom";
import { useRef, type ElementType } from "react";
import { ArrowLeft, ArrowUpRight, Cpu, Zap, Navigation, Crown, Check } from "lucide-react";
import { useGsapReveal } from "@/hooks/useGsapReveal";
import { useActivityResults } from "@/hooks/useActivityResults";
import { formatAttempts, formatBestScore, type ActivityResult } from "@/lib/activityResults";

// ─── Game definitions ─────────────────────────────────────────────────────────

// Each group mirrors the assessment used by a specific company, so the games
// are grouped and labelled by that company rather than by an internal name.
const COMPANIES = {
  accenture: { name: "Accenture", accent: "#1c1917" },
  cognizant: { name: "Cognizant", accent: "#78716c" },
} as const;

const ACCENTURE_GAMES = [
  {
    num: "01",
    name: "Matrix Flow",
    path: "/game/matrix",
    desc: "Spot patterns in shifting matrices and find the missing piece. Tests logical reasoning speed under pressure.",
    tag: "Logic · Patterns",
    color: "#1c1917",
    bg: "rgba(28,25,23,0.05)",
    border: "rgba(28,25,23,0.14)",
    glow: "rgba(28,25,23,0.10)",
    Icon: Cpu,
    hasPremium: true,
  },
  {
    num: "02",
    name: "Balloon Math",
    path: "/game/balloon",
    desc: "Pop the correct balloons to solve arithmetic sequences at pace. Builds numerical fluency and decision speed.",
    tag: "Arithmetic · Speed",
    color: "#1c1917",
    bg: "rgba(28,25,23,0.05)",
    border: "rgba(28,25,23,0.14)",
    glow: "rgba(28,25,23,0.10)",
    Icon: Zap,
    hasPremium: false,
  },
  {
    num: "03",
    name: "Hidden Maze",
    path: "/game/hidden-maze",
    desc: "Navigate invisible pathways using spatial memory alone. Tests working memory and orientation.",
    tag: "Spatial · Memory",
    color: "#1c1917",
    bg: "rgba(28,25,23,0.05)",
    border: "rgba(28,25,23,0.14)",
    glow: "rgba(28,25,23,0.10)",
    Icon: Navigation,
    hasPremium: true,
  },
];

const COGNIZANT_GAMES = [
  {
    num: "04",
    name: "Geo-Sudo",
    path: "/game/geo-sudo",
    desc: "Fill a 4×4 grid so every row & column contains all 4 shapes. Tests deductive logic and pattern recognition.",
    tag: "Deductive · Logic",
    emoji: "◆",
    color: "#1c1917",
    bg: "rgba(28,25,23,0.05)",
    border: "rgba(28,25,23,0.14)",
    glow: "rgba(28,25,23,0.10)",
  },
  {
    num: "05",
    name: "Grid Challenge",
    path: "/game/grid-challenge",
    desc: "Spot the rule in a 3×3 matrix and select the missing element from 4 choices. Inductive reasoning under time.",
    tag: "Inductive · Patterns",
    emoji: "⊞",
    color: "#1c1917",
    bg: "rgba(28,25,23,0.05)",
    border: "rgba(28,25,23,0.14)",
    glow: "rgba(28,25,23,0.10)",
  },
  {
    num: "06",
    name: "Motion Challenge",
    path: "/game/motion",
    desc: "Tap shrinking coloured targets before they vanish. Tests hand-eye coordination, reaction speed, and focus.",
    tag: "Reaction · Speed",
    emoji: "🎯",
    color: "#1c1917",
    bg: "rgba(28,25,23,0.05)",
    border: "rgba(28,25,23,0.14)",
    glow: "rgba(28,25,23,0.10)",
  },
  {
    num: "07",
    name: "Switch Challenge",
    path: "/game/switch",
    desc: "Classify numbers (odd/even) and letters (vowel/consonant) as the task switches without warning. Adaptability under load.",
    tag: "Switching · Focus",
    emoji: "🔀",
    color: "#1c1917",
    bg: "rgba(28,25,23,0.05)",
    border: "rgba(28,25,23,0.14)",
    glow: "rgba(28,25,23,0.10)",
  },
  {
    num: "08",
    name: "Digit Challenge",
    path: "/game/digit",
    desc: "Watch digits flash one-by-one, then type the full sequence. Sequence length grows until you reach your limit.",
    tag: "Memory · Working",
    emoji: "🧠",
    color: "#1c1917",
    bg: "rgba(28,25,23,0.05)",
    border: "rgba(28,25,23,0.14)",
    glow: "rgba(28,25,23,0.10)",
  },
  {
    num: "09",
    name: "BART",
    path: "/game/bart",
    desc: "Pump a balloon to earn points — but it can pop at any moment. Reveals your real risk appetite under uncertainty.",
    tag: "Risk · Strategy",
    emoji: "🎈",
    color: "#1c1917",
    bg: "rgba(28,25,23,0.05)",
    border: "rgba(28,25,23,0.14)",
    glow: "rgba(28,25,23,0.10)",
  },
  {
    num: "10",
    name: "Mapping Challenge",
    path: "/game/swith",
    desc: "Symbols appear in two rows — decode the output order back to input positions. Tests logical mapping and speed.",
    tag: "Logic · Mapping",
    emoji: "🔁",
    color: "#1c1917",
    bg: "rgba(28,25,23,0.05)",
    border: "rgba(28,25,23,0.14)",
    glow: "rgba(28,25,23,0.10)",
  },
  {
    num: "11",
    name: "Dual Task Challenge",
    path: "/game/dual-task",
    desc: "Remember which circle blinks, judge symmetry of patterns, then recall all 3 circles in order. Tests divided attention and memory.",
    tag: "Attention · Memory",
    emoji: "🧩",
    color: "#1c1917",
    bg: "rgba(28,25,23,0.05)",
    border: "rgba(28,25,23,0.14)",
    glow: "rgba(28,25,23,0.10)",
  },
  {
    num: "12",
    name: "Inductive Challenge",
    path: "/game/inductive",
    desc: "Two grids show a hidden transformation rule. Find which two of four answer grids follow the same rule.",
    tag: "Inductive · Recognition",
    emoji: "🔍",
    color: "#1c1917",
    bg: "rgba(28,25,23,0.05)",
    border: "rgba(28,25,23,0.14)",
    glow: "rgba(28,25,23,0.10)",
  },
];

// ─── Card ─────────────────────────────────────────────────────────────────────

interface GameLike {
  num: string;
  name: string;
  path: string;
  desc: string;
  tag: string;
}

// One card for every game. The whole card is a link (stretched anchor), and the
// optional Premium tag is a separate button sitting above it, so nothing nests.
function GameCard({
  game,
  glyph,
  result,
  badge,
}: {
  game: GameLike;
  glyph: ElementType | string;
  result?: ActivityResult;
  badge?: { label: string; onClick?: () => void };
}) {
  const Glyph = typeof glyph === "string" ? null : glyph;
  return (
    <article className="group relative flex h-full flex-col gap-3 bg-[var(--color-paper-3)] p-5 shadow-[var(--shadow-sheet)] transition-transform duration-200 hover:-translate-y-1 focus-within:outline focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-[var(--color-focus)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-display text-4xl leading-none tabular-nums">{game.num}</span>
          <span className="flex h-9 w-9 items-center justify-center bg-[var(--color-paper-2)] text-lg" aria-hidden>
            {Glyph ? <Glyph className="h-5 w-5" /> : (glyph as string)}
          </span>
        </div>
        {badge &&
          (badge.onClick ? (
            <button
              onClick={badge.onClick}
              className="relative z-10 inline-flex items-center gap-1 bg-[var(--color-accent)] px-2 py-1 text-xs font-semibold text-[var(--color-ink)] shadow-[2px_2px_0_var(--color-ink)] transition-[transform,box-shadow] hover:translate-x-px hover:translate-y-px hover:shadow-[1px_1px_0_var(--color-ink)]"
            >
              <Crown className="h-3 w-3" aria-hidden />
              {badge.label}
            </button>
          ) : (
            <span className="bg-[var(--color-paper-2)] px-2 py-1 text-xs font-semibold">{badge.label}</span>
          ))}
      </div>

      <h3 className="font-display text-3xl font-normal uppercase leading-[1.02]">
        <Link to={game.path} className="after:absolute after:inset-0 after:content-[''] focus:outline-none">
          {game.name}
        </Link>
      </h3>
      <p className="text-[15px] leading-relaxed">{game.desc}</p>

      {result && (
        <p className="flex items-center gap-2 text-sm">
          <span className="flex h-4 w-4 items-center justify-center bg-[var(--color-accent)]" aria-hidden>
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
          <span className="font-semibold">{formatBestScore(result)}</span>
          <span className="text-[var(--color-muted)]">· {formatAttempts(result)}</span>
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--color-rule)] pt-3">
        <span className="text-sm text-[var(--color-muted)]">{game.tag}</span>
        <span className="inline-flex items-center gap-1 text-[15px] font-semibold underline decoration-transparent underline-offset-4 group-hover:decoration-[var(--color-ink)]">
          {result ? "Play again" : "Play now"}
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </span>
      </div>
    </article>
  );
}

function GroupHeading({ name, count, blurb }: { name: string; count: number; blurb: string }) {
  return (
    <div data-reveal className="mb-5 mt-12 border-b-2 border-[var(--color-ink)] pb-3 first:mt-0">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-4xl font-normal uppercase leading-none sm:text-5xl">{name}</h2>
        <span className="text-sm text-[var(--color-muted)]">{count} games</span>
      </div>
      <p className="mt-2 max-w-[60ch] text-[15px]">{blurb}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  isPremium: boolean;
  onSubscribe: () => void;
}

export const CognitiveGamesPage = ({ isPremium, onSubscribe }: Props) => {
  const page = useRef<HTMLDivElement>(null);
  const results = useActivityResults();
  useGsapReveal(page);

  const totalGames = ACCENTURE_GAMES.length + COGNIZANT_GAMES.length;
  const gamesPlayed = [...ACCENTURE_GAMES, ...COGNIZANT_GAMES].filter((g) => results[g.path]).length;
  const pct = Math.round((gamesPlayed / totalGames) * 100);

  return (
    <div ref={page} className="mx-auto w-full max-w-[1100px] px-1 pb-16 pt-2 sm:px-4">
      <Link
        to="/dashboard"
        className="mb-6 inline-flex min-h-[44px] items-center gap-2 text-[15px] underline decoration-[var(--color-rule)] underline-offset-4 hover:decoration-[var(--color-ink)]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back
      </Link>

      <header>
        <p data-intro className="text-base font-medium text-[var(--color-muted)]">Cognitive assessment prep</p>
        <h1
          data-intro
          className="mt-2 font-display font-normal uppercase leading-[0.95] tracking-[0.005em]"
          style={{ fontSize: "clamp(2.75rem, 7vw, 5rem)" }}
        >
          Cognitive games
        </h1>
        <p data-intro className="mt-3 max-w-[56ch] text-lg leading-snug">
          Game-based simulations modelled on the cognitive tests used in MNC assessments.
        </p>

        {/* Only once something has been played: an empty bar on arrival says "all the work is ahead of you". */}
        {gamesPlayed > 0 && (
          <div data-intro className="mt-5 flex items-center gap-4 text-sm">
            <span className="tabular-nums">
              <b className="font-semibold">{gamesPlayed}</b> of {totalGames} played
            </span>
            <div className="h-2 w-40 bg-[var(--color-paper-2)]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Games played">
              <div className="h-full bg-[var(--color-accent)] transition-[width] duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
      </header>

      <div className="mt-10">
        <GroupHeading
          name={COMPANIES.accenture.name}
          count={ACCENTURE_GAMES.length}
          blurb="Modelled on the Accenture cognitive assessment: pattern logic, numerical fluency and spatial memory."
        />
        <div id="onboarding-tr-group" data-reveal-group className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {ACCENTURE_GAMES.map((g) => (
            <GameCard
              key={g.num}
              game={g}
              glyph={g.Icon}
              result={results[g.path]}
              badge={g.hasPremium && !isPremium ? { label: "Extra levels", onClick: onSubscribe } : undefined}
            />
          ))}
        </div>

        <GroupHeading
          name={COMPANIES.cognizant.name}
          count={COGNIZANT_GAMES.length}
          blurb="Modelled on the Cognizant assessment pack: logic, memory, reaction speed and risk appetite."
        />
        <div data-reveal-group className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {COGNIZANT_GAMES.map((g) => (
            <GameCard
              key={g.num}
              game={g}
              glyph={g.emoji}
              result={results[g.path]}
              badge={results[g.path] ? undefined : { label: "New" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
