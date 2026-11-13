import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Check, Copy, Share2, MessageCircle, BadgeCheck, CalendarClock, IndianRupee, ClipboardList, Mic, Gamepad2, PhoneCall } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';


// Hallmark: paper sheets on a board, controls on a hard ink offset.
const SHEET = 'bg-[var(--color-paper-3)] shadow-[var(--shadow-sheet)]';
const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]';
const BTN =
    'inline-flex items-center justify-center gap-2 whitespace-nowrap px-6 py-3.5 text-[15px] font-semibold text-[var(--color-ink)] ' +
    'shadow-[var(--shadow-offset)] transition-[transform,box-shadow] duration-[120ms] ease-out ' +
    'hover:translate-x-px hover:translate-y-px hover:shadow-[3px_3px_0_var(--color-ink)] ' +
    'active:translate-x-1 active:translate-y-1 active:shadow-none motion-reduce:transition-none ' +
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-focus)]';
const BTN_PRIMARY = `${BTN} bg-[var(--color-accent)]`;
const BTN_SECONDARY = `${BTN} bg-[var(--color-paper-3)]`;
const BTN_INK = `${BTN} bg-[var(--color-ink)] !text-[var(--color-paper)] shadow-[4px_4px_0_var(--color-accent)]`;
const GHOST =
    'inline-flex items-center gap-2 border border-[var(--color-paper)] px-5 py-3 text-sm font-semibold text-[var(--color-paper)] ' +
    'hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]';
const DISPLAY = 'font-display font-normal uppercase leading-[0.95] tracking-[0.005em] [overflow-wrap:break-word] [text-wrap:balance]';
const WRAP = 'mx-auto w-full max-w-[1360px] px-4 sm:px-8 lg:px-12';

type Audience = 'placed' | 'prep';

const SITE = 'https://www.harrytheblaze.site';

const TABS: { key: Audience; label: string }[] = [
    { key: 'placed', label: "I'm placed" },
    { key: 'prep', label: "I'm preparing" },
];

const CONTENT = {
    placed: {
        eyebrow: 'For recently placed seniors',
        title: 'Your interview is someone’s next prep.',
        body: 'You just went through the rounds that juniors are scared of. Give one student 20 minutes of what was actually asked, how it ran, and what you would do differently.',
        cta: { label: 'Share your experience', to: '/placed-guru' },
        second: { label: 'See how Connect looks', to: '/connect' },
        stepsTitle: 'What you actually do',
        steps: [
            { icon: ClipboardList, title: 'Make your profile', body: 'Your company, drive date, package and a short bio. About five minutes.' },
            { icon: BadgeCheck, title: 'Add proof of selection', body: 'An admin reviews it before your profile goes live on Connect.' },
            { icon: CalendarClock, title: 'Pick your own slots', body: 'You choose the days and hours you are free. Nothing gets booked outside them.' },
            { icon: IndianRupee, title: 'Set your own price', body: 'You decide what a 20-minute session costs. Our team schedules the call and sends one link to both of you.' },
        ],
        asked: ['What the rounds were', 'What was asked in each', 'How you prepared', 'Resume and profile feedback'],
        faqs: [
            ['How much time does this take?', 'Setting up takes a few minutes. After that, a call is 20 minutes, only in slots you opened.'],
            ['What does the call look like?', 'A 20-minute 1-on-1 call. Our team confirms the slot and sends one meeting link to both of you.'],
            ['Can I change my profile later?', 'Yes. You can edit your profile and your available slots any time.'],
            ['Who sees my details?', 'Students see your name, photo, company, bio and skills. Your proof of selection is for our team to review.'],
        ],
        share: (url: string) =>
            `Recently placed? Harry The Blaze lets you help juniors with a 20-minute call about the exact rounds you cleared. You set your own slots and price. Takes a few minutes to set up:\n${url}`,
    },
    prep: {
        eyebrow: 'For students facing Accenture-style rounds',
        title: 'Practice the round. Then talk to someone who sat it.',
        body: 'Play the cognitive games and communication rounds in the same format, then book a 20-minute call with a senior who just got placed.',
        cta: { label: 'Browse seniors', to: '/connect' },
        second: { label: 'Start practicing', to: '/dashboard' },
        stepsTitle: 'Two ways to get ready',
        steps: [
            { icon: Gamepad2, title: 'Cognitive games', body: 'Practice the game-style aptitude round before the real one.' },
            { icon: Mic, title: 'Communication rounds', body: 'Speaking, listening, reading and writing tasks, with feedback on your answers.' },
            { icon: PhoneCall, title: 'Connect 1:1', body: 'Pick a senior, pay, and our team confirms the slot and emails one meeting link to both of you.' },
        ],
        asked: ['What was actually asked', 'How the rounds ran', 'Resume feedback', 'What to prep first'],
        faqs: [
            ['Is the call instant?', 'No. Calls are scheduled by our team, so your request shows as pending until the meeting link arrives.'],
            ['How long is a call?', '20 minutes, one student with one senior.'],
            ['Do I need to sign in?', 'Yes, to practice and to book. It takes a minute.'],
        ],
        share: (url: string) =>
            `Prepping for Accenture / campus placements? Harry The Blaze has the cognitive games and communication rounds, plus 20-minute calls with seniors who just got placed:\n${url}`,
    },
} as const;

const Campaign = () => {
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const audience: Audience = params.get('for') === 'prep' ? 'prep' : 'placed';
    const c = CONTENT[audience];

    const url = useMemo(() => `${SITE}/share?for=${audience}`, [audience]);
    const defaultMessage = useMemo(() => c.share(url), [c, url]);
    const [message, setMessage] = useState(defaultMessage);
    const [copied, setCopied] = useState(false);

    // Reset the editable message when the audience tab changes
    useEffect(() => setMessage(defaultMessage), [defaultMessage]);

    useEffect(() => {
        const previous = document.title;
        document.title = audience === 'placed'
            ? 'Share your placement experience | Harry The Blaze'
            : 'Practice, then talk to a senior | Harry The Blaze';
        return () => {
            document.title = previous;
        };
    }, [audience]);

    const copy = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            toast.success(label);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Could not copy. Select the text and copy it manually.');
        }
    };

    const nativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title: 'Harry The Blaze', text: message });
            } catch {
                // user dismissed the sheet
            }
        } else {
            copy(message, 'Message copied');
        }
    };

    return (
        <div className="min-h-screen overflow-x-hidden bg-[var(--color-paper)] font-sans text-[var(--color-ink)]">
            <Header onStartTour={() => { }} />

            <main className={WRAP}>
                {/* Audience switch */}
                <div className="flex justify-center pt-24 sm:pt-28">
                    <div role="tablist" aria-label="Who is this for" className={`${SHEET} inline-flex gap-1 p-1`}>
                        {TABS.map((t) => (
                            <button
                                key={t.key}
                                role="tab"
                                aria-selected={audience === t.key}
                                onClick={() => setParams({ for: t.key }, { replace: true })}
                                className={`px-5 py-2.5 text-[15px] font-semibold transition-colors ${FOCUS} ${
                                    audience === t.key
                                        ? 'bg-[var(--color-accent)] text-[var(--color-ink)]'
                                        : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Hero */}
                <section className="max-w-4xl pb-16 pt-12 sm:pb-24 sm:pt-16">
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">{c.eyebrow}</p>
                    <h1 className={`${DISPLAY} mt-4 text-[clamp(2.75rem,8vw,6.5rem)] leading-[0.95]`}>{c.title}</h1>
                    <p className="mt-6 max-w-[52ch] text-lg leading-relaxed">{c.body}</p>

                    <ul className="mt-7 flex flex-wrap gap-2" aria-label="What students ask about">
                        {c.asked.map((t) => (
                            <li key={t} className="border border-[var(--color-ink)] bg-[var(--color-paper-3)] px-3 py-1.5 text-sm">
                                {t}
                            </li>
                        ))}
                    </ul>

                    <div className="mt-10 flex flex-col gap-5 sm:flex-row">
                        <button onClick={() => navigate(c.cta.to)} className={BTN_PRIMARY}>
                            {c.cta.label}
                            <ArrowRight className="h-4 w-4" aria-hidden />
                        </button>
                        <Link to={c.second.to} className={BTN_SECONDARY}>
                            {c.second.label}
                        </Link>
                    </div>
                </section>

                {/* Steps */}
                <section className="pb-16 sm:pb-24">
                    <h2 className={`${DISPLAY} text-[clamp(2.25rem,5vw,4rem)]`}>{c.stepsTitle}</h2>
                    <ol className={`mt-8 grid gap-6 ${c.steps.length === 4 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
                        {c.steps.map(({ icon: Icon, title, body }, i) => (
                            <li key={title} className={`${SHEET} flex gap-4 p-6`}>
                                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center bg-[var(--color-accent)]">
                                    <Icon className="h-5 w-5" aria-hidden />
                                </span>
                                <span>
                                    <span className={`${DISPLAY} block text-3xl`}>0{i + 1}</span>
                                    <span className="mt-1 block text-lg font-semibold leading-snug">{title}</span>
                                    <span className="mt-1.5 block text-base leading-relaxed text-[var(--color-muted)]">{body}</span>
                                </span>
                            </li>
                        ))}
                    </ol>
                </section>
            </main>

            {/* Share: toner band */}
            <section className="bg-[var(--color-ink)] text-[var(--color-paper)]">
                <div className={`${WRAP} grid items-start gap-8 py-14 sm:py-20 lg:grid-cols-[0.9fr_1.1fr]`}>
                    <div>
                        <h2 className={`${DISPLAY} text-[clamp(2.25rem,5vw,4rem)]`}>
                            {audience === 'placed' ? 'Know someone who got placed?' : 'Know someone prepping?'}
                        </h2>
                        <p className="mt-4 max-w-[40ch] text-base leading-relaxed opacity-80">
                            Send them this page. The message is ready, edit it if you like. The link opens this same page for them.
                        </p>
                    </div>
                    <div>
                        <label htmlFor="share-message" className="sr-only">Message to share</label>
                        <textarea
                            id="share-message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={5}
                            className="w-full resize-none border border-[var(--color-paper)] bg-transparent px-4 py-3 text-sm leading-relaxed text-[var(--color-paper)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                        />
                        <div className="mt-4 flex flex-wrap gap-4">
                            <a
                                href={`https://wa.me/?text=${encodeURIComponent(message)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${BTN_PRIMARY} !shadow-[4px_4px_0_var(--color-paper)] active:!shadow-none`}
                            >
                                <MessageCircle className="h-4 w-4" aria-hidden />
                                WhatsApp
                            </a>
                            <button onClick={() => copy(message, 'Message copied')} className={GHOST}>
                                {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                                Copy message
                            </button>
                            <button onClick={() => copy(url, 'Link copied')} className={GHOST}>
                                <Copy className="h-4 w-4" aria-hidden />
                                Copy link
                            </button>
                            <button onClick={nativeShare} className={`${GHOST} sm:hidden`}>
                                <Share2 className="h-4 w-4" aria-hidden />
                                More
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className={`${WRAP} py-16 sm:py-24`}>
                <div className="max-w-3xl">
                    <h2 className={`${DISPLAY} text-[clamp(2.25rem,5vw,4rem)]`}>Questions</h2>
                    <div className={`${SHEET} mt-8 divide-y divide-[var(--color-rule)] px-6 sm:px-9`}>
                        {c.faqs.map(([q, a]) => (
                            <details key={q} className="group py-5">
                                <summary className={`flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold ${FOCUS}`}>
                                    {q}
                                    <span className="text-2xl leading-none transition-transform group-open:rotate-45" aria-hidden>+</span>
                                </summary>
                                <p className="mt-3 text-base leading-relaxed text-[var(--color-muted)]">{a}</p>
                            </details>
                        ))}
                    </div>

                    <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                        <button onClick={() => navigate(c.cta.to)} className={BTN_INK}>
                            {c.cta.label}
                            <ArrowRight className="h-4 w-4" aria-hidden />
                        </button>
                        <span className="text-sm text-[var(--color-muted)]">Sign-in takes a minute.</span>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Campaign;
