// Turns a row of the `feedback` table into something the admin page can show.
// Three kinds of rows live in that table:
//   - "Feature Request": from the "Tell us what to build next" form (readable record in technical_round_exp)
//   - "Platform Feedback": older plain-text suggestions / bug reports
//   - anything else: the prep survey (company, rounds, college, ...)

export interface FeedbackRow {
  id: string;
  created_at: string;
  user_id: string | null;
  name: string | null;
  college: string | null;
  mobile_number: string | null;
  graduating_year: string | null;
  placement_type: string | null;
  target_company: string | null;
  preparing_for: string | null;
  help_needed: string | null;
  technical_round_exp: string | null;
}

export type FeedbackKind = "feature" | "feedback" | "survey";

export interface ParsedFeedback {
  kind: FeedbackKind;
  features: string[];
  otherFeature: string;
  message: string;
  notifyEmail: string;
  rounds: string[];
}

const clean = (v: string | null | undefined) => (v ?? "").trim();

export function parseFeedback(r: FeedbackRow): ParsedFeedback {
  const kind: FeedbackKind =
    r.placement_type === "Feature Request" ? "feature" : r.placement_type === "Platform Feedback" ? "feedback" : "survey";
  const text = clean(r.technical_round_exp);
  const lines = text.split("\n").map((l) => l.trim());
  const get = (prefix: string) => lines.find((l) => l.startsWith(prefix))?.slice(prefix.length).trim() ?? "";

  const features = get("Features wanted:").split(";").map((f) => f.trim()).filter(Boolean);
  const otherFeature = get("Other feature:");
  const notifyEmail = get("Notify me when it ships:");
  let message = get("Feedback:");
  // Older platform feedback was saved as plain text with no labels.
  if (!message && kind !== "survey" && !features.length && !otherFeature) message = text;

  return {
    kind, features, otherFeature, message, notifyEmail,
    rounds: clean(r.preparing_for).split(",").map((x) => x.trim()).filter(Boolean),
  };
}

/** How many people asked for each feature (feature requests only), most-requested first. */
export function tallyFeatures(rows: FeedbackRow[]): Array<{ feature: string; count: number }> {
  const t = new Map<string, number>();
  for (const r of rows) {
    if (parseFeedback(r).kind !== "feature") continue;
    for (const f of parseFeedback(r).features) t.set(f, (t.get(f) ?? 0) + 1);
  }
  return [...t.entries()].map(([feature, count]) => ({ feature, count })).sort((a, b) => b.count - a.count);
}
