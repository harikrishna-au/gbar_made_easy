import { BLOG_TYPES, type BlogType } from '@/lib/blog-utils';

type FilterType = BlogType | 'all';

interface BlogFiltersProps {
  active: FilterType;
  onChange: (type: FilterType) => void;
}

const ALL_FILTERS: { key: FilterType; label: string; emoji: string }[] = [
  { key: 'all', label: 'All Posts', emoji: '✨' },
  ...Object.entries(BLOG_TYPES).map(([key, val]) => ({
    key: key as BlogType,
    label: val.label,
    emoji: val.emoji,
  })),
];

export function BlogFilters({ active, onChange }: BlogFiltersProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {ALL_FILTERS.map(({ key, label, emoji }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(key)}
            className={`flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap px-3.5 py-2 text-[13px] font-semibold transition-[transform,box-shadow,background-color] duration-[120ms] ${
              isActive
                ? 'bg-[var(--color-accent)] text-[var(--color-ink)] shadow-[3px_3px_0_var(--color-ink)]'
                : 'bg-[var(--color-paper-3)] text-[var(--color-ink)] shadow-[var(--shadow-card)] hover:-translate-y-0.5'
            }`}
          >
            <span className="text-[13px]">{emoji}</span>
            {label}
          </button>
        );
      })}
    </div>
  );
}
