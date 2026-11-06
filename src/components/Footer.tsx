import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const LINKS = [
  { label: "About", to: "/about" },
  { label: "Terms", to: "/terms" },
  { label: "Refund Policy", to: "/refund" },
  { label: "Blog", to: "/blog" },
];

const Footer = () => (
  <footer className="bg-background">
    <Separator />
    <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-4 sm:flex-row sm:px-6">
      <p className="text-xs text-muted-foreground">
        © 2026 <span className="font-semibold text-foreground">HARRY THE BLAZE</span>
      </p>
      <nav aria-label="Footer" className="flex flex-wrap items-center justify-center">
        {LINKS.map(({ label, to }) => (
          <Button key={to} asChild variant="link" className="h-11 px-3 text-xs text-muted-foreground hover:text-foreground">
            <Link to={to}>{label}</Link>
          </Button>
        ))}
      </nav>
    </div>
  </footer>
);

export default Footer;
