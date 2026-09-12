import { useState, useEffect } from 'react';
import { X, Loader2, RefreshCw, Calendar, Clock, CheckCircle2, XCircle, Hourglass, Video, MessageCircle, ShieldCheck, Mail } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useAuth, useUser } from '@clerk/clerk-react';
import DMModal from './DMModal';

interface Booking {
  id: string;
  user_name: string;
  user_email: string;
  message: string | null;
  date: string;
  start_time: string;
  end_time: string;
  meet_link: string | null;
  status: string;
  created_at: string;
  experts: { id: string; name: string; title: string | null; photo_url: string | null } | null;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  payment_pending: {
    label: 'Payment Incomplete',
    icon: <Hourglass className="w-3 h-3" />,
    cls: 'bg-stone-50 text-stone-600 border border-stone-200',
  },
  paid: {
    label: 'Awaiting Confirmation',
    icon: <Hourglass className="w-3 h-3" />,
    cls: 'bg-amber-50 text-amber-700 border border-amber-100',
  },
  confirmed: {
    label: 'Confirmed',
    icon: <CheckCircle2 className="w-3 h-3" />,
    cls: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  },
  declined: {
    label: 'Declined',
    icon: <XCircle className="w-3 h-3" />,
    cls: 'bg-red-50 text-red-600 border border-red-100',
  },
  cancelled: {
    label: 'Cancelled',
    icon: <XCircle className="w-3 h-3" />,
    cls: 'bg-stone-50 text-stone-500 border border-stone-200',
  },
  completed: {
    label: 'Completed',
    icon: <CheckCircle2 className="w-3 h-3" />,
    cls: 'bg-stone-900 text-white border border-stone-900',
  },
  refunded: {
    label: 'Refunded',
    icon: <CheckCircle2 className="w-3 h-3" />,
    cls: 'bg-blue-50 text-blue-700 border border-blue-100',
  },
  payment_expired: {
    label: 'Checkout Expired',
    icon: <XCircle className="w-3 h-3" />,
    cls: 'bg-stone-50 text-stone-500 border border-stone-200',
  },
  payment_failed: {
    label: 'Payment Failed',
    icon: <XCircle className="w-3 h-3" />,
    cls: 'bg-red-50 text-red-600 border border-red-100',
  },
  no_show: {
    label: 'No Show',
    icon: <XCircle className="w-3 h-3" />,
    cls: 'bg-orange-50 text-orange-700 border border-orange-100',
  },
};

interface MyBookingsModalProps {
  onClose: () => void;
}

const MyBookingsModal = ({ onClose }: MyBookingsModalProps) => {
  const { user: clerkUser } = useUser();
  const { getToken } = useAuth();
  const clerkEmail = clerkUser?.primaryEmailAddress?.emailAddress ?? '';

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [history, setHistory] = useState<'upcoming' | 'past'>('upcoming');
  const [dmExpert, setDmExpert] = useState<Booking['experts'] | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/connect-my-bookings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        }
      );
      if (!response.ok) throw new Error('Could not load bookings');
      const data = await response.json();
      setBookings((data.bookings as Booking[]) || []);
    } catch {
      setBookings([]);
    } finally {
      clearTimeout(timer);
      setFetched(true);
      setLoading(false);
    }
  };

  // Auto-fetch on open if Clerk email is available
  useEffect(() => {
    if (clerkEmail) {
      fetchBookings();
    }
  }, [clerkEmail]);

  return (
    <>
      <div
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="bg-[#fcfcf9] w-full sm:max-w-[440px] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90dvh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 bg-white flex-shrink-0">
            <h2 className="text-sm font-['Merriweather'] text-stone-900">My Bookings</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors text-stone-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
            {/* Identity-scoped lookup — the server only returns this Clerk user's bookings */}
            <div className="flex items-center gap-2 p-2.5 pl-3.5 bg-stone-50 border border-stone-200 rounded-xl">
              <Mail className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
              <span className="flex-1 truncate text-xs text-stone-600 font-['Inter']">{clerkEmail}</span>
              <button
                onClick={fetchBookings}
                disabled={loading}
                className="w-8 h-8 bg-white border border-stone-200 rounded-lg flex items-center justify-center text-stone-500 disabled:opacity-50"
                aria-label="Refresh bookings"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Results */}
            {(() => {
              const closed = new Set(['completed', 'cancelled', 'declined', 'refunded', 'no_show', 'payment_expired', 'payment_failed']);
              const isPast = (booking: Booking) =>
                closed.has(booking.status) || new Date(`${booking.date}T${booking.end_time}`) < new Date();
              const visibleBookings = bookings.filter((booking) =>
                history === 'past' ? isPast(booking) : !isPast(booking)
              );
              return (
                <>
                  <div className="flex gap-1 p-1 bg-stone-100 rounded-xl">
                    {(['upcoming', 'past'] as const).map((key) => (
                      <button
                        key={key}
                        onClick={() => setHistory(key)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold font-['Inter'] capitalize transition-all ${
                          history === key ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
                        }`}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
                </div>
              ) : fetched && visibleBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mb-1">
                    <Calendar className="w-7 h-7 text-stone-300" />
                  </div>
                  <p className="text-stone-800 text-sm font-['Merriweather'] font-bold">
                    {history === 'past' ? 'No past sessions' : 'No upcoming bookings'}
                  </p>
                  <p className="text-stone-400 text-xs font-['Inter'] max-w-[200px] leading-relaxed">
                    {history === 'past'
                      ? 'Completed and cancelled sessions will appear here.'
                      : "You haven't made any bookings. Browse our Placed Gurus and book a session!"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleBookings.map((booking) => {
                    const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.cancelled;
                    return (
                      <div key={booking.id} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 space-y-3">

                        {/* Message banner — top of card, only for paid/confirmed */}
                        {(booking.status === 'paid' || booking.status === 'confirmed') && booking.experts && (
                          <button
                            onClick={() => setDmExpert(booking.experts)}
                            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 hover:bg-stone-100 active:scale-[0.99] transition-all group"
                          >
                            <div className="w-6 h-6 rounded-lg bg-stone-200 group-hover:bg-stone-300 flex items-center justify-center flex-shrink-0 transition-colors">
                              <MessageCircle className="w-3.5 h-3.5 text-stone-600" />
                            </div>
                            <span className="text-xs font-medium text-stone-600 font-['Inter']">
                              Message {booking.experts.name.split(' ')[0]}
                            </span>
                            <span className="ml-auto text-[10px] text-stone-400 font-['Inter']">Send a message →</span>
                          </button>
                        )}

                        {/* Expert + status */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            {booking.experts?.photo_url ? (
                              <img
                                src={booking.experts.photo_url}
                                alt={booking.experts.name}
                                className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500 text-xs font-['Merriweather'] flex-shrink-0">
                                {booking.experts?.name?.charAt(0) ?? '?'}
                              </div>
                            )}
                            <span className="text-sm font-['Merriweather'] text-stone-900">
                              {booking.experts?.name ?? 'Unknown Expert'}
                            </span>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium font-['Inter'] flex-shrink-0 ${status.cls}`}>
                            {status.icon}
                            {status.label}
                          </span>
                        </div>

                        {/* Date / time */}
                        <div className="flex items-center gap-4 text-xs text-stone-500 font-['Inter']">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(parseISO(booking.date), 'EEE, MMM d, yyyy')}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {booking.start_time.slice(0, 5)} – {booking.end_time.slice(0, 5)}
                          </span>
                        </div>

                        {/* Booking note */}
                        {booking.message && (
                          <p className="text-xs text-stone-500 font-['Inter'] line-clamp-2 bg-stone-50 rounded-lg px-3 py-2">
                            {booking.message}
                          </p>
                        )}

                        {/* Meet link / managed scheduling state */}
                        {(booking.status === 'paid' || booking.status === 'confirmed') && (
                          booking.meet_link ? (
                            <a
                              href={booking.meet_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-1.5 w-full py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-lg text-xs font-medium font-['Inter'] transition-colors"
                            >
                              <Video className="w-3 h-3" />
                              Join Google Meet
                            </a>
                          ) : (
                            <div className="flex items-center gap-2.5 w-full py-2.5 px-3 bg-stone-50 border border-stone-200 rounded-lg">
                              <ShieldCheck className="w-3.5 h-3.5 text-stone-500 flex-shrink-0" />
                              <p className="text-[11px] text-stone-500 font-['Inter'] leading-snug">
                                Our Connect team is arranging the call. The link will appear here and arrive by email.
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
                </>
              );
            })()}
          </div>
        </div>
      </div>
      {dmExpert && (
        <DMModal
          expert={dmExpert as any}
          onClose={() => setDmExpert(null)}
        />
      )}
    </>
  );
};

export default MyBookingsModal;
