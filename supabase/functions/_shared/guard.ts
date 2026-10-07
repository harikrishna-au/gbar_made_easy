import { verifyClerkToken } from "./clerk.ts";

// Guards for edge functions that spend our OpenAI budget.
//
// These functions run with verify_jwt = false (or accept the public anon key), so
// anyone who finds the URL could otherwise call them. Every caller must present a
// valid Clerk session token, and each user gets a small hourly allowance.

const hits = new Map<string, number[]>();

// Per-isolate sliding window. It is best-effort (a cold start or a second isolate
// gets a fresh window) but it stops a single signed-in account from looping the API.
export function rateLimited(key: string, max: number, windowMs = 60 * 60 * 1000): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  // Keep the map from growing without bound across many users.
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
  }
  return false;
}

function reply(status: number, error: string, cors: Record<string, string>) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

/** Returns the Clerk user id, or a ready-to-send 401 / 429 Response. */
export async function requireUser(
  req: Request,
  cors: Record<string, string>,
  opts: { scope: string; max: number },
): Promise<string | Response> {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const userId = await verifyClerkToken(token);
  if (!userId) return reply(401, "Please sign in again to use this feature.", cors);
  if (rateLimited(`${opts.scope}:${userId}`, opts.max)) {
    return reply(429, "You have reached the hourly limit for this feature. Try again later.", cors);
  }
  return userId;
}

function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

/** For admin-only tools: caller must send the Connect admin secret in x-admin-key. */
export function requireAdmin(
  req: Request,
  cors: Record<string, string>,
  opts: { scope: string; max: number },
): Response | null {
  const expected = Deno.env.get("CONNECT_ADMIN_SECRET");
  const provided = req.headers.get("x-admin-key") ?? "";
  if (!expected || !provided || !safeEqual(provided, expected)) {
    return reply(401, "Admin access required.", cors);
  }
  if (rateLimited(`${opts.scope}:admin`, opts.max)) {
    return reply(429, "Too many requests. Try again later.", cors);
  }
  return null;
}
