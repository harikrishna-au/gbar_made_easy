import { BLOG_TYPES, type BlogType } from '@/lib/blog-utils';

interface BlogTypeTagProps {
  type: BlogType;
  size?: 'sm' | 'md';
}

// Paste-up labels: ink on paper, with flame for the one type that is good news.
const FLAME: BlogType[] = ['success_story'];

export function BlogTypeTag({ type, size = 'md' }: BlogTypeTagProps) {
  const meta = BLOG_TYPES[type] ?? BLOG_TYPES.general;
  const cls = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
  const tone = FLAME.includes(type)
    ? 'bg-[var(--color-accent)] text-[var(--color-ink)]'
    : 'bg-[var(--color-paper-2)] text-[var(--color-ink)]';

  return (
    <span className={`inline-flex items-center gap-1 font-semibold whitespace-nowrap ${cls} ${tone}`}>
      <span aria-hidden>{meta.emoji}</span>
      {meta.label}
    </span>
  );
}
