import { BadgeCheck, ArrowRight, CalendarOff } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

export interface Expert {
  id: string;
  name: string;
  title: string | null;
  bio: string | null;
  skills: string[] | null;
  photo_url: string | null;
  price_inr: number;
  company: string | null;
  interview_date: string | null;
  package_lpa: number | null;
  proof_url: string | null;
  created_at: string;
  // Populated when fetched with availability join
  availability?: { id: string }[];
}

interface ExpertCardProps {
  expert: Expert;
  onBook: (expert: Expert) => void;
}

interface ExpertAvatarProps {
  expert: Pick<Expert, 'name' | 'photo_url' | 'proof_url'>;
  size?: 'sm' | 'md' | 'lg';
}

const AVATAR_SIZE = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-16 h-16 text-3xl',
  lg: 'w-28 h-28 text-5xl',
};

export const ExpertAvatar = ({ expert, size = 'md' }: ExpertAvatarProps) => (
  <div className="relative flex-shrink-0">
    {expert.photo_url ? (
      <img
        src={expert.photo_url}
        alt={expert.name}
        loading="lazy"
        className={`${AVATAR_SIZE[size]} object-cover bg-[var(--color-paper-2)]`}
      />
    ) : (
      <div
        className={`${AVATAR_SIZE[size]} bg-[var(--color-accent)] flex items-center justify-center font-display text-[var(--color-ink)]`}
        aria-hidden
      >
        {expert.name.charAt(0)}
      </div>
    )}
    {expert.proof_url && size !== 'sm' && (
      <span
        title="Placement proof on file"
        className="absolute -bottom-1 -right-1 w-5 h-5 bg-[var(--color-ink)] flex items-center justify-center"
      >
        <BadgeCheck className="w-3 h-3 text-white" />
      </span>
    )}
  </div>
);

const ExpertCard = ({ expert, onBook }: ExpertCardProps) => {
  const placedAgo = expert.interview_date
    ? formatDistanceToNow(parseISO(expert.interview_date), { addSuffix: true })
    : null;
  const unavailable = expert.availability !== undefined && expert.availability.length === 0;
  const skills = expert.skills?.slice(0, 4) ?? [];
  const extraSkills = (expert.skills?.length ?? 0) - skills.length;

  return (
    <article
      className="group relative flex flex-col bg-[var(--color-paper-3)] shadow-[var(--shadow-sheet)] transition-transform duration-200 hover:-translate-y-1 focus-within:outline focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-[var(--color-focus)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      {/* Placement panel — the thing a student actually cares about */}
      {expert.company && (
        <div className="mx-3 mt-3 bg-[var(--color-accent)] px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-['Inter'] text-xs font-semibold text-[var(--color-ink)]">
              Placed at
            </p>
            <p className="font-display text-2xl uppercase leading-none text-[var(--color-ink)] truncate mt-1">
              {expert.company}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            {expert.package_lpa ? (
              <p className="font-['Inter'] text-sm font-semibold text-[var(--color-ink)] tabular-nums">
                ₹{expert.package_lpa} <span className="text-[11px] font-medium text-[var(--color-ink)]">LPA</span>
              </p>
            ) : null}
            {placedAgo && (
              <p className="font-['Inter'] text-[11px] text-[var(--color-ink)] mt-0.5">{placedAgo}</p>
            )}
          </div>
        </div>
      )}

      <div className="p-5 pt-4 flex flex-col gap-4 flex-1">
        <div className="flex items-center gap-3.5">
          <ExpertAvatar expert={expert} size="md" />
          <div className="min-w-0">
            <h3 className="font-display text-2xl uppercase text-[var(--color-ink)] leading-none">
              {expert.name}
            </h3>
            {expert.title && (
              <p className="font-['Inter'] text-[13px] text-[var(--color-muted)] leading-snug line-clamp-2 mt-0.5">
                {expert.title}
              </p>
            )}
          </div>
        </div>

        {expert.bio && (
          <p className="font-['Inter'] text-[14px] text-[var(--color-ink)] leading-relaxed line-clamp-3">
            {expert.bio}
          </p>
        )}

        {skills.length > 0 && (
          <div>
            <p className="font-['Inter'] text-xs font-semibold text-[var(--color-muted)] mb-1.5">
              Ask about
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <li
                  key={skill}
                  className="px-2.5 py-1 bg-[var(--color-paper-2)] text-[var(--color-ink)] text-xs font-medium font-['Inter']"
                >
                  {skill}
                </li>
              ))}
              {extraSkills > 0 && (
                <li className="px-2 py-1 text-xs text-[var(--color-muted)] font-['Inter']">+{extraSkills} more</li>
              )}
            </ul>
          </div>
        )}

        {unavailable && (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-[var(--color-paper-2)] text-xs text-[var(--color-ink)] font-['Inter']">
            <CalendarOff className="w-3.5 h-3.5 flex-shrink-0" />
            No open slots right now
          </div>
        )}

        <div className="flex items-end justify-between gap-3 pt-4 mt-auto border-t border-[var(--color-rule)]">
          <div>
            <p className="font-display text-4xl text-[var(--color-ink)] leading-none tabular-nums">
              ₹{expert.price_inr}
            </p>
            <p className="font-['Inter'] text-xs text-[var(--color-muted)] mt-1.5">20-min live call</p>
          </div>
          <button
            onClick={() => onBook(expert)}
            disabled={unavailable}
            aria-label={`Book a call with ${expert.name}`}
            className="inline-flex items-center gap-2 pl-4 pr-3.5 py-2.5 bg-[var(--color-accent)] text-[var(--color-ink)] text-sm font-semibold font-['Inter'] shadow-[3px_3px_0_var(--color-ink)] transition-[transform,box-shadow] duration-[120ms] hover:translate-x-px hover:translate-y-px active:translate-x-[3px] active:translate-y-[3px] active:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-ink)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none after:absolute after:inset-0 after:content-['']"
          >
            Book call
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </article>
  );
};

export const ExpertCardSkeleton = () => (
  <div className="bg-[var(--color-paper-3)] shadow-[var(--shadow-card)] p-3" aria-hidden>
    <div className="h-[68px] bg-[var(--color-paper-2)] animate-pulse" />
    <div className="p-2 pt-5 space-y-4">
      <div className="flex items-center gap-3.5">
        <div className="w-16 h-16 bg-[var(--color-paper-2)] animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-[var(--color-paper-2)] animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-[var(--color-paper-2)] animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 rounded bg-[var(--color-paper-2)] animate-pulse" />
        <div className="h-3 rounded bg-[var(--color-paper-2)] animate-pulse" />
        <div className="h-3 w-4/5 rounded bg-[var(--color-paper-2)] animate-pulse" />
      </div>
      <div className="flex justify-between items-end pt-4 border-t border-[var(--color-rule)]">
        <div className="h-7 w-16 rounded bg-[var(--color-paper-2)] animate-pulse" />
        <div className="h-10 w-28 bg-[var(--color-paper-2)] animate-pulse" />
      </div>
    </div>
  </div>
);

export default ExpertCard;
