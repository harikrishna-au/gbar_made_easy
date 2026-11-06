import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface FeaturedExpert {
  id: string;
  name: string;
  title: string | null;
  company: string | null;
  photo_url: string | null;
  price_inr: number;
  proof_url: string | null;
}

// Matches the real Connect flow: pay first, the team confirms, one link goes to both sides.
const STEPS = ["Pick a senior and a slot.", "Pay to hold it.", "We email one meeting link to both of you."];

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const RowSkeleton = () => (
  <div className="flex h-[76px] items-center gap-4 border-t border-border py-3">
    <Skeleton className="h-14 w-14 rounded-sm" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-3.5 w-2/5" />
      <Skeleton className="h-3.5 w-3/5" />
    </div>
  </div>
);

export const ConnectFeature = () => {
  const [experts, setExperts] = useState<FeaturedExpert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8_000);

    (async () => {
      try {
        const { data } = await supabase
          .from("experts")
          .select("id, name, title, company, photo_url, price_inr, proof_url")
          .eq("approved", true)
          .order("created_at", { ascending: false })
          .limit(12)
          .abortSignal(controller.signal);
        if (data) setExperts(data as FeaturedExpert[]);
      } catch {
        // Network error or timeout: the section still works without the roster.
      } finally {
        clearTimeout(timer);
        setLoading(false);
      }
    })();

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  const preview = experts.slice(0, 4);
  const extra = Math.max(experts.length - preview.length, 0);
  const fromPrice = experts.length ? Math.min(...experts.map((e) => e.price_inr)) : null;

  return (
    <Card
      id="onboarding-connect-card"
      role="region"
      aria-labelledby="connect-feature-title"
      className="rounded-md border-foreground bg-card shadow-[4px_4px_0_0_hsl(var(--foreground))] sm:shadow-[6px_6px_0_0_hsl(var(--foreground))]"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* Left: the offer */}
        <div className="flex min-w-0 flex-col p-5 sm:p-8 lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Connect 1:1 · 20 minutes
          </p>

          <h2
            id="connect-feature-title"
            className="mt-3 max-w-xl font-['Merriweather'] text-3xl font-bold leading-[1.15] tracking-tight text-foreground sm:text-4xl"
          >
            Talk to someone who just got placed.
          </h2>

          <p className="mt-4 max-w-lg text-base leading-relaxed text-foreground/80">
            A live call with a senior who cleared the round you are facing. People usually ask what was actually
            asked, how the rounds ran, for resume feedback, and what to prep first.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Button asChild size="lg" className="group h-12 gap-2 px-6 text-[15px] font-semibold">
              <Link to="/connect">
                Book a call
                <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </Button>
            {fromPrice !== null && (
              <span className="text-sm text-foreground/80">
                from <span className="font-semibold tabular-nums text-foreground">{inr(fromPrice)}</span>
              </span>
            )}
          </div>

          <ol className="mt-8 border-t border-border">
            {STEPS.map((label, i) => (
              <li key={label} className="flex items-baseline gap-4 border-b border-border py-3">
                <span className="w-5 font-['Merriweather'] text-lg font-bold tabular-nums text-foreground">{i + 1}</span>
                <span className="text-[15px] text-foreground/90">{label}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Right: roster of real seniors */}
        <div className="min-w-0 border-t border-foreground bg-background/60 p-5 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Seniors you can book
          </h3>

          <div>
            {loading && [0, 1, 2].map((i) => <RowSkeleton key={i} />)}

            {!loading &&
              preview.map((e) => (
                <Link
                  key={e.id}
                  to={`/connect/${e.id}`}
                  className="-mx-2 flex items-center gap-4 border-t border-border px-2 py-3 transition-colors duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <Avatar className="h-14 w-14 rounded-sm">
                    {e.photo_url && <AvatarImage src={e.photo_url} alt="" className="object-cover" />}
                    <AvatarFallback className="rounded-sm bg-muted font-['Merriweather'] text-xl text-foreground">
                      {e.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-base font-semibold text-foreground">
                      <span className="truncate">{e.name}</span>
                      {e.proof_url && (
                        <BadgeCheck className="h-4 w-4 flex-shrink-0 text-primary" aria-label="Placement proof on file" />
                      )}
                    </span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {[e.title, e.company].filter(Boolean).join(", ") || "Recently placed"}
                    </span>
                  </span>
                  <span className="flex-shrink-0 text-sm font-semibold tabular-nums text-foreground">
                    {inr(e.price_inr)}
                  </span>
                </Link>
              ))}

            {!loading && preview.length === 0 && (
              <p className="border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">
                No seniors listed right now. Open Connect to see who is available this week.
              </p>
            )}

            {!loading && preview.length > 0 && <div className="border-t border-border" />}
          </div>

          {!loading && extra > 0 && (
            <Button asChild variant="link" className="mt-1 h-11 gap-1.5 px-0 font-semibold text-foreground">
              <Link to="/connect">
                See all {experts.length} seniors
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
