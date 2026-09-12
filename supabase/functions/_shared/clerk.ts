const JWKS_URL = "https://api.clerk.com/v1/jwks";
const JWKS_TTL_MS = 60 * 60 * 1000;

let cachedJwks: { keys: JsonWebKey[]; fetchedAt: number } | null = null;

export interface ClerkIdentity {
  userId: string;
  email: string | null;
  emails: string[];
}

function base64UrlToBytes(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function decodeJson(segment: string) {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(segment)));
}

async function getJwks(secret: string): Promise<JsonWebKey[]> {
  if (cachedJwks && Date.now() - cachedJwks.fetchedAt < JWKS_TTL_MS) {
    return cachedJwks.keys;
  }
  const response = await fetch(JWKS_URL, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (!response.ok) throw new Error("Could not load Clerk JWKS");
  const body = await response.json();
  cachedJwks = { keys: body.keys ?? [], fetchedAt: Date.now() };
  return cachedJwks.keys;
}

export async function verifyClerkToken(token: string): Promise<string | null> {
  const secret = Deno.env.get("CLERK_SECRET_KEY");
  if (!secret || !token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const header = decodeJson(parts[0]) as { kid?: string; alg?: string };
    const payload = decodeJson(parts[1]) as { sub?: string; exp?: number; nbf?: number };
    if (!payload.sub) return null;
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    if (payload.nbf && payload.nbf * 1000 > Date.now()) return null;

    const keys = await getJwks(secret);
    const jwk = keys.find((key) => (key as JsonWebKey & { kid?: string }).kid === header.kid);
    if (!jwk) return null;

    const alg = header.alg ?? "RS256";
    const isEcdsa = alg.startsWith("ES");
    const hash = alg.endsWith("384") ? "SHA-384" : alg.endsWith("512") ? "SHA-512" : "SHA-256";
    const key = await crypto.subtle.importKey(
      "jwk",
      jwk,
      isEcdsa
        ? { name: "ECDSA", namedCurve: (jwk as JsonWebKey).crv ?? "P-256" }
        : { name: "RSASSA-PKCS1-v1_5", hash },
      false,
      ["verify"],
    );

    const valid = await crypto.subtle.verify(
      isEcdsa ? { name: "ECDSA", hash } : "RSASSA-PKCS1-v1_5",
      key,
      base64UrlToBytes(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
    );
    return valid ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function getClerkUser(userId: string): Promise<ClerkIdentity | null> {
  const secret = Deno.env.get("CLERK_SECRET_KEY");
  if (!secret) return null;
  const response = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (!response.ok) return null;
  const user = await response.json();
  const entries = user.email_addresses ?? [];
  const emails = entries
    .map((entry: { email_address?: string }) => entry.email_address?.trim().toLowerCase())
    .filter(Boolean);
  const primary =
    entries.find((entry: { id?: string }) => entry.id === user.primary_email_address_id)
      ?.email_address?.trim().toLowerCase() ?? emails[0] ?? null;
  return { userId, email: primary, emails: [...new Set(emails)] as string[] };
}

export async function getClerkIdentity(req: Request): Promise<ClerkIdentity | null> {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const userId = await verifyClerkToken(token);
  if (!userId) return null;
  return getClerkUser(userId);
}
