// One definition of "the same coupon": ignore case and stray spaces, so
// "nandhu_insights", "NANDU_INSIGHTS " and "Nandu_Insights" are never counted apart.
// (validate-coupon already matches this way; recording and reporting now do too.)

export const normalizeCoupon = (code: unknown): string =>
  typeof code === "string" ? code.trim().toUpperCase() : "";

// Old rows stored a numeric hash instead of the real code; they carry no name, so skip them.
const isLegacyHash = (code: string) => /^-?\d+$/.test(code);

export interface CouponRow { coupon_code: string | null; created_at: string }
export interface CouponStat {
  code: string;
  count: number;
  firstUsed: string;
  lastUsed: string;
  variants: string[]; // the different spellings that were merged into this code
}

export function tallyCoupons(rows: CouponRow[]): CouponStat[] {
  const m = new Map<string, CouponStat & { seen: Set<string> }>();
  for (const r of rows) {
    const raw = typeof r.coupon_code === "string" ? r.coupon_code.trim() : "";
    const code = normalizeCoupon(raw);
    if (!code || isLegacyHash(code)) continue;
    let s = m.get(code);
    if (!s) { s = { code, count: 0, firstUsed: r.created_at, lastUsed: r.created_at, variants: [], seen: new Set() }; m.set(code, s); }
    s.count++;
    if (r.created_at < s.firstUsed) s.firstUsed = r.created_at;
    if (r.created_at > s.lastUsed) s.lastUsed = r.created_at;
    if (!s.seen.has(raw)) { s.seen.add(raw); s.variants.push(raw); }
  }
  return [...m.values()]
    .map(({ seen: _seen, ...s }) => s)
    .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code));
}
