// Minimal, safe markdown -> HTML for blog posts. Output is styled by `.prose-content` in index.css.

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function inline(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
      const safe = /^https?:\/\//i.test(url) || /^mailto:/i.test(url) || url.startsWith('/') || url.startsWith('#');
      if (!safe) return text;
      const external = /^https?:\/\//i.test(url);
      return `<a href="${url.replace(/"/g, '%22')}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${text}</a>`;
    });
}

export function renderMarkdown(md: string): string {
  const lines = esc(md.replace(/\r\n/g, '\n')).split('\n');
  const out: string[] = [];
  let para: string[] = [];
  let list: { tag: 'ul' | 'ol'; items: string[] } | null = null;

  const flushPara = () => {
    if (para.length) out.push(`<p>${para.map(inline).join('<br/>')}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list) out.push(`<${list.tag}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.tag}>`);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    let m: RegExpMatchArray | null;

    if (!line.trim()) { flushPara(); flushList(); continue; }

    if ((m = line.match(/^###\s+(.+)/))) { flushPara(); flushList(); out.push(`<h3>${inline(m[1])}</h3>`); continue; }
    if ((m = line.match(/^#{1,2}\s+(.+)/))) { flushPara(); flushList(); out.push(`<h2>${inline(m[1])}</h2>`); continue; }
    if ((m = line.match(/^&gt;\s?(.+)/))) { flushPara(); flushList(); out.push(`<blockquote>${inline(m[1])}</blockquote>`); continue; }

    if ((m = line.match(/^[-*]\s+(.+)/))) {
      flushPara();
      if (!list || list.tag !== 'ul') { flushList(); list = { tag: 'ul', items: [] }; }
      list.items.push(m[1]);
      continue;
    }
    if ((m = line.match(/^\d+\.\s+(.+)/))) {
      flushPara();
      if (!list || list.tag !== 'ol') { flushList(); list = { tag: 'ol', items: [] }; }
      list.items.push(m[1]);
      continue;
    }

    flushList();
    para.push(line);
  }
  flushPara();
  flushList();
  return out.join('\n');
}
