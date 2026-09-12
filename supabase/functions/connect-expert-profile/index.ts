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

function text(value: unknown, max: number, nullable = true) {
  if (typeof value !== "string") return nullable ? null : "";
  const cleaned = value.trim().slice(0, max);
  return cleaned || (nullable ? null : "");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const userId = await verifyClerkToken(token);
  if (!userId) return json({ error: "Unauthorized" }, 401);

  try {
    const body = await req.json().catch(() => ({}));
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    if (body.action === "list") {
      const { data, error } = await supabase
        .from("experts")
        .select("id, name, title, bio, skills, photo_url, price_inr, company, interview_date, package_lpa, proof_url, email, approved, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return json({ experts: data ?? [] });
    }

    if (body.action === "messages" || body.action === "mark_read") {
      const { data: owned, error: ownedError } = await supabase
        .from("experts")
        .select("id")
        .eq("user_id", userId);
      if (ownedError) throw ownedError;
      const expertIds = (owned ?? []).map((expert) => expert.id);
      if (!expertIds.length) return json({ messages: [] });

      if (body.action === "mark_read") {
        if (!body.message_id) return json({ error: "message_id is required" }, 400);
        const { error } = await supabase
          .from("messages")
          .update({ is_read: true })
          .eq("id", body.message_id)
          .in("expert_id", expertIds);
        if (error) throw error;
        return json({ success: true });
      }

      const { data, error } = await supabase
        .from("messages")
        .select("id, expert_id, sender_name, sender_email, subject, body, is_read, created_at, experts(name)")
        .in("expert_id", expertIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return json({ messages: data ?? [] });
    }

    if (body.action !== "save") return json({ error: "Unknown action" }, 400);
    const profile = body.profile ?? {};
    const name = text(profile.name, 100, false);
    const company = text(profile.company, 100, false);
    const price = Number(profile.price_inr);
    if (!name || !company) return json({ error: "Name and company are required" }, 400);
    if (!Number.isInteger(price) || price < 0 || price > 100000) {
      return json({ error: "Enter a valid session price" }, 400);
    }

    const skills = Array.isArray(profile.skills)
      ? profile.skills.slice(0, 30).map((skill: unknown) => text(skill, 60, false)).filter(Boolean)
      : null;
    const payload = {
      name,
      email: text(profile.email, 254),
      title: text(profile.title, 160),
      bio: text(profile.bio, 2000),
      photo_url: text(profile.photo_url, 1000),
      skills: skills?.length ? skills : null,
      price_inr: price,
      company,
      interview_date: text(profile.interview_date, 10),
      package_lpa: profile.package_lpa == null ? null : Number(profile.package_lpa),
      proof_url: text(profile.proof_url, 1000),
      user_id: userId,
    };

    let expertId = body.expert_id as string | undefined;
    if (expertId) {
      const { data: owned } = await supabase
        .from("experts")
        .select("id")
        .eq("id", expertId)
        .eq("user_id", userId)
        .maybeSingle();
      if (!owned) return json({ error: "Expert profile not found" }, 404);
      const { error } = await supabase.from("experts").update(payload).eq("id", expertId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase
        .from("experts")
        .insert({ ...payload, approved: false })
        .select("id")
        .single();
      if (error) throw error;
      expertId = data.id;
    }

    const windows = Array.isArray(body.availability) ? body.availability : [];
    const normalizedWindows = windows.slice(0, 50).map((window: Record<string, unknown>) => ({
      expert_id: expertId,
      day_of_week: Number(window.day_of_week),
      start_time: text(window.start_time, 8, false),
      end_time: text(window.end_time, 8, false),
    }));
    if (normalizedWindows.some((window) =>
      !Number.isInteger(window.day_of_week) ||
      window.day_of_week < 0 ||
      window.day_of_week > 6 ||
      !window.start_time ||
      !window.end_time ||
      window.start_time >= window.end_time
    )) {
      return json({ error: "Availability contains an invalid time window" }, 400);
    }

    const { error: deleteError } = await supabase.from("availability").delete().eq("expert_id", expertId);
    if (deleteError) throw deleteError;
    if (normalizedWindows.length) {
      const { error: insertError } = await supabase.from("availability").insert(normalizedWindows);
      if (insertError) throw insertError;
    }

    return json({ success: true, expert_id: expertId });
  } catch (error) {
    console.error("[connect-expert-profile]", error);
    return json({ error: error instanceof Error ? error.message : "Could not save profile" }, 400);
  }
});
