import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, MessageSquare, Send, HeartHandshake, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useUser } from "@clerk/clerk-react";

export type FeedbackType = 'recruitment' | 'platform';

interface FeedbackPopupProps {
    isOpen: boolean;
    onClose: () => void;
    feedbackType?: FeedbackType;
}

const COMPANY_SUGGESTIONS = ["Accenture", "TCS", "Infosys", "Wipro", "Cognizant", "Capgemini", "Deloitte", "Other"];
const ROUND_OPTIONS = ["Aptitude / cognitive games", "Communication", "Technical", "HR / interview", "Not sure yet"];

const fieldLabel = "text-xs font-semibold text-muted-foreground uppercase tracking-wide";
const fieldInput = "h-11 bg-background border-border";

const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
            active
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground border-border hover:bg-accent"
        }`}
    >
        {active && <Check className="w-3.5 h-3.5" />}
        {children}
    </button>
);

const FeedbackPopup = ({ isOpen, onClose, feedbackType = 'recruitment' }: FeedbackPopupProps) => {
    const { user } = useUser();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSent, setIsSent] = useState(false);

    // Prep survey
    const [name, setName] = useState("");
    const [college, setCollege] = useState("");
    const [mobileNumber, setMobileNumber] = useState("");
    const [graduatingYear, setGraduatingYear] = useState("");
    const [placementType, setPlacementType] = useState("");
    const [targetCompany, setTargetCompany] = useState("");
    const [rounds, setRounds] = useState<string[]>([]);
    const [helpNeeded, setHelpNeeded] = useState("");

    // Platform feedback
    const [platformFeedback, setPlatformFeedback] = useState("");

    if (!isOpen) return null;

    const toggleRound = (r: string) =>
        setRounds((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (feedbackType === 'recruitment') {
            if (!name.trim() || !college.trim()) {
                toast.error("Please fill in your name and college.");
                return;
            }
            if (!targetCompany.trim()) {
                toast.error("Tell us which company you are preparing for.");
                return;
            }
            if (!placementType) {
                toast.error("Please select your placement type.");
                return;
            }
        } else if (!platformFeedback.trim()) {
            toast.error("Please provide some feedback.");
            return;
        }

        setIsSubmitting(true);

        try {
            const isPrep = feedbackType === 'recruitment';
            const { error } = await supabase.from('feedback').insert({
                user_id: user?.id || null,
                name: name.trim() || user?.fullName || 'Anonymous',
                college: isPrep ? college.trim() : null,
                mobile_number: isPrep ? mobileNumber.trim() : null,
                graduating_year: isPrep ? graduatingYear.trim() : null,
                placement_type: isPrep ? placementType : 'Platform Feedback',
                target_company: isPrep ? targetCompany.trim() : null,
                preparing_for: isPrep ? rounds.join(", ") : null,
                help_needed: isPrep ? helpNeeded.trim() : null,
                // Platform feedback keeps using this existing text column
                technical_round_exp: isPrep ? null : platformFeedback.trim(),
            } as any);

            if (error) throw error;

            setIsSubmitting(false);
            setIsSent(true);
            toast.success("Thanks, we got it.");

            setTimeout(() => {
                setIsSent(false);
                onClose();
            }, 2500);
        } catch (error: any) {
            console.error("Error sending feedback:", error);
            toast.error("Failed to send. Please try again.");
            setIsSubmitting(false);
        }
    };

    const isPrep = feedbackType === 'recruitment';

    return (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-card text-card-foreground border border-border rounded-lg shadow-xl p-6 md:p-8 max-w-lg w-full relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors bg-accent p-2 rounded-md"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="space-y-6">
                    <div className="space-y-2 pr-8">
                        <div className="w-11 h-11 bg-accent rounded-md flex items-center justify-center">
                            {isPrep ? (
                                <MessageSquare className="w-5 h-5 text-primary" />
                            ) : (
                                <HeartHandshake className="w-5 h-5 text-primary" />
                            )}
                        </div>
                        <h2 className="text-2xl font-bold text-foreground leading-tight">
                            {isPrep ? "Tell us about your prep" : "We value your thoughts"}
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            {isPrep
                                ? "A minute of your time helps us build practice for the round you are actually facing."
                                : "Have a suggestion or found a bug? Let us know."}
                        </p>
                    </div>

                    {!isSent ? (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {isPrep ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="name" className={fieldLabel}>Name</Label>
                                            <Input id="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className={fieldInput} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="college" className={fieldLabel}>College</Label>
                                            <Input id="college" placeholder="College name" value={college} onChange={(e) => setCollege(e.target.value)} className={fieldInput} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="mobile" className={fieldLabel}>Mobile (optional)</Label>
                                            <Input id="mobile" placeholder="Your mobile number" type="tel" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} className={fieldInput} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="gradYear" className={fieldLabel}>Graduating year</Label>
                                            <Input id="gradYear" placeholder="e.g., 2026" value={graduatingYear} onChange={(e) => setGraduatingYear(e.target.value)} className={fieldInput} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="company" className="text-sm font-semibold text-foreground">Which company are you preparing for?</Label>
                                        <Input
                                            id="company"
                                            placeholder="Type a company, or pick below"
                                            value={targetCompany}
                                            onChange={(e) => setTargetCompany(e.target.value)}
                                            className={fieldInput}
                                        />
                                        <div className="flex flex-wrap gap-2">
                                            {COMPANY_SUGGESTIONS.filter((c) => c !== "Other").map((c) => (
                                                <Chip key={c} active={targetCompany.trim().toLowerCase() === c.toLowerCase()} onClick={() => setTargetCompany(c)}>
                                                    {c}
                                                </Chip>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-foreground">Which rounds are you preparing for?</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {ROUND_OPTIONS.map((r) => (
                                                <Chip key={r} active={rounds.includes(r)} onClick={() => toggleRound(r)}>
                                                    {r}
                                                </Chip>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-foreground">Placement type</Label>
                                        <RadioGroup value={placementType} onValueChange={setPlacementType} className="flex gap-3">
                                            <div className="flex items-center space-x-2 border border-border rounded-md px-4 py-2 hover:bg-accent cursor-pointer w-full">
                                                <RadioGroupItem value="On-Campus" id="p1" />
                                                <Label htmlFor="p1" className="cursor-pointer font-medium">On-campus</Label>
                                            </div>
                                            <div className="flex items-center space-x-2 border border-border rounded-md px-4 py-2 hover:bg-accent cursor-pointer w-full">
                                                <RadioGroupItem value="Off-Campus" id="p2" />
                                                <Label htmlFor="p2" className="cursor-pointer font-medium">Off-campus</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="help" className="text-sm font-semibold text-foreground">
                                            What would help you most? <span className="text-muted-foreground font-normal">(optional)</span>
                                        </Label>
                                        <Textarea
                                            id="help"
                                            placeholder="e.g. interview date, where you get stuck, what you want to practice"
                                            className="min-h-[80px] bg-background border-border resize-none"
                                            value={helpNeeded}
                                            onChange={(e) => setHelpNeeded(e.target.value)}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-1.5">
                                    <Label htmlFor="platform-msg" className={fieldLabel}>Your message</Label>
                                    <Textarea
                                        id="platform-msg"
                                        placeholder="Tell us what you like or what we can improve..."
                                        className="min-h-[120px] bg-background border-border resize-none"
                                        value={platformFeedback}
                                        onChange={(e) => setPlatformFeedback(e.target.value)}
                                    />
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-12 rounded-md text-base font-semibold flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? "Submitting..." : (<>Submit <Send className="w-4 h-4" /></>)}
                            </Button>
                        </form>
                    ) : (
                        <div className="bg-accent p-8 rounded-md border border-border text-center space-y-2 animate-in fade-in slide-in-from-bottom-4">
                            <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto">
                                <Check className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground">Thank you</h3>
                            <p className="text-muted-foreground">Your answers help us build better practice for you.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeedbackPopup;
