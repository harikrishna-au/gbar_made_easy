import { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const LEGACY_KEY = "cq_done_v1"; // progress used to live only in the browser

// The generated Supabase types don't know this table yet.
const table = () => (supabase as any).from("coding_progress");

/**
 * Ticked coding questions, stored in Supabase per signed-in user.
 * Signed-out visitors can tick items for the current visit only (nothing is kept).
 */
export function useCodingProgress() {
  const { user, isLoaded } = useUser();
  const userId = user?.id;
  const [done, setDone] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const doneRef = useRef(done);
  doneRef.current = done;

  useEffect(() => {
    if (!isLoaded) return;
    if (!userId) {
      setDone(new Set());
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await table().select("problem_id").eq("user_id", userId);
      if (cancelled) return;
      if (error) {
        toast.error("Could not load your progress. Refresh to try again.");
        setLoading(false);
        return;
      }
      const ids = new Set<string>((data ?? []).map((r: { problem_id: string }) => r.problem_id));

      // One-time move of anything ticked before progress was saved to the account.
      try {
        const raw = localStorage.getItem(LEGACY_KEY);
        const legacy: string[] = raw ? JSON.parse(raw) : [];
        const fresh = legacy.filter((id) => !ids.has(id));
        let moved = true;
        if (fresh.length) {
          const { error: upErr } = await table().upsert(
            fresh.map((problem_id) => ({ user_id: userId, problem_id })),
            { onConflict: "user_id,problem_id" },
          );
          if (upErr) moved = false;
          else fresh.forEach((id) => ids.add(id));
        }
        if (moved) localStorage.removeItem(LEGACY_KEY);
      } catch { /* storage unavailable or bad JSON: nothing to move */ }

      if (cancelled) return;
      setDone(ids);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [isLoaded, userId]);

  const toggle = useCallback(
    async (id: string) => {
      const wasDone = doneRef.current.has(id);
      setDone((prev) => {
        const next = new Set(prev);
        if (wasDone) next.delete(id);
        else next.add(id);
        return next;
      });
      if (!userId) return; // signed out: visit-only

      const { error } = wasDone
        ? await table().delete().eq("user_id", userId).eq("problem_id", id)
        : await table().upsert({ user_id: userId, problem_id: id }, { onConflict: "user_id,problem_id" });

      if (error) {
        setDone((prev) => {
          const next = new Set(prev);
          if (wasDone) next.add(id);
          else next.delete(id);
          return next;
        });
        toast.error("Could not save that. Check your connection.");
      }
    },
    [userId],
  );

  const reset = useCallback(
    async (ids: string[]) => {
      const prev = doneRef.current;
      setDone(new Set([...prev].filter((id) => !ids.includes(id))));
      if (!userId) return;
      const { error } = await table().delete().eq("user_id", userId).in("problem_id", ids);
      if (error) {
        setDone(prev);
        toast.error("Could not reset. Check your connection.");
      }
    },
    [userId],
  );

  return { done, toggle, reset, loading, signedIn: !!userId };
}
