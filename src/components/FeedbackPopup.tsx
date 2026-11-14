import { useState } from "react";
import { X, MessageSquare, Send, Lightbulb, Check } from "lucide-react";
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

// What students can ask for. Keep these short: they are tap targets, and the wording is
// what we read back later when deciding what to build.
const FEATURE_OPTIONS = [
    "More company-specific practice",
    "Aptitude: quant and verbal",
    "Coding / technical round practice",
    "Full-length mock tests with scores",
    "Better AI mock interview",
    "HR interview question bank",
    "Resume review",
    "Progress tracking and streaks",
    "More 1:1 mentors",
    "Study notes and material",
    "A mobile app",
];

const DISPLAY = "font-display font-normal uppercase leading-[0.95] tracking-[0.005em] [text-wrap:balance]";
const fieldLabel = "text-xs font-semibold text-[var(--color-muted)] uppercase tracking-[0.12em]";
const fieldInput = "h-11 rounded-none bg-[var(--color-paper)] border-[var(--color-ink)] text-[var(--color-ink)]";
const areaClass = "rounded-none bg-[var(--color-paper)] border-[var(--color-ink)] text-[var(--color-ink)] resize-none";
const optionBox = "flex items-center space-x-2 border border-[var(--color-ink)] bg-[var(--color-paper)] px-4 py-2 hover:bg-[var(--color-paper-2)] cursor-pointer w-full";
const SUBMIT =
    "w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-[15px] font-semibold text-[var(--color-ink)] bg-[var(--color-accent)] " +
    "shadow-[var(--shadow-offset)] transition-[transform,box-shadow] duration-[120ms] ease-out " +
    "hover:translate-x-px hover:translate-y-px hover:shadow-[3px_3px_0_var(--color-ink)] " +
    "active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-60 disabled:pointer-events-none " +
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-focus)]";

const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={`inline-flex items-center gap-1.5 border border-[var(--color-ink)] px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] ${
            active
                ? "bg-[var(--color-accent)] text-[var(--color-ink)] font-semibold"
                : "bg-[var(--color-paper)] text-[var(--color-ink)] hover:bg-[var(--color-paper-2)]"
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

    // Platform feedback / feature requests
    const [platformFeedback, setPlatformFeedback] = useState("");
    const [wantedFeatures, setWantedFeatures] = useState<string[]>([]);
    const [otherFeature, setOtherFeature] = useState("");
    const [notifyMe, setNotifyMe] = useState(true);

    if (!isOpen) return null;

    const toggleRound = (r: string) =>
        setRounds((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

    const toggleFeature = (f: string) =>
        setWantedFeatures((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

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
        } else if (!wantedFeatures.length && !otherFeature.trim() && !platformFeedback.trim()) {
            toast.error("Pick a feature you want, or tell us in your own words.");
            return;
        }

        setIsSubmitting(true);

        try {
            const isPrep = feedbackType === 'recruitment';
            const email = user?.primaryEmailAddress?.emailAddress;
            // One readable record per submission, so it can be read straight from the table.
            const platformRecord = [
                wantedFeatures.length ? `Features wanted: ${wantedFeatures.join("; ")}` : null,
                otherFeature.trim() ? `Other feature: ${otherFeature.trim()}` : null,
                platformFeedback.trim() ? `Feedback: ${platformFeedback.trim()}` : null,
                notifyMe && email ? `Notify me when it ships: ${email}` : null,
            ].filter(Boolean).join("\n");
            const { error } = await supabase.from('feedback').insert({
                user_id: user?.id || null,
                name: name.trim() || user?.fullName || 'Anonymous',
                // `college` was created NOT NULL, so send a value rather than null for platform feedback
                college: isPrep ? college.trim() : 'N/A',
                mobile_number: isPrep ? mobileNumber.trim() : null,
                graduating_year: isPrep ? graduatingYear.trim() : null,
                placement_type: isPrep ? placementType : (wantedFeatures.length || otherFeature.trim() ? 'Feature Request' : 'Platform Feedback'),
                target_company: isPrep ? targetCompany.trim() : null,
                preparing_for: isPrep ? rounds.join(", ") : null,
                help_needed: isPrep ? helpNeeded.trim() : null,
                // Platform feedback keeps using this existing text column
                technical_round_exp: isPrep ? null : platformRecord,
            } as any);

            if (error) throw error;

            setIsSubmitting(false);
            setIsSent(true);
            toast.success("Thanks, we got it.");

            setTimeout(() => {
                setIsSent(false);
                setWantedFeatures([]);
                setOtherFeature("");
                setPlatformFeedback("");
                onClose();
            }, isPrep ? 2500 : 4000);
        } catch (error: any) {
            console.error("Error sending feedback:", error);
            toast.error("Failed to send. Please try again.");
            setIsSubmitting(false);
        }
    };

    const isPrep = feedbackType === 'recruitment';

    return (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-[var(--color-paper-3)] text-[var(--color-ink)] shadow-[var(--shadow-sheet)] p-6 md:p-8 max-w-lg w-full relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute top-4 right-4 text-[var(--color-ink)] hover:bg-[var(--color-accent)] transition-colors border border-[var(--color-ink)] p-2"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="space-y-6">
                    <div className="space-y-2 pr-8">
                        <div className="w-11 h-11 bg-[var(--color-accent)] flex items-center justify-center">
                            {isPrep ? (
                                <MessageSquare className="w-5 h-5 text-[var(--color-ink)]" />
                            ) : (
                                <Lightbulb className="w-5 h-5 text-[var(--color-ink)]" />
                            )}
                        </div>
                        <h2 className={`${DISPLAY} text-4xl`}>
                            {isPrep ? "Tell us about your prep" : "Tell us what to build next"}
                        </h2>
                        <p className="text-[var(--color-muted)] text-sm">
                            {isPrep
                                ? "A minute of your time helps us build practice for the round you are actually facing."
                                : "Your feedback decides what we build. Tell us what you are looking for, and if it helps students like you, we will work on it and bring it to you."}
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
                                        <Label htmlFor="company" className="text-sm font-semibold text-[var(--color-ink)]">Which company are you preparing for?</Label>
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
                                        <Label className="text-sm font-semibold text-[var(--color-ink)]">Which rounds are you preparing for?</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {ROUND_OPTIONS.map((r) => (
                                                <Chip key={r} active={rounds.includes(r)} onClick={() => toggleRound(r)}>
                                                    {r}
                                                </Chip>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-[var(--color-ink)]">Placement type</Label>
                                        <RadioGroup value={placementType} onValueChange={setPlacementType} className="flex gap-3">
                                            <div className={optionBox}>
                                                <RadioGroupItem value="On-Campus" id="p1" />
                                                <Label htmlFor="p1" className="cursor-pointer font-medium">On-campus</Label>
                                            </div>
                                            <div className={optionBox}>
                                                <RadioGroupItem value="Off-Campus" id="p2" />
                                                <Label htmlFor="p2" className="cursor-pointer font-medium">Off-campus</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="help" className="text-sm font-semibold text-[var(--color-ink)]">
                                            What would help you most? <span className="text-[var(--color-muted)] font-normal">(optional)</span>
                                        </Label>
                                        <Textarea
                                            id="help"
                                            placeholder="e.g. interview date, where you get stuck, what you want to practice"
                                            className={`min-h-[80px] ${areaClass}`}
                                            value={helpNeeded}
                                            onChange={(e) => setHelpNeeded(e.target.value)}
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-[var(--color-ink)]">
                                            Which features would you like to see?
                                        </Label>
                                        <div className="flex flex-wrap gap-2">
                                            {FEATURE_OPTIONS.map((f) => (
                                                <Chip key={f} active={wantedFeatures.includes(f)} onClick={() => toggleFeature(f)}>
                                                    {f}
                                                </Chip>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="other-feature" className={fieldLabel}>Something else you want? (optional)</Label>
                                        <Textarea
                                            id="other-feature"
                                            placeholder="Describe the feature you wish this site had..."
                                            className={`min-h-[80px] ${areaClass}`}
                                            value={otherFeature}
                                            onChange={(e) => setOtherFeature(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="platform-msg" className={fieldLabel}>What should we improve? (optional)</Label>
                                        <Textarea
                                            id="platform-msg"
                                            placeholder="Something confusing, slow or broken? What do you like?"
                                            className={`min-h-[80px] ${areaClass}`}
                                            value={platformFeedback}
                                            onChange={(e) => setPlatformFeedback(e.target.value)}
                                        />
                                    </div>

                                    {user?.primaryEmailAddress?.emailAddress && (
                                        <label className={`${optionBox} text-sm`}>
                                            <input
                                                type="checkbox"
                                                checked={notifyMe}
                                                onChange={(e) => setNotifyMe(e.target.checked)}
                                                className="h-4 w-4 accent-[var(--color-ink)]"
                                            />
                                            <span className="font-medium">Let me know when it is live</span>
                                        </label>
                                    )}
                                </>
                            )}

                            <button type="submit" disabled={isSubmitting} className={SUBMIT}>
                                {isSubmitting ? "Submitting..." : (<>Submit <Send className="w-4 h-4" /></>)}
                            </button>
                        </form>
                    ) : (
                        <div className="bg-[var(--color-accent)] p-8 text-center space-y-2 animate-in fade-in slide-in-from-bottom-4">
                            <div className="w-12 h-12 bg-[var(--color-ink)] text-[var(--color-paper)] flex items-center justify-center mx-auto">
                                <Check className="w-6 h-6" />
                            </div>
                            <h3 className={`${DISPLAY} text-3xl`}>Thank you</h3>
                            <p className="text-[var(--color-ink)]">
                                {isPrep
                                    ? "Your answers help us build better practice for you."
                                    : "We read every suggestion. We will work on what students ask for most and bring it to you."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeedbackPopup;
