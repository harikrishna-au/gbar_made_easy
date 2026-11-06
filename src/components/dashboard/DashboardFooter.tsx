import { Link } from "react-router-dom";
import { ArrowUpRight, Building2, Coffee, Heart, Linkedin, Mail, MessageSquare, Youtube } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface DashboardFooterProps {
  onFeedbackClick: () => void;
  onSupportClick: () => void;
}

const SOCIALS = [
  { label: "YouTube", href: "https://www.youtube.com/@HARIKRISHNA-AU", icon: Youtube, external: true },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/hari-krishna-nallana-33949b277/", icon: Linkedin, external: true },
  { label: "Email", href: "mailto:nallanahk@gmail.com", icon: Mail, external: false },
];

export const DashboardFooter = ({ onFeedbackClick, onSupportClick }: DashboardFooterProps) => (
  <footer className="relative w-full overflow-hidden bg-background">
    <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center gap-10 px-4 py-16 sm:px-6 sm:py-24">
      <Badge variant="secondary" className="gap-2 px-3.5 py-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        <Heart className="h-3 w-3 fill-current" aria-hidden />
        Made with love
      </Badge>

      <div className="space-y-3 text-center">
        <h2 className="font-serif text-4xl leading-[1.1] tracking-tight text-foreground md:text-[3.1rem]">
          Enjoying the practice?
          <br />
          <span className="font-light italic text-muted-foreground">Let us know.</span>
        </h2>
        <p className="mx-auto max-w-sm text-[0.95rem] leading-relaxed text-muted-foreground">
          Your feedback shapes this platform. Every message is read personally.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="outline" size="lg" className="gap-2.5 font-semibold" onClick={onFeedbackClick}>
          <MessageSquare aria-hidden />
          Share Feedback
        </Button>
        <Button variant="secondary" size="lg" className="gap-2.5 font-semibold" onClick={onSupportClick}>
          <Coffee aria-hidden />
          Buy me a chai
        </Button>
      </div>

      <Separator className="max-w-xs" />

      <div className="flex flex-col items-center gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Company specific prep</p>
        <Button asChild variant="outline" size="lg" className="group gap-2.5 font-semibold">
          <Link to="/hackwithinfy">
            <Building2 className="text-[#007CC3]" aria-hidden />
            All about Infosys
            <ArrowUpRight
              className="text-[#007CC3] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </Button>
      </div>

      <div className="flex flex-col items-center gap-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Crafted by Hari Krishna</p>

        <div className="flex items-center gap-2.5">
          {SOCIALS.map(({ label, href, icon: Icon, external }) => (
            <Button key={label} asChild variant="outline" className="h-11 gap-2 px-4 text-[13px] font-semibold">
              <a
                href={href}
                aria-label={label}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                <Icon aria-hidden />
                <span className="hidden sm:inline">{label}</span>
              </a>
            </Button>
          ))}
        </div>

        <p className="text-center text-[11px] tracking-wide text-muted-foreground">
          © 2026 Harry The Blaze · Interview Intelligence Platform
        </p>
      </div>
    </div>
  </footer>
);
