// WhatsApp, LinkedIn, Telegram etc. don't run JavaScript, so the React app can't set link-preview tags.
// vercel.json routes /placement/:code here; we return the normal index.html with job-specific
// Open Graph tags injected. If anything fails we return the untouched page, so the app still loads.
import { fetchJob, money } from "./_job";

export const config = { runtime: "edge" };

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export default async function handler(req: Request): Promise<Response> {
  const origin = new URL(req.url).origin;
  const code = new URL(req.url).searchParams.get("code");
  const shell = await fetch(`${origin}/index.html`);
  let html = await shell.text();

  const job = await fetchJob(code);
  if (job) {
    const pageUrl = `${origin}/placement/${encodeURIComponent(job.code || code || "")}`;
    const title = job.company ? `${job.company} is hiring: ${job.title}` : `Now hiring: ${job.title}`;
    const facts = [money(job), job.location, job.type].filter(Boolean).join(" · ");
    const desc = `${facts ? facts + ". " : ""}Apply ASAP on Harry The Blaze. Tap to see the full details and apply link.`;
    const image = `${origin}/api/og?code=${encodeURIComponent(code || "")}`;

    const set = (re: RegExp, tag: string) => {
      html = re.test(html) ? html.replace(re, tag) : html.replace("</head>", `  ${tag}\n</head>`);
    };
    html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)} | Harry The Blaze</title>`);
    set(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${esc(pageUrl)}" />`);
    set(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(desc)}" />`);
    set(/<meta property="og:type"[^>]*>/, `<meta property="og:type" content="article" />`);
    set(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${esc(pageUrl)}" />`);
    set(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(title)}" />`);
    set(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(desc)}" />`);
    set(/<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${esc(image)}" />`);
    set(/<meta property="og:image:alt"[^>]*>/, `<meta property="og:image:alt" content="${esc(title)}" />`);
    set(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${esc(title)}" />`);
    set(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${esc(desc)}" />`);
    set(/<meta name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${esc(image)}" />`);
  }

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      // Job details can change (closed, edited), so keep the cache short.
      "cache-control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
