import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { installSteps, useInstall } from "@/lib/install";

interface Props {
  className?: string;
  variant?: "outline" | "secondary" | "link" | "default";
  label?: string;
}

/** "Install the app": one tap where the browser allows it, otherwise short instructions. Hidden once installed. */
export function InstallAppButton({ className, variant = "outline", label = "Install the app" }: Props) {
  const { platform, isInstalled, install } = useInstall();
  const [showSteps, setShowSteps] = useState(false);

  if (isInstalled) return null;

  const onClick = async () => {
    if ((await install()) === "manual") setShowSteps(true);
  };

  return (
    <>
      <Button type="button" variant={variant} className={className} onClick={onClick}>
        <Download aria-hidden />
        {label}
      </Button>
      <Dialog open={showSteps} onOpenChange={setShowSteps}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Install Harry The Blaze</DialogTitle>
            <DialogDescription>
              Get it on your home screen: opens full screen, no app store needed.
            </DialogDescription>
          </DialogHeader>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
            {installSteps(platform).map((s) => <li key={s}>{s}</li>)}
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
}
