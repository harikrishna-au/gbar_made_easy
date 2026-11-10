// Shared by the placement link-preview functions. Looks up one active job the same way
// src/pages/PlacementPage.tsx does: a UUID matches `id`, anything else matches `code`.
export type PreviewJob = {
  title: string;
  company: string | null;
  location: string | null;
  type: string | null;
  package_lpa: number | null;
  code: string | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function fetchJob(rawCode: string | null): Promise<PreviewJob | null> {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!rawCode || !url || !key) return null;
  const code = rawCode.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (!code) return null;
  const filter = UUID.test(code) ? `id=eq.${code}` : `code=ilike.${code}`;
  try {
    const res = await fetch(
      `${url}/rest/v1/jobs?select=title,company,location,type,package_lpa,code&active=eq.true&${filter}&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as PreviewJob[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export const money = (j: PreviewJob) => (j.package_lpa ? `₹${j.package_lpa} LPA` : null);
