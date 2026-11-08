import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Eye, Calendar, Share2, Check, PenLine } from 'lucide-react';
import Header from '@/components/Header';
import SEO from '@/components/SEO';
import { BlogTypeTag } from '@/components/blog/BlogTypeTag';
import { useBlogBySlug, useRelatedBlogs } from '@/hooks/useBlogs';
import { formatDate, displayAuthor, BLOG_TYPES } from '@/lib/blog-utils';

function renderMarkdown(md: string): string {
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^#{3}\s(.+)/gm, '<h4 style="font-family:Anton,Impact,sans-serif;font-weight:400;text-transform:uppercase;letter-spacing:0.005em;font-size:1.5rem;color:#1c1c1b;margin-top:2rem;margin-bottom:0.4rem;line-height:1.4">$1</h4>')
    .replace(/^#{2}\s(.+)/gm, '<h3 style="font-family:Anton,Impact,sans-serif;font-weight:400;text-transform:uppercase;letter-spacing:0.005em;font-size:1.9rem;color:#1c1c1b;margin-top:2.25rem;margin-bottom:0.5rem;line-height:1.4">$1</h3>')
    .replace(/^#{1}\s(.+)/gm, '<h2 style="font-family:Anton,Impact,sans-serif;font-weight:400;text-transform:uppercase;letter-spacing:0.005em;font-size:2.4rem;color:#1c1c1b;margin-top:2.75rem;margin-bottom:0.75rem;line-height:1.3">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:700;color:#1c1c1b">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="font-style:italic;color:#26221f">$1</em>')
    .replace(/`([^`]+)`/g, '<code style="padding:2px 7px;background:#ebe6dc;color:#1c1a18;font-size:13px;font-family:monospace">$1</code>')
    .replace(/^>\s(.+)/gm, '<blockquote style="padding:0.75rem 1rem;border-left:4px solid #f26a3d;color:#26221f;margin:1.25rem 0;background:#fdfcf9">$1</blockquote>')
    .replace(/^[-*]\s(.+)/gm, '<li style="margin-left:1.5rem;list-style-type:disc;color:#26221f;margin-top:5px;line-height:1.75">$1</li>')
    .replace(/^\d+\.\s(.+)/gm, '<li style="margin-left:1.5rem;list-style-type:decimal;color:#26221f;margin-top:5px;line-height:1.75">$1</li>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
      const safe = /^https?:\/\//i.test(url) || /^mailto:/i.test(url) || url.startsWith('/') || url.startsWith('#');
      if (!safe) return text;
      return `<a href="${url.replace(/"/g, '%22')}" style="color:#c2410c;text-decoration:underline;text-underline-offset:3px;font-weight:500" target="_blank" rel="noopener noreferrer">${text}</a>`;
    })
    .replace(/\n\n/g, '</p><p style="margin-top:1.25rem;color:#26221f;line-height:1.85;font-family:Inter,sans-serif;font-size:15.5px">')
    .replace(/\n/g, '<br/>');
}

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

      <main className="relative z-10 container mx-auto px-6 pt-28 pb-28 max-w-2xl">

        {/* Back button */}
        <button
          onClick={() => navigate('/blog')}
          className="flex items-center gap-1.5 text-[15px] text-[var(--color-ink)] underline decoration-[var(--color-rule)] underline-offset-4 hover:decoration-[var(--color-ink)] mb-10 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          All Blogs
        </button>

        <article>
          {/* Type + tags */}
          <div className="flex items-center gap-2 flex-wrap mb-5">
            <BlogTypeTag type={blog.type} />
            {blog.tags?.map(t => (
              <span
                key={t}
                className="text-xs font-medium text-[var(--color-muted)]"
              >
                #{t}
              </span>
            ))}
          </div>

          {/* Emoji */}
          <span className="text-5xl block mb-5 select-none">{blog.cover_emoji}</span>

          {/* Title */}
          <h1
            className="font-display font-normal uppercase text-[var(--color-ink)] leading-[0.98] tracking-[0.005em] mb-6"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4.25rem)' }}
          >
            {blog.title}
          </h1>

          {/* Meta row */}
          <div
            className="flex items-center gap-3 flex-wrap py-3.5 mb-8"
            style={{ borderTop: '2px solid var(--color-ink)', borderBottom: '1px solid var(--color-rule)' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 flex items-center justify-center text-[12px] font-bold text-[var(--color-ink)] flex-shrink-0 bg-[var(--color-accent)]"
              >
                {displayAuthor(blog.author_name).charAt(0).toUpperCase()}
              </div>
              <span className="text-[14px] font-semibold text-[var(--color-ink)]">{displayAuthor(blog.author_name)}</span>
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

          {/* Excerpt highlight */}
          {blog.excerpt && (
            <p
              className="text-[17px] text-[var(--color-ink)] leading-relaxed mb-8 pl-4"
              style={{ borderLeft: '4px solid var(--color-accent)' }}
            >
              {blog.excerpt}
            </p>
          )}

          {/* Content */}
          <div
            className="prose-content"
            style={{ fontFamily: 'Inter, sans-serif' }}
            dangerouslySetInnerHTML={{
              __html: `<p style="color:#26221f;line-height:1.85;font-family:Inter,sans-serif;font-size:15.5px">${renderMarkdown(blog.content)}</p>`,
            }}
          />

          {/* Divider */}
          <div className="mt-14 mb-8" style={{ borderTop: '2px solid var(--color-ink)' }} />

          {/* Author card */}
          <div
            className="p-5 flex items-center gap-4 bg-[var(--color-paper-3)] shadow-[var(--shadow-sheet)]"
          >
            <div
              className="w-12 h-12 flex items-center justify-center text-base font-bold text-[var(--color-ink)] flex-shrink-0 bg-[var(--color-accent)]"
            >
              {displayAuthor(blog.author_name).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-display font-normal uppercase text-[var(--color-ink)] text-2xl leading-none">{displayAuthor(blog.author_name)}</p>
              <p className="text-[13px] text-[var(--color-muted)] mt-1">
                Contributed to Harry The Blaze community
              </p>
            </div>
          </div>

          {/* Related posts */}
          {relatedBlogs.length > 0 && (
            <div className="mt-10">
              <p className="text-sm font-semibold text-[var(--color-ink)] mb-4">
                More {blogTypeLabel}
              </p>
              <div className="flex flex-col gap-3">
                {relatedBlogs.map(r => (
                  <Link
                    key={r.id}
                    to={`/blog/${r.slug}`}
                    className="flex items-start gap-3 p-4 bg-[var(--color-paper-3)] shadow-[var(--shadow-card)] hover:-translate-y-0.5 transition-transform duration-200 group"
                  >
                    <span className="text-2xl flex-shrink-0 leading-none mt-0.5">{r.cover_emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-normal uppercase text-[var(--color-ink)] text-xl leading-tight line-clamp-2">
                        {r.title}
                      </p>
                      <p className="text-xs text-[var(--color-muted)] mt-1">
                        {r.read_time} min read · {displayAuthor(r.author_name)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Bottom CTA */}
          <div className="mt-8 flex items-center justify-between flex-wrap gap-3">
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
        </article>
      </main>
    </div>
  );
}
