import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAdmin } from "../_shared/guard.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-key",
};

const ok  = (body: unknown) => new Response(JSON.stringify(body), { headers: { ...cors, "Content-Type": "application/json" } });
const err = (msg: string, status = 400) => new Response(JSON.stringify({ error: msg }), { status, headers: { ...cors, "Content-Type": "application/json" } });

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const denied = requireAdmin(req, cors, { scope: "parse-job", max: 60 });
  if (denied) return denied;

  try {
    const body = await req.json();
    const raw = typeof body?.raw === "string" ? body.raw.slice(0, 8000) : "";
    if (!raw.trim()) return err("No text provided.");

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return err("OPENAI_API_KEY not configured.", 500);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a job-listing parser. Extract structured data from raw job text and return ONLY valid JSON with these exact keys:
title (string), company (string), type (one of: "Internship" | "Full-time" | "Part-time"), location (string),
description (string — concise 2-3 sentence summary), apply_url (string or ""),
package_lpa (numeric string like "12" or "" if unknown), skills_required (array of skill strings).
If a field is not mentioned use an empty string or empty array. Never add extra keys.`,
          },
          { role: "user", content: raw },
        ],
      }),
    });

    if (!response.ok) {
      const e = await response.text();
      return err(`OpenAI error ${response.status}: ${e}`, 502);
    }

    const result = await response.json();
    const parsed = JSON.parse(result.choices[0].message.content);
    return ok(parsed);
  } catch (e: any) {
    console.error("[parse-job]", e);
    return err(e.message ?? "Unexpected error", 500);
  }
});
