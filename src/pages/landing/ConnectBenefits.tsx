import { Briefcase, FileText, MessageCircle, Target } from "lucide-react";

const BENEFITS = [
  { icon: Briefcase, tone: "#ff7a59", title: "Real interview insight", body: "Hear what was actually asked and how the rounds ran." },
  { icon: Target, tone: "#7cc4f2", title: "Know what to focus on", body: "Skip the noise. Learn what mattered in their prep." },
  { icon: FileText, tone: "#9adb84", title: "Resume & profile feedback", body: "A quick honest review from someone who got through." },
  { icon: MessageCircle, tone: "#f6a9c6", title: "Ask anything, 20 minutes", body: "One live call, one meeting link sent to both of you." },
];

export const ConnectBenefits = ({ compact = false }: { compact?: boolean }) => (
  <div className="rounded-2xl border-2 border-stone-900 bg-white p-4">
    <p className="font-['Inter'] text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-3">
      Why Connect 1:1 helps
    </p>
    <ul className={`grid gap-3 ${compact ? "grid-cols-1" : "grid-cols-2"}`}>
      {BENEFITS.map(({ icon: Icon, tone, title, body }) => (
        <li key={title} className="flex items-start gap-2.5">
          <span className="w-8 h-8 rounded-lg border-2 border-stone-900 flex items-center justify-center flex-shrink-0" style={{ background: tone }}>
            <Icon className="w-4 h-4 text-stone-900" />
          </span>
          <span className="min-w-0">
            <span className="block font-['Inter'] text-[13px] font-semibold text-stone-900 leading-tight">{title}</span>
            <span className="block font-['Inter'] text-[12px] text-stone-500 leading-snug mt-0.5">{body}</span>
          </span>
        </li>
      ))}
    </ul>
  </div>
);
