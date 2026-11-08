// Shared visual tokens for the Infosys / HackWithInfy section.
// The palette is deliberately limited to one primary (ink, matching the site theme), one accent
// (flame orange — reserved for the SP track) and a neutral, so every page in the
// section reads as one product instead of six unrelated colour schemes.

export type Tone = { color: string; bg: string; border: string };

export const INFY_BLUE = "#1c1a18";
export const INFY_DARK = "#000000";
export const INFY_BG = "rgba(28,26,24,0.06)";
export const INFY_BDR = "rgba(28,26,24,0.18)";
export const INFY_GLOW = "rgba(28,26,24,0.10)";

export const GOLD = "#C2410C";
export const GOLD_DARK = "#9A3412";
export const GOLD_BG = "rgba(242,106,61,0.12)";
export const GOLD_BDR = "rgba(242,106,61,0.38)";

export const NEUTRAL = "#78716C";
export const NEUTRAL_BG = "rgba(120,113,108,0.07)";
export const NEUTRAL_BDR = "rgba(120,113,108,0.2)";

export const PRIMARY_TONE: Tone = { color: INFY_BLUE, bg: INFY_BG, border: INFY_BDR };
export const ACCENT_TONE: Tone = { color: GOLD, bg: GOLD_BG, border: GOLD_BDR };
export const NEUTRAL_TONE: Tone = { color: NEUTRAL, bg: NEUTRAL_BG, border: NEUTRAL_BDR };

// Difficulty escalates in visual weight within the accent hue rather than using
// a separate green/amber/red scale, which would reintroduce three more colours.
export const DIFF_STYLES: Record<"Easy" | "Medium" | "Hard", Tone> = {
  Easy: NEUTRAL_TONE,
  Medium: ACCENT_TONE,
  Hard: { color: GOLD_DARK, bg: "rgba(154,52,18,0.14)", border: "rgba(154,52,18,0.4)" },
};
