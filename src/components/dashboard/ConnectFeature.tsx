import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, CalendarCheck, CreditCard, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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

const TOPICS = ["What was actually asked", "How the rounds ran", "Resume feedback", "What to prep first"];

// Matches the real Connect flow: pay first, the team confirms, one link goes to both sides.
const STEPS = [
  { icon: CalendarCheck, label: "Pick a senior and a slot" },
  { icon: CreditCard, label: "Pay to hold it" },
  { icon: Link2, label: "We send one meeting link" },
];

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const ExpertRowSkeleton = () => (
  <div className="flex h-[72px] items-center gap-3 rounded-2xl border border-white/10 p-3">
    <Skeleton className="h-12 w-12 rounded-xl bg-white/10" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-3 w-2/5 bg-white/10" />
      <Skeleton className="h-3 w-3/5 bg-white/10" />
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
        // Network error or timeout: the card still works without the preview list.
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

  const preview = experts.slice(0, 3);
  const extra = Math.max(experts.length - preview.length, 0);
  const fromPrice = experts.length ? Math.min(...experts.map((e) => e.price_inr)) : null;

  return (
    <Card
      id="onboarding-connect-card"
      role="region"
      aria-labelledby="connect-feature-title"
      className="relative overflow-hidden rounded-3xl border-0 bg-stone-900 text-stone-50 shadow-[0_24px_60px_-24px_rgba(28,25,23,0.55)]"
    >
      {/* Soft moss glow; decorative only */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/25 blur-3xl"
      />

      <div className="relative grid grid-cols-1 gap-8 p-5 sm:p-9 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12 lg:p-12">
        {/* Left: the offer */}
        <div className="flex min-w-0 flex-col">
          <Badge
            variant="outline"
            className="mb-5 gap-2 self-start border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-stone-200"
          >
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8fb5a3] opacity-70 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#8fb5a3]" />
            </span>
            Connect 1:1 · Live call
          </Badge>

          <h2
            id="connect-feature-title"
            className="max-w-xl font-['Merriweather'] text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl lg:text-[2.6rem]"
          >
            Talk to someone who just got placed.
          </h2>

          <p className="mt-4 max-w-lg text-base leading-relaxed text-stone-300">
            20 minutes, live, with a senior who cleared the round you are facing. Ask what was actually asked and
            what to prep first.
          </p>

          <ul className="mt-5 flex flex-wrap gap-2" aria-label="What you can ask">
            {TOPICS.map((t) => (
              <li key={t}>
                <Badge variant="outline" className="border-white/15 px-3 py-1 text-[13px] font-normal text-stone-200">
                  {t}
                </Badge>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Button asChild size="lg" className="group h-12 gap-2 px-6 text-[15px] font-semibold">
              <Link to="/connect">
                Book a 20-min call
                <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </Button>
            {fromPrice !== null && (
              <span className="text-sm text-stone-300">
                from <span className="font-semibold tabular-nums text-white">{inr(fromPrice)}</span> per call
              </span>
            )}
          </div>

          <Separator className="mb-6 mt-8 bg-white/10" />

          <ol className="grid gap-3 sm:grid-cols-3">
            {STEPS.map(({ icon: Icon, label }, i) => (
              <li key={label} className="flex items-center gap-3 text-[13px] text-stone-300">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/10 text-stone-100">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span>
                  <span className="sr-only">Step {i + 1}: </span>
                  {label}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* Right: real seniors */}
        <div className="flex min-w-0 flex-col justify-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">Seniors you can book</p>

          <div className="space-y-3">
            {loading && [0, 1, 2].map((i) => <ExpertRowSkeleton key={i} />)}

            {!loading &&
              preview.map((e) => (
                <Link
                  key={e.id}
                  to={`/connect/${e.id}`}
                  className="flex min-h-[72px] items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 transition-colors duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8fb5a3]"
                >
                  <Avatar className="h-12 w-12 rounded-xl">
                    {e.photo_url && <AvatarImage src={e.photo_url} alt="" className="object-cover" />}
                    <AvatarFallback className="rounded-xl bg-stone-700 font-['Merriweather'] text-lg text-stone-100">
                      {e.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-[15px] font-semibold text-white">
                      <span className="truncate">{e.name}</span>
                      {e.proof_url && (
                        <BadgeCheck
                          className="h-4 w-4 flex-shrink-0 text-[#8fb5a3]"
                          aria-label="Placement proof on file"
                        />
                      )}
                    </span>
                    <span className="block truncate text-[13px] text-stone-300">
                      {[e.title, e.company].filter(Boolean).join(" · ") || "Recently placed"}
                    </span>
                  </span>
                  <span className="flex-shrink-0 text-sm font-semibold tabular-nums text-stone-100">
                    {inr(e.price_inr)}
                  </span>
                </Link>
              ))}

            {!loading && preview.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/20 p-5 text-sm leading-relaxed text-stone-300">
                New seniors are added regularly. Open Connect to see who is available this week.
              </div>
            )}
          </div>

          {!loading && extra > 0 && (
            <Button
              asChild
              variant="link"
              className="mt-3 h-11 gap-1.5 self-start px-0 font-semibold text-[#8fb5a3] hover:text-[#a9c9ba]"
            >
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
