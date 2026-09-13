import React, { useState, useEffect } from 'react';
import { Search, Loader2, CalendarDays, UserPlus, ChevronDown } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import ExpertCard, { Expert } from './connect/ExpertCard';
import BookingScreen from './connect/BookingScreen';
import MyBookingsModal from './connect/MyBookingsModal';
import { trackMetaViewContent } from '@/lib/meta-pixel';

const ConnectPage = () => {
    const navigate = useNavigate();
    const { expertId } = useParams<{ expertId?: string }>();
    const [experts, setExperts] = useState<Expert[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCompany, setSelectedCompany] = useState('All');
    const [showMyBookings, setShowMyBookings] = useState(false);

    const COMPANIES = ['All', 'Accenture', 'Infosys', 'Cognizant', 'TCS', 'Wipro', 'IBM'];

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
                    .select('id, name, title, bio, skills, photo_url, price_inr, company, interview_date, package_lpa, proof_url, created_at')
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
            .select('id, name, title, bio, skills, photo_url, price_inr, company, interview_date, package_lpa, proof_url, created_at')
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

    const filteredExperts = experts.filter((e) => {
        const matchesCompany = selectedCompany === 'All' || (e.company?.toLowerCase() === selectedCompany.toLowerCase());
        if (!matchesCompany) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            e.name.toLowerCase().includes(q) ||
            (e.title?.toLowerCase().includes(q)) ||
            (e.bio?.toLowerCase().includes(q)) ||
            (e.skills?.some((s) => s.toLowerCase().includes(q)))
        );
    });

    return (
        <div className="min-h-screen bg-[#fcfcf9] text-stone-900 font-sans selection:bg-stone-200 overflow-x-hidden">
            <div className={`w-full flex flex-col items-center transition-all duration-700 z-50`}>
                <Header onStartTour={() => { }} />
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <div className="flex flex-col items-start sm:items-center text-left sm:text-center mb-8 md:mb-12 pt-10 sm:pt-16">
                    <h1 className="font-['Merriweather'] text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-stone-900">
                        Connect 1:1
                    </h1>
                    <p className="text-[15px] sm:text-lg text-stone-600 max-w-xl leading-relaxed mt-4">
                        Book 20 minutes with a recently placed senior. You pay first. Our team confirms the slot and emails one meeting link to both of you.
                    </p>
                </div>

                {/* Search + Willing to Share + My Bookings */}
                <div className="flex flex-col gap-3 mb-8">
                    {/* Row 1: Company dropdown + Search input */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="relative flex-shrink-0">
                            <select
                                value={selectedCompany}
                                onChange={(e) => setSelectedCompany(e.target.value)}
                                className="appearance-none pl-3 sm:pl-4 pr-8 sm:pr-9 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-700 font-medium font-['Inter'] focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent transition-all shadow-sm cursor-pointer hover:border-stone-400"
                            >
                                {COMPANIES.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                        </div>
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name, skill, or company..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent transition-all font-['Inter']"
                            />
                        </div>
                    </div>
                    {/* Row 2: Action buttons — full width on mobile, auto on desktop */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/placed-guru')}
                            className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-700 active:scale-95 text-white rounded-xl text-sm font-medium font-['Inter'] transition-all shadow-sm hover:shadow-md"
                        >
                            <UserPlus className="w-4 h-4 flex-shrink-0" />
                            <span className="sm:hidden">Share Experience</span>
                            <span className="hidden sm:inline">Willing to Share Your Experience?</span>
                        </button>
                        <button
                            onClick={() => setShowMyBookings(true)}
                            className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2.5 bg-white border border-stone-200 text-stone-600 rounded-xl text-sm font-medium font-['Inter'] hover:border-stone-400 hover:text-stone-900 transition-all shadow-sm"
                        >
                            <CalendarDays className="w-4 h-4 flex-shrink-0" />
                            My Bookings
                        </button>
                    </div>
                </div>

                {/* Expert Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
                        <span className="text-stone-400 text-sm font-['Inter']">Finding experts...</span>
                    </div>
                ) : filteredExperts.length === 0 ? (
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100 text-center py-20">
                        <CalendarDays className="w-12 h-12 text-stone-300 mx-auto mb-6" />
                        {experts.length === 0 ? (
                            <>
                                <h2 className="text-2xl font-serif text-stone-800 mb-4">Coming Soon</h2>
                                <p className="text-stone-500 max-w-md mx-auto">
                                    We're onboarding mentors right now. Check back soon!
                                </p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-xl font-serif text-stone-800 mb-3">No matches found</h2>
                                <p className="text-stone-500 text-sm">Try searching for a different skill or name.</p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredExperts.map((expert) => (
                            <ExpertCard
                                key={expert.id}
                                expert={expert}
                                onBook={handleBook}
                            />
                        ))}
                    </div>
                )}
            </div>

            {selectedExpert && (
                <BookingScreen
                    expert={selectedExpert}
                    onClose={handleClose}
                />
            )}
            {showMyBookings && (
                <MyBookingsModal onClose={() => setShowMyBookings(false)} />
            )}
        </div>
    );
};

export default ConnectPage;
