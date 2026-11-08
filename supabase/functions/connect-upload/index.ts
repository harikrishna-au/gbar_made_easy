import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyClerkToken } from "../_shared/clerk.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const BUCKETS = new Set(["expert-photos", "expert-proofs"]);
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};
const MAX_BYTES = 10 * 1024 * 1024;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const userId = await verifyClerkToken(token);
  if (!userId) return json({ error: "Unauthorized" }, 401);

  try {
    const form = await req.formData();
    const bucket = String(form.get("bucket") ?? "expert-photos");
    const file = form.get("file");
    if (!BUCKETS.has(bucket)) return json({ error: "Invalid bucket" }, 400);
    if (!(file instanceof File)) return json({ error: "No file provided" }, 400);
    const ext = TYPES[file.type];
    if (!ext) return json({ error: "Only JPG, PNG, WebP, GIF or PDF files are allowed" }, 400);
    if (file.size > MAX_BYTES) return json({ error: "File must be under 10MB" }, 400);
    if (bucket === "expert-photos" && ext === "pdf") return json({ error: "Photo must be an image" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const safeUser = userId.replace(/[^a-zA-Z0-9_-]/g, "");
    const path = `${safeUser}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return json({ url: data.publicUrl });
  } catch (error) {
    console.error("[connect-upload]", error);
    return json({ error: error instanceof Error ? error.message : "Upload failed" }, 400);
  }
});
