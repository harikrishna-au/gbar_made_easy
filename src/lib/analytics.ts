/**
 * First-party analytics. Events go to the `analytics_events` table in our own Supabase
 * project (see supabase/migrations/20261114_analytics_events.sql). No third-party script.
 *
 * - never throws and never blocks the UI: every failure is swallowed
 * - stores no emails, names or payment ids: only a random browser id and the Clerk user id
 * - off in development, for Do Not Track, and for automated browsers
 */
type Primitive = string | number | boolean | null;
export type EventProps = Record<string, Primitive | undefined>;

const ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/analytics_events`;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

const ANON_KEY = "hb_aid";
const SESSION_KEY = "hb_sid";
const UTM_KEY = "hb_utm";
const FLUSH_MS = 4000;
const BATCH = 10;

interface Row {
  event: string;
  anon_id: string;
  session_id: string;
  user_id: string | null;
  path: string;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  device: "mobile" | "desktop";
  is_pwa: boolean;
  props: Record<string, Primitive> | null;
}

let queue: Row[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let userId: string | null = null;
let disabled = false;
let failures = 0;
let sessionMarked = false;

const enabled = () =>
  typeof window !== "undefined" &&
  !disabled &&
  !!KEY &&
  !import.meta.env.DEV &&
  navigator.doNotTrack !== "1" &&
  !navigator.webdriver;

function safeGet(store: Storage, key: string): string | null {
  try { return store.getItem(key); } catch { return null; }
}
function safeSet(store: Storage, key: string, value: string) {
  try { store.setItem(key, value); } catch { /* private mode: fine */ }
}

function randomId(): string {
  try { return crypto.randomUUID(); } catch { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
}

function anonId(): string {
  let id = safeGet(localStorage, ANON_KEY);
  if (!id) { id = randomId(); safeSet(localStorage, ANON_KEY, id); }
  return id;
}

function sessionId(): string {
  let id = safeGet(sessionStorage, SESSION_KEY);
  if (!id) { id = randomId(); safeSet(sessionStorage, SESSION_KEY, id); }
  return id;
}

/** First-touch campaign tags, kept until the browser data is cleared. */
function utm(): { source: string | null; medium: string | null; campaign: string | null } {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = {
    source: params.get("utm_source") || params.get("ref") || params.get("referral"),
    medium: params.get("utm_medium"),
    campaign: params.get("utm_campaign"),
  };
  if (fromUrl.source || fromUrl.medium || fromUrl.campaign) {
    safeSet(localStorage, UTM_KEY, JSON.stringify(fromUrl));
    return fromUrl;
  }
  try {
    const saved = JSON.parse(safeGet(localStorage, UTM_KEY) || "null");
    if (saved) return saved;
  } catch { /* ignore */ }
  return { source: null, medium: null, campaign: null };
}

export function isStandalone(): boolean {
  try {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
  } catch { return false; }
}

function referrerHost(): string | null {
  try {
    if (!document.referrer) return null;
    const host = new URL(document.referrer).hostname;
    return host === window.location.hostname ? null : host.slice(0, 200);
  } catch { return null; }
}

function flush(useBeacon = false) {
  if (timer) { clearTimeout(timer); timer = null; }
  if (!queue.length || !enabled()) { queue = []; return; }
  const rows = queue;
  queue = [];
  try {
    fetch(ENDPOINT, {
      method: "POST",
      headers: {
        apikey: KEY as string,
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(rows),
      keepalive: useBeacon, // lets the request finish while the tab is closing
    })
      .then((res) => {
        if (res.ok) { failures = 0; return; }
        // Missing table / bad key: stop for this page load instead of spamming errors.
        if (res.status === 401 || res.status === 403 || res.status === 404) disabled = true;
        else if (++failures >= 3) disabled = true;
      })
      .catch(() => { if (++failures >= 3) disabled = true; });
  } catch { /* never break the app */ }
}

/** Record one event. Safe to call anywhere. */
export function track(event: string, props?: EventProps) {
  if (!enabled()) return;
  try {
    const tags = utm();
    const clean: Record<string, Primitive> = {};
    if (props) for (const [k, v] of Object.entries(props)) if (v !== undefined) clean[k] = v;

    queue.push({
      event: event.slice(0, 64),
      anon_id: anonId(),
      session_id: sessionId(),
      user_id: userId,
      path: window.location.pathname.slice(0, 300),
      referrer: event === "session_start" ? referrerHost() : null,
      utm_source: tags.source?.slice(0, 100) ?? null,
      utm_medium: tags.medium?.slice(0, 100) ?? null,
      utm_campaign: tags.campaign?.slice(0, 100) ?? null,
      device: window.innerWidth < 768 ? "mobile" : "desktop",
      is_pwa: isStandalone(),
      props: Object.keys(clean).length ? clean : null,
    });
    if (queue.length >= BATCH) flush();
    else if (!timer) timer = setTimeout(() => flush(), FLUSH_MS);
  } catch { /* never break the app */ }
}

/** Call when Clerk tells us who the visitor is (or null on sign-out). */
export function identify(id: string | null) {
  userId = id;
}

/** One `session_start` per browser tab session, fired with the first page view. */
export function markSessionStart() {
  if (sessionMarked) return;
  sessionMarked = true;
  if (!safeGet(sessionStorage, "hb_sid_started")) {
    safeSet(sessionStorage, "hb_sid_started", "1");
    track("session_start");
  }
}

/**
 * Turns a URL into the events we care about, so the pages themselves need no changes.
 * Every route also gets a plain `page_view`.
 */
export function eventsForPath(pathname: string): Array<[string, EventProps]> {
  const out: Array<[string, EventProps]> = [["page_view", {}]];
  const seg = pathname.replace(/\/+$/, "").split("/").filter(Boolean);

  if (seg[0] === "game" && seg[1]) {
    if (seg[1].startsWith("communication")) out.push(["communication_open", { round: seg[1] }]);
    else out.push(["game_open", { game: seg[1] }]);
  } else if (seg[0] === "dashboard" && seg[1]) {
    out.push(["company_open", { company: seg[1] }]);
  } else if (seg[0] === "hackwithinfy" || seg[0] === "coding-questions") {
    out.push(["infosys_open", { section: seg[0] === "hackwithinfy" ? seg[1] ?? "home" : "coding-questions" }]);
  } else if (seg[0] === "connect") {
    out.push(["connect_view", { expert_id: seg[1] ?? null }]);
  } else if (seg[0] === "ai-interview") {
    out.push(["ai_interview_open", { type: seg[1] ?? null }]);
  } else if (seg[0] === "blog") {
    out.push(["blog_open", { slug: seg[1] ?? null }]);
  }
  return out;
}

if (typeof window !== "undefined") {
  // Send what is left when the tab is hidden or closed.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush(true);
  });
  window.addEventListener("pagehide", () => flush(true));
}
