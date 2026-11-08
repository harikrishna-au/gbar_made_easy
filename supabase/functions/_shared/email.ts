// Shared, email-client-safe layout for Connect emails (table based, inline
// styles, system-font fallbacks for the display face). Matches the site theme:
// paper background, ink borders, flame-orange accent.

const INK = "#1a1613";
const PAPER = "#f7f4ec";
const SHEET = "#fffdf8";
const ACCENT = "#f4592a";
const MUTED = "#6b625a";
const RULE = "#d9d2c3";
const DISPLAY = "Anton,Impact,'Arial Narrow Bold','Helvetica Neue',Arial,sans-serif";
const BODY = "Inter,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";

export function esc(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/** "2026-11-08" -> "Sunday, 8 November 2026" */
export function prettyDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00+05:30`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

/** "15:00:00" -> "3:00 PM" */
export function prettyTime(value: string): string {
  const [h, m] = value.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return value;
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function detailRows(rows: Array<[string, string]>): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${
    rows
      .map(
        ([label, value], i) => `
    <tr>
      <td style="padding:13px 0;${i ? `border-top:1px dashed ${RULE};` : ""}font-family:${BODY};font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${MUTED};width:34%;vertical-align:top">${esc(label)}</td>
      <td style="padding:13px 0;${i ? `border-top:1px dashed ${RULE};` : ""}font-family:${BODY};font-size:15px;font-weight:700;color:${INK};text-align:right;vertical-align:top">${value}</td>
    </tr>`,
      )
      .join("")
  }</table>`;
}

export function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center" style="padding:6px 0 0">
    <a href="${esc(href)}" style="display:block;background:${ACCENT};color:${INK};font-family:${BODY};font-size:15px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;text-align:center;padding:16px 20px;border:2px solid ${INK};border-bottom-width:5px;border-right-width:5px">${esc(label)} &rarr;</a>
  </td></tr></table>`;
}

export function emailShell(params: {
  preheader: string;
  kicker: string;
  heading: string;
  intro: string; // trusted HTML (callers escape their own values)
  body: string; // trusted HTML
  footnote?: string;
}): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"></head>
<body style="margin:0;padding:0;background:${PAPER}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${PAPER}">${esc(params.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER}"><tr><td align="center" style="padding:28px 14px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${SHEET};border:2px solid ${INK};border-bottom-width:6px;border-right-width:6px">
    <tr><td style="background:${INK};padding:16px 28px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="font-family:${DISPLAY};font-size:20px;letter-spacing:.06em;text-transform:uppercase;color:#fff"><span style="color:${ACCENT}">&#9679;</span>&nbsp; Harry The Blaze</td>
        <td align="right" style="font-family:${BODY};font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#bdb4a8">${esc(params.kicker)}</td>
      </tr></table>
    </td></tr>
    <tr><td style="background:${ACCENT};height:6px;line-height:6px;font-size:0">&nbsp;</td></tr>
    <tr><td style="padding:32px 28px 8px">
      <h1 style="margin:0;font-family:${DISPLAY};font-weight:400;font-size:38px;line-height:1.05;letter-spacing:.01em;text-transform:uppercase;color:${INK}">${esc(params.heading)}</h1>
      <p style="margin:14px 0 0;font-family:${BODY};font-size:15px;line-height:1.65;color:#3d3630">${params.intro}</p>
    </td></tr>
    <tr><td style="padding:18px 28px 6px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border:2px solid ${INK}"><tr><td style="padding:6px 20px">${params.body}</td></tr></table>
    </td></tr>
    ${params.footnote ? `<tr><td style="padding:14px 28px 4px;font-family:${BODY};font-size:13px;line-height:1.6;color:${MUTED}">${params.footnote}</td></tr>` : ""}
    <tr><td style="padding:22px 28px 26px">
      <div style="border-top:1px solid ${RULE};padding-top:16px;font-family:${BODY};font-size:12px;line-height:1.6;color:${MUTED}">
        Need help? Just reply to this email or write to <a href="mailto:support@harrytheblaze.site" style="color:${INK};font-weight:700">support@harrytheblaze.site</a>.<br>
        <a href="https://www.harrytheblaze.site" style="color:${INK};font-weight:700;text-decoration:none">harrytheblaze.site</a> &middot; Campus placement prep, done right.
      </div>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}
