import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Check, Copy, Share2, MessageCircle, BadgeCheck, CalendarClock, IndianRupee, ClipboardList, Mic, Gamepad2, PhoneCall } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';

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
        <div className="min-h-screen bg-[#fbf6ea] text-stone-900 font-sans selection:bg-stone-200 overflow-x-hidden">
            <Header onStartTour={() => { }} />

            <main className="max-w-5xl mx-auto px-4 sm:px-6">
                {/* Audience switch */}
                <div className="pt-24 sm:pt-28 flex justify-center">
                    <div role="tablist" aria-label="Who is this for" className="inline-flex p-1 rounded-2xl bg-stone-100 border border-stone-200/70">
                        {TABS.map((t) => (
                            <button
                                key={t.key}
                                role="tab"
                                aria-selected={audience === t.key}
                                onClick={() => setParams({ for: t.key }, { replace: true })}
                                className={`px-5 py-2.5 rounded-xl text-sm font-medium font-['Inter'] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 ${
                                    audience === t.key ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Hero */}
                <section className="pt-12 sm:pt-16 pb-14 sm:pb-20 max-w-3xl">
                    <p className="inline-flex items-center gap-2 font-['Inter'] text-xs font-semibold uppercase tracking-[0.14em] text-[#43695a]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#557d6b]" />
                        {c.eyebrow}
                    </p>
                    <h1 className="font-['Merriweather'] font-black tracking-tight text-stone-900 text-[2.5rem] leading-[1.08] sm:text-6xl sm:leading-[1.05] mt-5">
                        {c.title}
                    </h1>
                    <p className="font-['Inter'] text-base sm:text-lg text-stone-600 leading-relaxed mt-5 max-w-2xl">{c.body}</p>

                    <ul className="flex flex-wrap gap-2 mt-6" aria-label="What students ask about">
                        {c.asked.map((t) => (
                            <li key={t} className="px-3 py-1.5 rounded-full border border-stone-200 bg-white text-[13px] text-stone-700 font-['Inter']">
                                {t}
                            </li>
                        ))}
                    </ul>

                    <div className="flex flex-wrap items-center gap-3 mt-8">
                        <button
                            onClick={() => navigate(c.cta.to)}
                            className="inline-flex items-center gap-2 px-6 py-3.5 bg-stone-900 text-white rounded-2xl text-[15px] font-semibold font-['Inter'] hover:bg-stone-700 active:scale-[0.97] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-900"
                        >
                            {c.cta.label}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <Link
                            to={c.second.to}
                            className="inline-flex items-center gap-2 px-5 py-3.5 bg-white border border-stone-200 text-stone-700 rounded-2xl text-[15px] font-medium font-['Inter'] hover:border-stone-400 hover:text-stone-900 transition-all"
                        >
                            {c.second.label}
                        </Link>
                    </div>
                </section>

                {/* Steps */}
                <section className="pb-16 sm:pb-20">
                    <h2 className="font-['Merriweather'] text-3xl text-stone-900 tracking-tight">{c.stepsTitle}</h2>
                    <ol className={`mt-8 grid gap-4 ${c.steps.length === 4 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
                        {c.steps.map(({ icon: Icon, title, body }, i) => (
                            <li key={title} className="rounded-3xl border border-stone-200 bg-white p-6 flex gap-4">
                                <span className="w-11 h-11 rounded-2xl bg-[#557d6b]/10 text-[#43695a] flex items-center justify-center flex-shrink-0">
                                    <Icon className="w-5 h-5" />
                                </span>
                                <span>
                                    <span className="block font-['Inter'] text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">Step {i + 1}</span>
                                    <span className="block font-['Merriweather'] text-[17px] text-stone-900 leading-snug mt-1">{title}</span>
                                    <span className="block font-['Inter'] text-sm text-stone-500 leading-relaxed mt-1.5">{body}</span>
                                </span>
                            </li>
                        ))}
                    </ol>
                </section>

                {/* Share */}
                <section className="pb-16 sm:pb-20">
                    <div className="rounded-3xl bg-stone-900 text-white p-6 sm:p-10 grid lg:grid-cols-[0.9fr_1.1fr] gap-8 items-start">
                        <div>
                            <h2 className="font-['Merriweather'] text-2xl sm:text-3xl leading-tight">
                                {audience === 'placed' ? 'Know someone who got placed?' : 'Know someone prepping?'}
                            </h2>
                            <p className="font-['Inter'] text-stone-300 text-[15px] leading-relaxed mt-3">
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
                                className="w-full rounded-2xl bg-white/10 border border-white/15 text-white placeholder:text-stone-400 px-4 py-3 text-sm leading-relaxed font-['Inter'] focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                            />
                            <div className="flex flex-wrap gap-2.5 mt-3">
                                <a
                                    href={`https://wa.me/?text=${encodeURIComponent(message)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-5 py-3 bg-white text-stone-900 rounded-xl text-sm font-semibold font-['Inter'] hover:bg-stone-100 active:scale-[0.97] transition-all"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    WhatsApp
                                </a>
                                <button
                                    onClick={() => copy(message, 'Message copied')}
                                    className="inline-flex items-center gap-2 px-5 py-3 border border-white/25 text-white rounded-xl text-sm font-medium font-['Inter'] hover:bg-white/10 active:scale-[0.97] transition-all"
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    Copy message
                                </button>
                                <button
                                    onClick={() => copy(url, 'Link copied')}
                                    className="inline-flex items-center gap-2 px-5 py-3 border border-white/25 text-white rounded-xl text-sm font-medium font-['Inter'] hover:bg-white/10 active:scale-[0.97] transition-all"
                                >
                                    <Copy className="w-4 h-4" />
                                    Copy link
                                </button>
                                <button
                                    onClick={nativeShare}
                                    className="sm:hidden inline-flex items-center gap-2 px-5 py-3 border border-white/25 text-white rounded-xl text-sm font-medium font-['Inter'] hover:bg-white/10"
                                >
                                    <Share2 className="w-4 h-4" />
                                    More
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="pb-20 max-w-3xl">
                    <h2 className="font-['Merriweather'] text-3xl text-stone-900 tracking-tight">Questions</h2>
                    <div className="mt-6 divide-y divide-stone-200 border-y border-stone-200">
                        {c.faqs.map(([q, a]) => (
                            <details key={q} className="group py-5">
                                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-['Merriweather'] text-[17px] text-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 rounded">
                                    {q}
                                    <span className="text-stone-400 text-xl leading-none transition-transform group-open:rotate-45" aria-hidden>+</span>
                                </summary>
                                <p className="font-['Inter'] text-[15px] text-stone-600 leading-relaxed mt-3">{a}</p>
                            </details>
                        ))}
                    </div>

                    <div className="mt-10 flex flex-wrap items-center gap-4">
                        <button
                            onClick={() => navigate(c.cta.to)}
                            className="inline-flex items-center gap-2 px-6 py-3.5 bg-stone-900 text-white rounded-2xl text-[15px] font-semibold font-['Inter'] hover:bg-stone-700 active:scale-[0.97] transition-all"
                        >
                            {c.cta.label}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <span className="font-['Inter'] text-sm text-stone-500">Sign-in takes a minute.</span>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Campaign;
