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
  sm: 'w-7 h-7 rounded-lg text-xs',
  md: 'w-16 h-16 rounded-2xl text-2xl',
  lg: 'w-28 h-28 rounded-3xl text-4xl',
};

export const ExpertAvatar = ({ expert, size = 'md' }: ExpertAvatarProps) => (
  <div className="relative flex-shrink-0">
    {expert.photo_url ? (
      <img
        src={expert.photo_url}
        alt={expert.name}
        loading="lazy"
        className={`${AVATAR_SIZE[size]} object-cover bg-stone-100`}
      />
    ) : (
      <div
        className={`${AVATAR_SIZE[size]} bg-stone-200 flex items-center justify-center font-['Merriweather'] text-stone-600`}
        aria-hidden
      >
        {expert.name.charAt(0)}
      </div>
    )}
    {expert.proof_url && size !== 'sm' && (
      <span
        title="Placement proof on file"
        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#557d6b] border-2 border-white flex items-center justify-center"
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
      className="group relative flex flex-col bg-white rounded-3xl border border-stone-200/80 shadow-[0_1px_0_rgba(28,25,23,0.03)] transition-all duration-300 hover:border-stone-300 hover:shadow-[0_18px_40px_-24px_rgba(28,25,23,0.35)] hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-[#557d6b]/40 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      {/* Placement panel — the thing a student actually cares about */}
      {expert.company && (
        <div className="mx-3 mt-3 rounded-2xl bg-[#557d6b]/[0.08] border border-[#557d6b]/15 px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-['Inter'] text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#43695a]">
              Placed at
            </p>
            <p className="font-['Merriweather'] text-[17px] leading-tight text-stone-900 truncate mt-0.5">
              {expert.company}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            {expert.package_lpa ? (
              <p className="font-['Inter'] text-sm font-semibold text-stone-800 tabular-nums">
                ₹{expert.package_lpa} <span className="text-[11px] font-medium text-stone-500">LPA</span>
              </p>
            ) : null}
            {placedAgo && (
              <p className="font-['Inter'] text-[11px] text-stone-500 mt-0.5">{placedAgo}</p>
            )}
          </div>
        </div>
      )}

      <div className="p-5 pt-4 flex flex-col gap-4 flex-1">
        <div className="flex items-center gap-3.5">
          <ExpertAvatar expert={expert} size="md" />
          <div className="min-w-0">
            <h3 className="font-['Merriweather'] text-[17px] text-stone-900 leading-snug">
              {expert.name}
            </h3>
            {expert.title && (
              <p className="font-['Inter'] text-[13px] text-stone-500 leading-snug line-clamp-2 mt-0.5">
                {expert.title}
              </p>
            )}
          </div>
        </div>

        {expert.bio && (
          <p className="font-['Inter'] text-[14px] text-stone-600 leading-relaxed line-clamp-3">
            {expert.bio}
          </p>
        )}

        {skills.length > 0 && (
          <div>
            <p className="font-['Inter'] text-[10.5px] font-semibold uppercase tracking-[0.12em] text-stone-400 mb-1.5">
              Ask about
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <li
                  key={skill}
                  className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-medium font-['Inter']"
                >
                  {skill}
                </li>
              ))}
              {extraSkills > 0 && (
                <li className="px-2 py-1 text-xs text-stone-400 font-['Inter']">+{extraSkills} more</li>
              )}
            </ul>
          </div>
        )}

        {unavailable && (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-stone-50 border border-stone-100 rounded-xl text-xs text-stone-500 font-['Inter']">
            <CalendarOff className="w-3.5 h-3.5 flex-shrink-0" />
            No open slots right now
          </div>
        )}

        <div className="flex items-end justify-between gap-3 pt-4 mt-auto border-t border-stone-100">
          <div>
            <p className="font-['Merriweather'] text-2xl text-stone-900 leading-none tabular-nums">
              ₹{expert.price_inr}
            </p>
            <p className="font-['Inter'] text-[11.5px] text-stone-500 mt-1.5">20-min live call</p>
          </div>
          <button
            onClick={() => onBook(expert)}
            disabled={unavailable}
            aria-label={`Book a call with ${expert.name}`}
            className="inline-flex items-center gap-2 pl-4 pr-3.5 py-2.5 bg-stone-900 text-white text-sm font-medium font-['Inter'] rounded-xl hover:bg-stone-700 active:scale-[0.97] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-900 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 after:absolute after:inset-0 after:rounded-3xl after:content-['']"
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
  <div className="bg-white rounded-3xl border border-stone-200/80 p-3" aria-hidden>
    <div className="h-[68px] rounded-2xl bg-stone-100 animate-pulse" />
    <div className="p-2 pt-5 space-y-4">
      <div className="flex items-center gap-3.5">
        <div className="w-16 h-16 rounded-2xl bg-stone-100 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-stone-100 animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-stone-100 animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 rounded bg-stone-100 animate-pulse" />
        <div className="h-3 rounded bg-stone-100 animate-pulse" />
        <div className="h-3 w-4/5 rounded bg-stone-100 animate-pulse" />
      </div>
      <div className="flex justify-between items-end pt-4 border-t border-stone-100">
        <div className="h-7 w-16 rounded bg-stone-100 animate-pulse" />
        <div className="h-10 w-28 rounded-xl bg-stone-100 animate-pulse" />
      </div>
    </div>
  </div>
);

export default ExpertCard;
