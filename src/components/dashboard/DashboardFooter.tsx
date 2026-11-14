import { Link } from "react-router-dom";
import { Coffee, Linkedin, Mail, MessageSquare, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { InstallAppButton } from "@/components/InstallAppButton";

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
      <Separator className="mb-8 bg-[var(--color-rule)]" />

      <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md">
          <h2 className="text-xl font-semibold text-foreground">What should we build next?</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground/80">
            Tell us the features you are looking for. Share your valuable feedback and we will work on it and bring it to you. Every message is read by Hari, who builds this. If it saved you time, you can also buy him a chai.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="outline" className="h-11 gap-2 font-semibold" onClick={onFeedbackClick}>
              <MessageSquare aria-hidden />
              Request a feature
            </Button>
            <Button variant="secondary" className="h-11 gap-2 font-semibold" onClick={onSupportClick}>
              <Coffee aria-hidden />
              Buy me a chai
            </Button>
          </div>
          <div className="mt-6 max-w-md border-t border-[var(--color-rule)] pt-4">
            <p className="text-[15px] font-semibold text-foreground">Practice from your home screen</p>
            <p className="mt-1 text-sm leading-relaxed text-foreground/80">
              You can install this site as an app on your phone. It opens full screen, with no app store needed.
            </p>
            <InstallAppButton className="mt-3 h-11 gap-2 font-semibold" />
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
