import { Link } from 'react-router-dom';
import { Eye, Clock } from 'lucide-react';
import type { Blog } from '@/lib/blog-utils';
import { formatDate, displayAuthor } from '@/lib/blog-utils';
import { BlogTypeTag } from './BlogTypeTag';

export function BlogCard({ blog }: { blog: Blog }) {
  return (
    <Link
      to={`/blog/${blog.slug}`}
      className="group flex h-full flex-col gap-3 bg-[var(--color-paper-3)] p-5 shadow-[var(--shadow-sheet)] transition-transform duration-200 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-focus)]"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="select-none text-3xl leading-none" aria-hidden>{blog.cover_emoji}</span>
        <BlogTypeTag type={blog.type} size="sm" />
      </div>

      <h3 className="line-clamp-2 font-display text-[1.65rem] font-normal uppercase leading-[1.02] text-[var(--color-ink)]">
        {blog.title}
      </h3>

      {blog.excerpt && (
        <p className="line-clamp-3 text-sm leading-relaxed text-[var(--color-ink)]/80">{blog.excerpt}</p>
      )}

      {blog.tags?.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {blog.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs font-medium text-[var(--color-muted)]">#{tag}</span>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-[var(--color-rule)] pt-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center bg-[var(--color-accent)] text-xs font-bold text-[var(--color-ink)]">
            {displayAuthor(blog.author_name).charAt(0).toUpperCase()}
          </div>
          <span className="max-w-[100px] truncate text-xs text-[var(--color-ink)]">{displayAuthor(blog.author_name)}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-[var(--color-muted)]">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" aria-hidden />{blog.read_time}m</span>
          <span className="flex items-center gap-1"><Eye className="h-3 w-3" aria-hidden />{blog.views}</span>
        </div>
      </div>

      {blog.published_at && (
        <p className="-mt-1 text-xs text-[var(--color-muted)]">{formatDate(blog.published_at)}</p>
      )}
    </Link>
  );
}
