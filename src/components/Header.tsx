import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import {
  ArrowLeft,
  BookOpen,
  Bot,
  Code2,
  FileText,
  HelpCircle,
  Layers,
  Maximize,
  Menu,
  Mic2,
  Minimize,
  Radar,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import PaymentPopup from "@/components/PaymentPopup";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";
import { cn } from "@/lib/utils";

interface HeaderProps {
  /** Opens the dashboard onboarding tour; the Tour button only shows on /dashboard. */
  onStartTour?: () => void;
}

interface NavItem {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

// One source of truth for navigation: desktop menu and mobile sheet both read from here.
const PRACTICE: NavItem[] = [
  { to: "/dashboard/accenture", label: "Cognitive Puzzles", description: "Matrix Flow, Balloon Math, Maze", icon: Layers },
  { to: "/game/communication-patterns", label: "Communication Tests", description: "Reading, listening, speaking", icon: Mic2 },
  { to: "/ai-interview", label: "AI Mock Interview", description: "Live interviewer, instant feedback", icon: Bot },
  { to: "/coding-questions", label: "Coding Questions", description: "330+ DSA problems with a checklist", icon: Code2 },
];

const TOOLS: NavItem[] = [
  { to: "/forge", label: "Resume Builder", description: "Upload a PDF, export as LaTeX", icon: FileText },
  { to: "/radar", label: "Job Match", description: "Skills scanned against real openings", icon: Radar },
];

const isActive = (pathname: string, to: string) =>
  to === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(to);

const MenuLinkRow = ({ item }: { item: NavItem }) => (
  <NavigationMenuLink asChild>
    <Link
      to={item.to}
      className="flex items-start gap-3 rounded-md p-3 transition-colors hover:bg-accent focus-visible:bg-accent"
    >
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
        <item.icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold leading-tight text-foreground">{item.label}</span>
        <span className="mt-1 block text-[13px] leading-snug text-muted-foreground">{item.description}</span>
      </span>
    </Link>
  </NavigationMenuLink>
);

const Header = ({ onStartTour }: HeaderProps) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isPremium, loading: premiumLoading } = usePremiumStatus();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  };

  const startTour = () => onStartTour?.();

  const onDashboard = pathname === "/dashboard";
  const showBack = pathname !== "/" && !onDashboard;
  const onConnect = pathname.startsWith("/connect");

  const goBack = () => {
    if (pathname === "/placed-guru") window.location.href = "https://www.harrytheblaze.site/connect";
    else if (pathname === "/connect" || pathname === "/ai-interview") navigate("/");
    else navigate("/dashboard");
  };

  const premiumControl =
    premiumLoading ? null : isPremium ? (
      <Badge className="h-9 gap-1.5 rounded-md px-3 text-[13px] font-bold tracking-wide">
        <Sparkles className="h-3.5 w-3.5" aria-hidden />
        <span className="hidden sm:inline">PREMIUM</span>
        <span className="sr-only sm:hidden">Premium member</span>
      </Badge>
    ) : (
      <Button size="sm" className="h-9 gap-1.5 font-semibold" onClick={() => setShowPayment(true)}>
        <Sparkles aria-hidden />
        Premium
      </Button>
    );

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b backdrop-blur-md transition-[background-color,border-color,box-shadow] duration-300",
          scrolled ? "border-border bg-background/95 shadow-sm" : "border-transparent bg-background/70",
        )}
      >
        <div className="container mx-auto flex h-14 items-center gap-2 px-3 sm:h-16 sm:px-6">
          {/* Logo */}
          <Link
            to={pathname === "/" ? "/" : "/dashboard"}
            aria-label="Harry The Blaze home"
            className="mr-1 flex shrink-0 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <img src="/favicon.svg" alt="" className="h-8 w-8 sm:hidden" />
            <img src="/logo.svg" alt="Harry The Blaze" className="hidden h-10 w-auto sm:block" />
          </Link>

          {/* Desktop navigation (signed-in app links) */}
          <SignedIn>
            <NavigationMenu className="hidden lg:flex">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      to="/dashboard"
                      aria-current={onDashboard ? "page" : undefined}
                      className={cn(navigationMenuTriggerStyle(), onDashboard && "bg-accent")}
                    >
                      Dashboard
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger>Practice</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[420px] gap-1 p-2 md:grid-cols-2 md:w-[560px]">
                      {PRACTICE.map((item) => (
                        <li key={item.to}>
                          <MenuLinkRow item={item} />
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger>Tools</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[420px] gap-1 p-2">
                      {TOOLS.map((item) => (
                        <li key={item.to}>
                          <MenuLinkRow item={item} />
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      to="/blog"
                      aria-current={isActive(pathname, "/blog") ? "page" : undefined}
                      className={cn(navigationMenuTriggerStyle(), isActive(pathname, "/blog") && "bg-accent")}
                    >
                      Blog
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </SignedIn>

          {/* Public nav for signed-out visitors */}
          <SignedOut>
            <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
              <Button variant="ghost" asChild>
                <Link to="/blog">Blog</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/about">About</Link>
              </Button>
            </nav>
          </SignedOut>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            {showBack && (
              <Button variant="ghost" size="sm" className="h-9 gap-1.5" onClick={goBack} aria-label="Exit">
                <ArrowLeft aria-hidden />
                <span className="hidden sm:inline">Exit</span>
              </Button>
            )}

            <SignedIn>
              {/* Connect is the featured offer: always one tap away (hidden on its own page) */}
              {!onConnect && (
                <Button asChild size="sm" className="h-9 gap-1.5 font-semibold">
                  <Link to="/connect" aria-label="Connect 1:1">
                    <Users aria-hidden />
                    <span>
                      Connect<span className="hidden sm:inline"> 1:1</span>
                    </span>
                  </Link>
                </Button>
              )}

              {onDashboard && onStartTour && (
                <Button variant="ghost" size="sm" className="hidden h-9 gap-1.5 sm:inline-flex" onClick={startTour}>
                  <HelpCircle aria-hidden />
                  Tour
                </Button>
              )}

              {premiumControl}

              <div className="ml-0.5 flex h-9 w-9 items-center justify-center">
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>

            <SignedOut>
              <SignInButton mode="modal" forceRedirectUrl={pathname}>
                <Button size="sm" className="h-9 font-semibold">
                  Sign in
                </Button>
              </SignInButton>
            </SignedOut>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden h-9 w-9 lg:inline-flex"
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? <Minimize aria-hidden /> : <Maximize aria-hidden />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isFullscreen ? "Exit fullscreen" : "Fullscreen"}</TooltipContent>
            </Tooltip>

            {/* Mobile / tablet menu */}
            <SignedIn>
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 lg:hidden"
                  aria-label="Open menu"
                  onClick={() => setMenuOpen(true)}
                >
                  <Menu aria-hidden />
                </Button>
                <SheetContent side="right" className="flex w-[88vw] max-w-sm flex-col gap-0 overflow-y-auto p-0">
                  <SheetHeader className="border-b p-4 text-left">
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>

                  <nav className="flex flex-col p-2" aria-label="Mobile">
                    <MobileLink to="/dashboard" icon={Layers} label="Dashboard" pathname={pathname} />
                    <MobileLink to="/connect" icon={Users} label="Connect 1:1" pathname={pathname} featured />
                  </nav>

                  <Separator />
                  <p className="px-4 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Practice
                  </p>
                  <nav className="flex flex-col p-2 pt-0" aria-label="Practice">
                    {PRACTICE.map((i) => (
                      <MobileLink key={i.to} to={i.to} icon={i.icon} label={i.label} pathname={pathname} />
                    ))}
                  </nav>

                  <Separator />
                  <p className="px-4 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Tools
                  </p>
                  <nav className="flex flex-col p-2 pt-0" aria-label="Tools">
                    {TOOLS.map((i) => (
                      <MobileLink key={i.to} to={i.to} icon={i.icon} label={i.label} pathname={pathname} />
                    ))}
                    <MobileLink to="/blog" icon={BookOpen} label="Blog" pathname={pathname} />
                  </nav>

                  {onDashboard && onStartTour && (
                    <>
                      <Separator />
                      <div className="p-2">
                        <SheetClose asChild>
                          <Button variant="ghost" className="h-11 w-full justify-start gap-3" onClick={startTour}>
                            <HelpCircle aria-hidden />
                            Take the tour
                          </Button>
                        </SheetClose>
                      </div>
                    </>
                  )}
                </SheetContent>
              </Sheet>
            </SignedIn>
          </div>
        </div>
      </header>

      <PaymentPopup isOpen={showPayment} onClose={() => setShowPayment(false)} />
    </>
  );
};

const MobileLink = ({
  to,
  icon: Icon,
  label,
  pathname,
  featured,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  pathname: string;
  featured?: boolean;
}) => {
  const active = isActive(pathname, to);
  return (
    <SheetClose asChild>
      <Button
        asChild
        variant={featured ? "default" : "ghost"}
        className={cn("my-0.5 h-11 w-full justify-start gap-3 text-[15px]", active && !featured && "bg-accent font-semibold", featured && "font-semibold")}
      >
        <Link to={to} aria-current={active ? "page" : undefined}>
          <Icon aria-hidden />
          {label}
        </Link>
      </Button>
    </SheetClose>
  );
};

export default Header;
