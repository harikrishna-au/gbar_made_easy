import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface TourStep {
    /** Element id to spotlight. Missing or hidden targets fall back to a centered card. */
    targetId?: string;
    title: string;
    description: string;
}

const JOURNEY_STEPS: TourStep[] = [
    {
        title: "Welcome to Harry The Blaze",
        description: "This is a practice environment built to take the fear out of your real placement assessment. Practice repeatedly and the format stops being a surprise.",
    },
    {
        targetId: 'onboarding-tr-group',
        title: "Cognitive games",
        description: "Each card is one game from a real MNC cognitive round. We built them from scratch so you can master the logic before test day.",
    },
    {
        title: "Premium",
        description: "Premium adds the extra levels, deeper feedback and the full Communication Round. Good luck.",
    },
];

const LANDING_STEPS: TourStep[] = [
    {
        title: "Welcome to Harry The Blaze",
        description: "Every tool you need for MNC hiring, from cognitive puzzles to job matching. A quick tour, six stops.",
    },
    {
        targetId: 'onboarding-tr-group',
        title: "Cognitive puzzles",
        description: "The logic games used in MNC assessments: Matrix Flow, Balloon Math and Hidden Maze. Repeat until they feel easy.",
    },
    {
        targetId: 'onboarding-comm-card',
        title: "Communication round",
        description: "A full simulation of the spoken round. Practice Q&A, sentence repeating and story retelling, with instant AI feedback.",
    },
    {
        targetId: 'onboarding-ai-card',
        title: "AI mock interview",
        description: "A live AI interviewer asks questions and scores your answers on confidence, clarity and relevance. Good HR prep.",
    },
    {
        targetId: 'onboarding-connect-card',
        title: "Connect 1:1",
        description: "Book 20 minutes with someone who recently cleared the same process. Real guidance, no guesswork.",
    },
    {
        targetId: 'onboarding-premium-card',
        title: "Resume builder",
        description: "Upload a PDF or DOCX, edit what the AI pulls out, and export a clean LaTeX resume. Free to use.",
    },
    {
        targetId: 'onboarding-radar-card',
        title: "Radar: job match",
        description: "Radar scans your skills against real openings and ranks them by match score, so you see the gaps and where to apply first.",
    },
];

interface OnboardingTourProps {
    isOpen: boolean;
    onClose: () => void;
    mode?: 'landing' | 'journey';
}

const PAD = 10; // breathing room around the spotlight
const CARD_W = 400;
const GAP = 16;

interface Box { top: number; left: number; width: number; height: number }

export const OnboardingTour = ({ isOpen, onClose, mode = 'journey' }: OnboardingTourProps) => {
    const steps = mode === 'landing' ? LANDING_STEPS : JOURNEY_STEPS;
    const [currentStep, setCurrentStep] = useState(0);
    const [box, setBox] = useState<Box | null>(null);
    const [vp, setVp] = useState({ w: 0, h: 0 });
    const nextRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isOpen) setCurrentStep(0);
    }, [isOpen]);

    const step = steps[currentStep];

    // Find the target, bring it on screen, then keep the spotlight glued to it.
    const measure = useCallback(() => {
        setVp({ w: window.innerWidth, h: window.innerHeight });
        const el = step?.targetId ? document.getElementById(step.targetId) : null;
        if (!el) return setBox(null);
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return setBox(null);
        setBox({ top: r.top, left: r.left, width: r.width, height: r.height });
    }, [step]);

    useLayoutEffect(() => {
        if (!isOpen) return;
        const el = step?.targetId ? document.getElementById(step.targetId) : null;
        if (el && window.innerWidth < 640) {
            // Phone: the card is a bottom sheet, so park the target near the top where it stays visible.
            const top = el.getBoundingClientRect().top + window.scrollY - 90;
            window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        } else {
            el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
        measure();

        let raf = 0;
        const loop = () => { measure(); raf = requestAnimationFrame(loop); };
        // Follow the smooth scroll for a moment, then settle.
        raf = requestAnimationFrame(loop);
        const stop = window.setTimeout(() => cancelAnimationFrame(raf), 900);

        const on = () => measure();
        window.addEventListener('resize', on);
        window.addEventListener('scroll', on, true);
        return () => {
            cancelAnimationFrame(raf);
            window.clearTimeout(stop);
            window.removeEventListener('resize', on);
            window.removeEventListener('scroll', on, true);
        };
    }, [isOpen, step, measure]);

    const handleClose = useCallback(() => {
        onClose();
        try { localStorage.setItem('has_seen_tour_v1', 'true'); } catch { /* storage unavailable */ }
    }, [onClose]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) setCurrentStep((s) => s + 1);
        else handleClose();
    };
    const handleBack = () => setCurrentStep((s) => Math.max(0, s - 1));

    useEffect(() => {
        if (!isOpen) return;
        nextRef.current?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handleBack();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, currentStep]);

    if (!isOpen || !step) return null;

    const mobile = vp.w > 0 && vp.w < 640;
    const spot = box && {
        top: box.top - PAD,
        left: box.left - PAD,
        width: box.width + PAD * 2,
        height: box.height + PAD * 2,
    };

    // Card position: below the spotlight if it fits, otherwise above; centered with no target.
    let cardStyle: React.CSSProperties;
    if (mobile) {
        cardStyle = { left: 12, right: 12, bottom: 12 };
    } else if (spot) {
        const w = Math.min(CARD_W, vp.w - 32);
        const left = Math.min(Math.max(16, spot.left), vp.w - w - 16);
        const below = spot.top + spot.height + GAP;
        const fitsBelow = below + 230 < vp.h;
        cardStyle = fitsBelow
            ? { left, width: w, top: below }
            : { left, width: w, top: Math.max(16, spot.top - GAP - 230) };
    } else {
        cardStyle = { left: '50%', top: '50%', width: Math.min(CARD_W, vp.w - 32), transform: 'translate(-50%, -50%)' };
    }

    const last = currentStep === steps.length - 1;

    return (
        <div role="dialog" aria-modal="true" aria-labelledby="tour-title" className="fixed inset-0 z-[100]">
            {/* Dim everything; the spotlight is a hole cut by a huge box-shadow. */}
            {spot ? (
                <div
                    aria-hidden
                    className="pointer-events-none fixed transition-[top,left,width,height] duration-300 ease-out motion-reduce:transition-none"
                    style={{
                        ...spot,
                        boxShadow: '0 0 0 9999px color-mix(in oklab, var(--color-ink) 62%, transparent)',
                        outline: '3px solid var(--color-accent)',
                        outlineOffset: 2,
                    }}
                />
            ) : (
                <div aria-hidden className="fixed inset-0" style={{ background: 'color-mix(in oklab, var(--color-ink) 62%, transparent)' }} />
            )}

            <div
                key={currentStep}
                className="fixed bg-[var(--color-paper-3)] p-6 text-[var(--color-ink)] shadow-[8px_8px_0_var(--color-ink)] animate-in fade-in slide-in-from-bottom-3 duration-300 motion-reduce:animate-none"
                style={cardStyle}
            >
                <div className="flex items-start justify-between gap-4">
                    <p className="text-sm font-semibold text-[var(--color-muted)]">
                        Step {currentStep + 1} of {steps.length}
                    </p>
                    <button
                        onClick={handleClose}
                        aria-label="Close tour"
                        className="-m-1 p-1 text-[var(--color-ink)] hover:bg-[var(--color-paper-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
                    >
                        <X className="h-5 w-5" aria-hidden />
                    </button>
                </div>

                <h3 id="tour-title" className="mt-2 font-display text-3xl font-normal uppercase leading-none">
                    {step.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed">{step.description}</p>

                <div className="mt-6 flex items-center justify-between gap-3">
                    <div className="flex gap-1.5" aria-hidden>
                        {steps.map((_, i) => (
                            <span
                                key={i}
                                className={`h-1.5 transition-all duration-300 ${i === currentStep ? 'w-6 bg-[var(--color-accent)]' : 'w-1.5 bg-[var(--color-rule)]'}`}
                            />
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        {currentStep > 0 && (
                            <button
                                onClick={handleBack}
                                className="px-3 py-2 text-[15px] font-medium underline decoration-[var(--color-rule)] underline-offset-4 hover:decoration-[var(--color-ink)]"
                            >
                                Back
                            </button>
                        )}
                        <button
                            ref={nextRef}
                            onClick={handleNext}
                            className="bg-[var(--color-accent)] px-5 py-2.5 text-[15px] font-semibold text-[var(--color-ink)] shadow-[var(--shadow-offset)] transition-[transform,box-shadow] duration-[120ms] hover:translate-x-px hover:translate-y-px hover:shadow-[3px_3px_0_var(--color-ink)] active:translate-x-1 active:translate-y-1 active:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-focus)]"
                        >
                            {last ? 'Get started' : 'Next'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
