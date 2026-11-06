import { Link } from "react-router-dom";
import { Coffee, Linkedin, Mail, MessageSquare, Youtube } from "lucide-react";
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
  <footer className="w-full bg-background">
    <div className="mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-8">
      <Separator className="mb-8 bg-foreground" />

      <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md">
          <h2 className="font-['Merriweather'] text-xl font-bold text-foreground">Something broken or missing?</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground/80">
            Tell us. Every message is read by Hari, who builds this. If it saved you time, you can also buy him a chai.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="outline" className="h-11 gap-2 font-semibold" onClick={onFeedbackClick}>
              <MessageSquare aria-hidden />
              Share feedback
            </Button>
            <Button variant="secondary" className="h-11 gap-2 font-semibold" onClick={onSupportClick}>
              <Coffee aria-hidden />
              Buy me a chai
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:items-end">
          <Button asChild variant="link" className="h-auto justify-start p-0 text-[15px] font-semibold text-foreground md:justify-end">
            <Link to="/hackwithinfy">Preparing for Infosys? Start here</Link>
          </Button>
          <div className="flex gap-2">
            {SOCIALS.map(({ label, href, icon: Icon, external }) => (
              <Button key={label} asChild variant="outline" size="icon" className="h-11 w-11">
                <a href={href} aria-label={label} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                  <Icon aria-hidden />
                </a>
              </Button>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-10 text-xs text-muted-foreground">© 2026 Harry The Blaze</p>
    </div>
  </footer>
);
