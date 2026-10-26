import React, { useState, useEffect, useMemo } from 'react';
import { Search, CalendarDays, UserPlus, ArrowRight, ArrowDown, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import ExpertCard, { Expert, ExpertCardSkeleton } from './connect/ExpertCard';
import BookingScreen from './connect/BookingScreen';
import MyBookingsModal from './connect/MyBookingsModal';
import { trackMetaViewContent } from '@/lib/meta-pixel';

type SortKey = 'recent' | 'price';

const EXPERT_COLUMNS =
    'id, name, title, bio, skills, photo_url, price_inr, company, interview_date, package_lpa, proof_url, created_at';

const STEPS = [
    {
        title: 'Pick a senior and a slot',
        body: 'Choose someone placed at the company you are facing, then a 20-minute time that works for you.',
    },
    {
        title: 'Pay to hold the slot',
        body: 'Checkout is secure through Razorpay. Your request is saved the moment payment goes through.',
    },
    {
        title: 'We confirm and send one link',
        body: 'The Connect team confirms with the senior and emails the same meeting link to both of you.',
    },
];

const TOPICS = ['What was actually asked', 'How the rounds ran', 'Resume feedback', 'What to prep first'];

const sortExperts = (list: Expert[], sort: SortKey) => {
    const copy = [...list];
    if (sort === 'price') return copy.sort((a, b) => a.price_inr - b.price_inr);
    return copy.sort((a, b) => {
        const ad = a.interview_date ? Date.parse(a.interview_date) : Date.parse(a.created_at);
        const bd = b.interview_date ? Date.parse(b.interview_date) : Date.parse(b.created_at);
        return bd - ad;
    });
};

const ConnectPage = () => {
    const navigate = useNavigate();
    const { expertId } = useParams<{ expertId?: string }>();
    const [experts, setExperts] = useState<Expert[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCompany, setSelectedCompany] = useState('All');
    const [sort, setSort] = useState<SortKey>('recent');
    const [showMyBookings, setShowMyBookings] = useState(false);

    useEffect(() => {
        trackMetaViewContent({
            contentName: 'Connect 1:1',
            contentCategory: 'booking',
        });
    }, []);

    useEffect(() => {
        const fetchExperts = async () => {
            setLoading(true);
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 10_000);
            try {
                const { data } = await supabase
                    .from('experts')
                    .select(EXPERT_COLUMNS)
                    .eq('approved', true)
                    .order('created_at', { ascending: false })
                    .abortSignal(controller.signal);
                if (data) setExperts(data as unknown as Expert[]);
            } catch {
                // Network error or timeout — experts list stays empty
            } finally {
                clearTimeout(timer);
                setLoading(false);
            }
        };
        fetchExperts();
    }, []);

    // When navigating directly to /connect/:expertId, fetch and open that expert
    useEffect(() => {
        if (!expertId) {
            setSelectedExpert(null);
            return;
        }
        supabase
            .from('experts')
            .select(EXPERT_COLUMNS)
            .eq('id', expertId)
            .eq('approved', true)
            .single()
            .then(({ data }) => {
                if (data) setSelectedExpert(data as unknown as Expert);
            });
    }, [expertId]);

    const handleBook = (expert: Expert) => {
        navigate(`/connect/${expert.id}`);
    };

    const handleClose = () => {
        setSelectedExpert(null);
        navigate('/connect');
    };

    // Company chips come from the data, most-represented first, so we never show a dead filter.
    const companyChips = useMemo(() => {
        const counts = new Map<string, { label: string; count: number }>();
        for (const e of experts) {
            if (!e.company) continue;
            const key = e.company.toLowerCase();
            const existing = counts.get(key);
            if (existing) existing.count += 1;
            else counts.set(key, { label: e.company, count: 1 });
        }
        return [...counts.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    }, [experts]);

    const filteredExperts = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        const matches = experts.filter((e) => {
            if (selectedCompany !== 'All' && e.company?.toLowerCase() !== selectedCompany.toLowerCase()) return false;
            if (!q) return true;
            return (
                e.name.toLowerCase().includes(q) ||
                e.title?.toLowerCase().includes(q) ||
                e.bio?.toLowerCase().includes(q) ||
                e.company?.toLowerCase().includes(q) ||
                e.skills?.some((s) => s.toLowerCase().includes(q))
            );
        });
        return sortExperts(matches, sort);
    }, [experts, searchQuery, selectedCompany, sort]);

    const hasFilters = selectedCompany !== 'All' || searchQuery.trim() !== '';
    const clearFilters = () => {
        setSelectedCompany('All');
        setSearchQuery('');
    };

    return (
        <div className="min-h-screen bg-[#fbf6ea] text-stone-900 font-sans selection:bg-stone-200 overflow-x-hidden">
            <Header onStartTour={() => { }} />

            <main className="max-w-6xl mx-auto px-4 sm:px-6">
                {/* ── Hero ── */}
                <section className="pt-28 sm:pt-36 pb-12 sm:pb-16 grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-16 items-start">
                    <div>
                        <p className="inline-flex items-center gap-2 font-['Inter'] text-xs font-semibold uppercase tracking-[0.14em] text-[#43695a]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#557d6b]" />
                            Connect 1:1 · 20-minute live call
                        </p>
                        <h1 className="font-['Merriweather'] font-black tracking-tight text-stone-900 text-[2.5rem] leading-[1.08] sm:text-6xl sm:leading-[1.05] mt-5">
                            Talk to someone who just got placed.
                        </h1>
                        <p className="font-['Inter'] text-base sm:text-lg text-stone-600 leading-relaxed mt-5 max-w-xl">
                            Practice gets you ready for the round. A senior who sat in that exact interview tells you what it
                            was really like, and what you would do differently.
                        </p>

                        <ul className="flex flex-wrap gap-2 mt-6" aria-label="What students ask about">
                            {TOPICS.map((t) => (
                                <li
                                    key={t}
                                    className="px-3 py-1.5 rounded-full border border-stone-200 bg-white text-[13px] text-stone-700 font-['Inter']"
                                >
                                    {t}
                                </li>
                            ))}
                        </ul>

                        <div className="flex flex-wrap items-center gap-3 mt-8">
                            <a
                                href="#seniors"
                                className="inline-flex items-center gap-2 px-6 py-3.5 bg-stone-900 text-white rounded-2xl text-[15px] font-semibold font-['Inter'] hover:bg-stone-700 active:scale-[0.97] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-900"
                            >
                                Choose a senior
                                <ArrowDown className="w-4 h-4" />
                            </a>
                            <button
                                onClick={() => setShowMyBookings(true)}
                                className="inline-flex items-center gap-2 px-5 py-3.5 bg-white border border-stone-200 text-stone-700 rounded-2xl text-[15px] font-medium font-['Inter'] hover:border-stone-400 hover:text-stone-900 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-900"
                            >
                                <CalendarDays className="w-4 h-4" />
                                My bookings
                            </button>
                        </div>
                    </div>

                    {/* How the call works */}
                    <aside className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-7 shadow-[0_24px_48px_-32px_rgba(28,25,23,0.3)]">
                        <h2 className="font-['Inter'] text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                            How your call works
                        </h2>
                        <ol className="mt-5 relative">
                            {STEPS.map((step, i) => (
                                <li key={step.title} className="relative pl-12 pb-6 last:pb-0">
                                    {i < STEPS.length - 1 && (
                                        <span className="absolute left-[15px] top-8 bottom-1 w-px bg-stone-200" aria-hidden />
                                    )}
                                    <span className="absolute left-0 top-0 w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center text-sm font-['Merriweather']">
                                        {i + 1}
                                    </span>
                                    <p className="font-['Merriweather'] text-[16px] text-stone-900 leading-snug pt-1">{step.title}</p>
                                    <p className="font-['Inter'] text-sm text-stone-500 leading-relaxed mt-1">{step.body}</p>
                                </li>
                            ))}
                        </ol>
                        <p className="mt-6 pt-5 border-t border-stone-100 font-['Inter'] text-[13px] text-stone-500 leading-relaxed">
                            Calls are scheduled by our team, not auto-booked, so you will see your request as
                            <span className="text-stone-800 font-medium"> pending </span>
                            until the link arrives in My bookings and your inbox.
                        </p>
                    </aside>
                </section>

                {/* ── Seniors ── */}
                <section id="seniors" className="scroll-mt-24 pb-16">
                    <div className="flex items-end justify-between gap-4 flex-wrap">
                        <div>
                            <h2 className="font-['Merriweather'] text-3xl text-stone-900 tracking-tight">Seniors you can book</h2>
                            <p
                                className="font-['Inter'] text-sm text-stone-500 mt-1.5 min-h-[20px]"
                                aria-live="polite"
                            >
                                {loading
                                    ? 'Loading seniors…'
                                    : `${filteredExperts.length} ${filteredExperts.length === 1 ? 'senior' : 'seniors'}${
                                          selectedCompany !== 'All' ? ` placed at ${selectedCompany}` : ' available'
                                      }`}
                            </p>
                        </div>

                        <div
                            role="radiogroup"
                            aria-label="Sort seniors"
                            className="inline-flex p-1 rounded-xl bg-stone-100 border border-stone-200/70"
                        >
                            {([
                                ['recent', 'Recently placed'],
                                ['price', 'Lowest price'],
                            ] as [SortKey, string][]).map(([key, label]) => (
                                <button
                                    key={key}
                                    role="radio"
                                    aria-checked={sort === key}
                                    onClick={() => setSort(key)}
                                    className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium font-['Inter'] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 ${
                                        sort === key ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="mt-6 flex flex-col gap-3">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name, company or topic"
                                aria-label="Search seniors"
                                className="w-full pl-11 pr-10 py-3 bg-white border border-stone-200 rounded-2xl text-[15px] text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#557d6b]/40 focus:border-[#557d6b]/50 transition-all font-['Inter']"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    aria-label="Clear search"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {companyChips.length > 0 && (
                            <div
                                className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                                role="group"
                                aria-label="Filter by company"
                            >
                                {[{ label: 'All', count: experts.length }, ...companyChips].map(({ label, count }) => {
                                    const active = selectedCompany.toLowerCase() === label.toLowerCase();
                                    return (
                                        <button
                                            key={label}
                                            onClick={() => setSelectedCompany(label)}
                                            aria-pressed={active}
                                            className={`flex-shrink-0 inline-flex items-center gap-2 pl-4 pr-3 py-2 rounded-full text-sm font-medium font-['Inter'] border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-900 ${
                                                active
                                                    ? 'bg-stone-900 text-white border-stone-900'
                                                    : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                                            }`}
                                        >
                                            {label}
                                            <span
                                                className={`min-w-[22px] text-center px-1.5 py-0.5 rounded-full text-[11px] tabular-nums ${
                                                    active ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                                                }`}
                                            >
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Grid */}
                    <div className="mt-8">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {[0, 1, 2].map((i) => (
                                    <ExpertCardSkeleton key={i} />
                                ))}
                            </div>
                        ) : filteredExperts.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-stone-300 bg-white/60 px-6 py-16 text-center">
                                <CalendarDays className="w-10 h-10 text-stone-300 mx-auto mb-5" />
                                {experts.length === 0 ? (
                                    <>
                                        <h3 className="font-['Merriweather'] text-2xl text-stone-800">Seniors are being onboarded</h3>
                                        <p className="font-['Inter'] text-stone-500 max-w-md mx-auto mt-3 leading-relaxed">
                                            We review every senior before they are listed. Check back soon, or practice a round while
                                            you wait.
                                        </p>
                                        <button
                                            onClick={() => navigate('/dashboard')}
                                            className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-stone-900 text-white rounded-xl text-sm font-medium font-['Inter'] hover:bg-stone-700 transition-all"
                                        >
                                            Go to practice
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="font-['Merriweather'] text-xl text-stone-800">No seniors match that</h3>
                                        <p className="font-['Inter'] text-stone-500 text-sm mt-2">
                                            Try another company or a different keyword.
                                        </p>
                                        {hasFilters && (
                                            <button
                                                onClick={clearFilters}
                                                className="mt-5 px-4 py-2.5 bg-white border border-stone-300 text-stone-700 rounded-xl text-sm font-medium font-['Inter'] hover:border-stone-500 transition-all"
                                            >
                                                Clear filters
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {filteredExperts.map((expert) => (
                                    <ExpertCard key={expert.id} expert={expert} onBook={handleBook} />
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* ── Seniors who want to share ── */}
                <section className="pb-20">
                    <div className="rounded-3xl bg-stone-900 text-white px-6 py-8 sm:px-10 sm:py-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="max-w-xl">
                            <h2 className="font-['Merriweather'] text-2xl sm:text-3xl leading-tight">
                                Recently placed? Be the senior someone else needed.
                            </h2>
                            <p className="font-['Inter'] text-stone-300 text-[15px] leading-relaxed mt-3">
                                Share what you were asked and how you prepared. We review every senior before they are listed.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/placed-guru')}
                            className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-stone-900 rounded-2xl text-[15px] font-semibold font-['Inter'] hover:bg-stone-100 active:scale-[0.97] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900 focus-visible:ring-white"
                        >
                            <UserPlus className="w-4 h-4" />
                            Share your experience
                        </button>
                    </div>
                </section>
            </main>

            {selectedExpert && <BookingScreen expert={selectedExpert} onClose={handleClose} />}
            {showMyBookings && <MyBookingsModal onClose={() => setShowMyBookings(false)} />}
        </div>
    );
};

export default ConnectPage;
