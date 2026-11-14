/** Same rule as the server: coupon codes ignore case and stray spaces. */
export const normalizeCoupon = (code: string | null | undefined): string => (code ?? "").trim().toUpperCase();
