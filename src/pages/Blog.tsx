import { useState, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PenLine, BookOpen, Search, X } from 'lucide-react';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import Header from '@/components/Header';
import SEO from '@/components/SEO';
import { BlogCard } from '@/components/blog/BlogCard';
import { BlogFilters } from '@/components/blog/BlogFilters';
import { usePublishedBlogs } from '@/hooks/useBlogs';
import type { BlogType } from '@/lib/blog-utils';
import { useGsapReveal } from '@/hooks/useGsapReveal';

type FilterType = BlogType | 'all';

export default function Blog() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const page = useRef<HTMLDivElement>(null);
  const { blogs, loading } = usePublishedBlogs(activeFilter === 'all' ? undefined : activeFilter);

  const filteredBlogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return blogs;
    return blogs.filter(b =>
      b.title.toLowerCase().includes(q) ||
      b.excerpt?.toLowerCase().includes(q) ||
      b.tags?.some(t => t.toLowerCase().includes(q))
    );
  }, [blogs, searchQuery]);

  useGsapReveal(page, [loading]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Harry The Blaze — Community Blogs',
    description: 'Real interview experiences, aptitude strategies, and placement success stories shared by students.',
    url: 'https://www.harrytheblaze.site/blog',
    publisher: {
      '@type': 'Organization',
      name: 'Harry The Blaze',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.harrytheblaze.site/favicon.svg',
      },
    },
  };

  const BTN =
    "inline-flex flex-shrink-0 items-center gap-2 self-start bg-[var(--color-accent)] px-5 py-3 text-[15px] font-semibold text-[var(--color-ink)] shadow-[var(--shadow-offset)] transition-[transform,box-shadow] duration-[120ms] hover:translate-x-px hover:translate-y-px hover:shadow-[3px_3px_0_var(--color-ink)] active:translate-x-1 active:translate-y-1 active:shadow-none sm:self-auto";

  return (
    <div ref={page} className="relative min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)]">
      <SEO
        title="Campus Placement Blogs | Harry The Blaze"
        description="Real interview experiences, aptitude strategies, resume tips, and placement success stories — shared by students, for students."
        canonical="https://www.harrytheblaze.site/blog"
        keywords="campus placement blogs, interview experience, aptitude strategy, placement success story, resume tips, off campus placement India, Harry The Blaze"
        jsonLd={jsonLd}
      />
      <Header />

      <main className="relative z-10 mx-auto max-w-[1360px] px-4 pb-24 pt-28 sm:px-8 lg:px-12">
        <div className="mb-12 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p data-intro className="mb-3 text-base font-medium text-[var(--color-muted)]">Community blogs</p>
            <h1
              data-intro
              className="font-display font-normal uppercase leading-[0.92] tracking-[0.005em]"
              style={{ fontSize: 'clamp(3rem, 8vw, 6.5rem)' }}
            >
              Placement insights, from students like you.
            </h1>
            <p data-intro className="mt-5 max-w-[46ch] text-lg leading-snug">
              Real interview experiences, aptitude strategies, and success stories, shared by the community.
            </p>
          </div>

          <div data-intro>
            <SignedIn>
              <button onClick={() => navigate('/blog/write')} className={BTN}>
                <PenLine className="h-4 w-4" aria-hidden />
                Write a Blog
              </button>
            </SignedIn>
            <SignedOut>
              <Link to="/login" className={BTN}>
                <PenLine className="h-4 w-4" aria-hidden />
                Sign in to Write
              </Link>
            </SignedOut>
          </div>
        </div>

        <div data-intro className="mb-10 space-y-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" aria-hidden />
            <input
              type="text"
              aria-label="Search blogs"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by title, keyword or tag…"
              className="w-full border-[1.5px] border-[var(--color-ink)] bg-[var(--color-paper-3)] py-2.5 pl-9 pr-9 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <BlogFilters active={activeFilter} onChange={setActiveFilter} />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-60 animate-pulse bg-[var(--color-paper-2)]" />
            ))}
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="flex flex-col items-start py-20">
            <BookOpen className="mb-5 h-8 w-8" aria-hidden />
            <h3 className="font-display text-4xl font-normal uppercase leading-none">
              {searchQuery ? 'No results found' : 'No blogs yet'}
            </h3>
            <p className="mt-3 max-w-md text-base leading-relaxed">
              {searchQuery
                ? `No blogs match "${searchQuery}". Try a different keyword or clear the search.`
                : activeFilter === 'all'
                  ? 'Be the first to share your placement experience with the community.'
                  : 'No blogs in this category yet. Try a different filter or write the first one.'}
            </p>
            {searchQuery ? (
              <button onClick={() => setSearchQuery('')} className={`${BTN} mt-7 !bg-[var(--color-paper-3)]`}>
                <X className="h-4 w-4" aria-hidden />
                Clear search
              </button>
            ) : (
              <SignedIn>
                <button onClick={() => navigate('/blog/write')} className={`${BTN} mt-7`}>
                  <PenLine className="h-4 w-4" aria-hidden />
                  Write the first blog
                </button>
              </SignedIn>
            )}
          </div>
        ) : (
          <div data-reveal-group className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBlogs.map(blog => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>
        )}

        <SignedIn>
          <div className="mt-14">
            <Link
              to="/blog/my"
              className="text-base font-medium underline decoration-[var(--color-rule)] underline-offset-4 hover:decoration-[var(--color-ink)]"
            >
              View my submitted blogs →
            </Link>
          </div>
        </SignedIn>
      </main>
    </div>
  );
}
