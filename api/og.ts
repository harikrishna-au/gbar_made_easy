// 1200x630 link-preview card for /placement/:code, e.g. what WhatsApp shows when the link is shared.
import { ImageResponse } from "@vercel/og";
import { fetchJob, money } from "./_job.js";

const INK = "#1a1613";
const ACCENT = "#f4592a";
const SHEET = "#f7f3ea";

type Node = { type: string; props: { style?: Record<string, unknown>; children?: unknown } };
const h = (style: Record<string, unknown>, ...children: unknown[]): Node => ({
  type: "div",
  props: { style: { display: "flex", ...style }, children: children.length === 1 ? children[0] : children },
});

async function loadFont(): Promise<ArrayBuffer | null> {
  try {
    const r = await fetch("https://cdn.jsdelivr.net/fontsource/fonts/anton@latest/latin-400-normal.woff");
    return r.ok ? await r.arrayBuffer() : null;
  } catch {
    return null;
  }
}

async function handler(req: Request): Promise<Response> {
  const code = new URL(req.url).searchParams.get("code");
  const [job, font] = await Promise.all([fetchJob(code), loadFont()]);

  const title = job?.title ?? "New job opening";
  const company = job?.company ?? "";
  const chips = job ? [money(job), job.location, job.type].filter(Boolean) as string[] : [];
  const size = title.length > 60 ? 60 : title.length > 36 ? 76 : 92;
  const display = font ? "Anton" : "sans-serif";

  const card = h(
    { width: "100%", height: "100%", flexDirection: "column", background: INK, color: SHEET, padding: 56, fontFamily: display },
    h(
      { alignItems: "center", justifyContent: "space-between" },
      h({ fontSize: 34, letterSpacing: 2, textTransform: "uppercase" }, "Harry The Blaze"),
      h({ background: ACCENT, color: INK, fontSize: 30, padding: "8px 22px", letterSpacing: 3, textTransform: "uppercase" }, "Now hiring"),
    ),
    h(
      { flexDirection: "column", flexGrow: 1, justifyContent: "center" },
      company ? h({ fontSize: 44, color: ACCENT, textTransform: "uppercase", marginBottom: 12 }, company) : h({}, ""),
      h({ fontSize: size, lineHeight: 1.05, textTransform: "uppercase" }, title.slice(0, 90)),
      h(
        { marginTop: 32, flexWrap: "wrap" },
        ...chips.map((c) => h({ border: `3px solid ${SHEET}`, fontSize: 32, padding: "6px 20px", marginRight: 16, marginBottom: 12 }, c)),
      ),
    ),
    h(
      { alignItems: "center", justifyContent: "space-between", borderTop: `4px solid ${ACCENT}`, paddingTop: 24 },
      h({ fontSize: 40, textTransform: "uppercase" }, "Apply ASAP"),
      h({ fontSize: 30, color: "#b9b0a4" }, "harrytheblaze.site"),
    ),
  );

  return new ImageResponse(card as any, {
    width: 1200,
    height: 630,
    fonts: font ? [{ name: "Anton", data: font, style: "normal", weight: 400 }] : undefined,
    headers: { "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}

// Node runtime with a web-standard handler: @vercel/og can't be bundled as an Edge Function outside Next.js.
export default { fetch: handler };
