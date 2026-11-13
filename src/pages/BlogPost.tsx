import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Eye, Calendar, Share2, Check, PenLine } from 'lucide-react';
import Header from '@/components/Header';
import SEO from '@/components/SEO';
import { BlogTypeTag } from '@/components/blog/BlogTypeTag';
import { useBlogBySlug, useRelatedBlogs } from '@/hooks/useBlogs';
import { formatDate, displayAuthor, BLOG_TYPES } from '@/lib/blog-utils';
import { renderMarkdown, extractHeadings } from '@/lib/blog-markdown';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { blog, loading, error } = useBlogBySlug(slug ?? '');
  const { blogs: relatedBlogs } = useRelatedBlogs(blog?.type ?? '', slug ?? '');
  const [readProgress, setReadProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setReadProgress(total > 0 ? Math.min(100, (scrolled / total) * 100) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: blog?.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-paper)' }}>
        <Header />
        <main className="container mx-auto px-6 pt-28 pb-20 max-w-2xl">
          <div className="animate-pulse space-y-5">
            <div className="h-4 w-16 bg-[var(--color-paper-2)]-full" />
            <div className="h-10 w-3/4 bg-[var(--color-paper-2)]" />
            <div className="h-4 w-1/2 bg-[var(--color-paper-2)]" />
            <div className="h-px bg-[var(--color-paper-2)] w-full" />
            <div className="space-y-3 pt-6">
              {[100, 92, 97, 85, 90].map((w, i) => (
                <div key={i} className="h-4 bg-[var(--color-paper-2)]" style={{ width: `${w}%` }} />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-paper)' }}>
        <Header />
        <main className="container mx-auto px-6 pt-28 pb-20 max-w-2xl text-center">
          <div className="w-16 h-16 bg-[var(--color-paper-3)] flex items-center justify-center mx-auto mb-5 shadow-[var(--shadow-sheet)]">
            <span className="text-2xl">🔍</span>
          </div>
          <h2 className="font-display font-normal uppercase text-[var(--color-ink)] text-5xl mb-3">Blog not found</h2>
          <p className="text-[var(--color-ink)] text-base mb-7">
            This post may have been removed or the link is incorrect.
          </p>
          <button
            onClick={() => navigate('/blog')}
            className="px-5 py-2.5 text-[15px] font-semibold text-[var(--color-ink)] bg-[var(--color-accent)] shadow-[var(--shadow-offset)] active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            Back to Blogs
          </button>
        </main>
      </div>
    );
  }

  const canonicalUrl = `https://www.harrytheblaze.site/blog/${blog.slug}`;
  const authorDisplay = displayAuthor(blog.author_name);
  const blogTypeLabel = BLOG_TYPES[blog.type]?.label ?? 'Blog';
  const headings = extractHeadings(blog.content);
  const seoKeywords = [
    blogTypeLabel,
    ...(blog.tags ?? []),
    'campus placement', 'Harry The Blaze', 'placement preparation',
  ].join(', ');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    description: blog.excerpt ?? '',
    datePublished: blog.published_at ?? blog.created_at,
    dateModified: blog.updated_at,
    author: {
      '@type': 'Person',
      name: authorDisplay,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Harry The Blaze',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.harrytheblaze.site/favicon.svg',
      },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
    keywords: seoKeywords,
    url: canonicalUrl,
    timeRequired: `PT${blog.read_time}M`,
  };

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--color-paper)' }}>
      <SEO
        title={`${blog.title} | Harry The Blaze`}
        description={blog.excerpt ?? `${blogTypeLabel} — ${blog.title}`}
        type="article"
        canonical={canonicalUrl}
        keywords={seoKeywords}
        publishedTime={blog.published_at ?? blog.created_at}
        authorName={authorDisplay}
        jsonLd={jsonLd}
      />
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-[2px]" style={{ background: 'var(--color-rule)' }}>
        <div
          className="h-full transition-all duration-75"
          style={{
            width: `${readProgress}%`,
            background: 'var(--color-accent)',
          }}
        />
      </div>

      <Header />

        <main className="relative z-10 mx-auto w-full max-w-[1100px] px-5 sm:px-8 pt-24 sm:pt-28 pb-24">
        {/* Back */}
        <button
          onClick={() => navigate('/blog')}
          className="flex items-center gap-1.5 text-[15px] text-[var(--color-ink)] underline decoration-[var(--color-rule)] underline-offset-4 hover:decoration-[var(--color-ink)] mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          All Blogs
        </button>

        <article>
          {/* Header: full width */}
          <header className="max-w-[56rem]">
            <div className="flex items-center gap-x-3 gap-y-1.5 flex-wrap mb-4">
              <BlogTypeTag type={blog.type} />
              {blog.tags?.slice(0, 4).map(t => (
                <span key={t} className="text-xs font-medium text-[var(--color-muted)]">#{t}</span>
              ))}
            </div>

            <h1
              className="font-display font-normal uppercase text-[var(--color-ink)] leading-[1.02] tracking-[0.005em] [text-wrap:balance]"
              style={{ fontSize: 'clamp(2rem, 4.6vw, 3.5rem)' }}
            >
              {blog.title}
            </h1>

            <div
              className="flex items-center gap-x-3 gap-y-2 flex-wrap py-3.5 mt-6"
              style={{ borderTop: '2px solid var(--color-ink)', borderBottom: '1px solid var(--color-rule)' }}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 flex items-center justify-center text-[12px] font-bold text-[var(--color-ink)] flex-shrink-0 bg-[var(--color-accent)]">
                  {authorDisplay.charAt(0).toUpperCase()}
                </div>
                <span className="text-[14px] font-semibold text-[var(--color-ink)]">{authorDisplay}</span>
              </div>
              <span className="text-[var(--color-muted)] select-none">·</span>
              <span className="flex items-center gap-1 text-[13px] text-[var(--color-muted)]">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                {blog.published_at ? formatDate(blog.published_at) : formatDate(blog.created_at)}
              </span>
              <span className="flex items-center gap-1 text-[13px] text-[var(--color-muted)]">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                {blog.read_time} min read
              </span>
              <span className="flex items-center gap-1 text-[13px] text-[var(--color-muted)]">
                <Eye className="w-3.5 h-3.5 flex-shrink-0" />
                {blog.views} views
              </span>
              <button
                onClick={handleShare}
                className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold text-[var(--color-ink)] shadow-[3px_3px_0_var(--color-ink)] transition-[transform,box-shadow] duration-[120ms] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none ${
                  copied ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-paper-3)]'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Share'}
              </button>
            </div>
          </header>

          {/* Body + sidebar */}
          <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,44rem)_minmax(0,1fr)] lg:gap-16">
            <div className="min-w-0">
              {blog.excerpt && (
                <p
                  className="text-[18px] text-[var(--color-ink)] leading-relaxed mb-8 pl-4 py-1"
                  style={{ borderLeft: '4px solid var(--color-accent)' }}
                >
                  {blog.excerpt}
                </p>
              )}

              <div className="prose-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(blog.content) }} />

              <div className="mt-12 flex items-center justify-between flex-wrap gap-3">
                <button
                  onClick={() => navigate('/blog')}
                  className="flex items-center gap-1.5 text-[15px] text-[var(--color-ink)] underline decoration-[var(--color-rule)] underline-offset-4 hover:decoration-[var(--color-ink)] group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  Back to all blogs
                </button>
                <Link
                  to="/blog/write"
                  className="flex items-center gap-2 px-4 py-2.5 font-semibold text-[14px] text-[var(--color-ink)] bg-[var(--color-accent)] shadow-[var(--shadow-offset)] transition-[transform,box-shadow] duration-[120ms] hover:translate-x-px hover:translate-y-px active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  <PenLine className="w-3.5 h-3.5" />
                  Write your own
                </Link>
              </div>
            </div>

            {/* Sidebar: sticky on desktop */}
            <aside className="min-w-0">
              <div className="lg:sticky lg:top-28 space-y-6">
                {headings.length > 1 && (
                  <nav aria-label="On this page" className="hidden lg:block">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)] mb-3">On this page</p>
                    <ol className="space-y-2 border-l border-[var(--color-rule)]">
                      {headings.map(h => (
                        <li key={h.id}>
                          <a
                            href={`#${h.id}`}
                            className="block -ml-px border-l-2 border-transparent pl-4 py-0.5 text-[14px] leading-snug text-[var(--color-ink)] hover:border-[var(--color-accent)]"
                          >
                            {h.text}
                          </a>
                        </li>
                      ))}
                    </ol>
                  </nav>
                )}

                <div className="p-5 flex items-center gap-4 bg-[var(--color-paper-3)] shadow-[var(--shadow-sheet)]">
                  <div className="w-11 h-11 flex items-center justify-center text-base font-bold text-[var(--color-ink)] flex-shrink-0 bg-[var(--color-accent)]">
                    {authorDisplay.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-display font-normal uppercase text-[var(--color-ink)] text-xl leading-none">{authorDisplay}</p>
                    <p className="text-[13px] text-[var(--color-muted)] mt-1">Contributed to the community</p>
                  </div>
                </div>

                {relatedBlogs.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)] mb-3">More {blogTypeLabel}</p>
                    <div className="flex flex-col gap-3">
                      {relatedBlogs.map(r => (
                        <Link
                          key={r.id}
                          to={`/blog/${r.slug}`}
                          className="flex items-start gap-3 p-4 bg-[var(--color-paper-3)] shadow-[var(--shadow-card)] hover:-translate-y-0.5 transition-transform duration-200"
                        >
                          <span className="text-xl flex-shrink-0 leading-none mt-0.5">{r.cover_emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-display font-normal uppercase text-[var(--color-ink)] text-lg leading-tight line-clamp-2">{r.title}</p>
                            <p className="text-xs text-[var(--color-muted)] mt-1">{r.read_time} min read</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </article>
      </main>
    </div>
  );
}
