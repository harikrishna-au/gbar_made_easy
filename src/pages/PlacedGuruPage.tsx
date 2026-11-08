import { useAuth, useUser } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, BadgeCheck, TrendingUp, Clock, CalendarDays, CheckCircle2, XCircle, Hourglass, Loader2, Calendar, ArrowLeft, X, Video, MessageCircle, Mail, ShieldCheck } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Header from '@/components/Header';
import GuruProfileForm from './placed-guru/GuruProfileForm';
import { Expert } from './connect/ExpertCard';

/* ── Profile mini-card ─────────────────────────────────────────────── */

const MyExpertCard = ({
  expert,
  onEdit,
}: {
  expert: Expert & { google_refresh_token?: string | null };
  onEdit: () => void;
}) => (
  <div className="bg-[var(--color-paper-3)] rounded-none p-5 shadow-[var(--shadow-sheet)] flex items-start gap-4">
    <div className="flex-shrink-0">
      {expert.photo_url ? (
        <img
          src={expert.photo_url}
          alt={expert.name}
          className="w-12 h-12 rounded-none object-cover"
        />
      ) : (
        <div className="w-12 h-12 rounded-none bg-[var(--color-accent)] flex items-center justify-center text-lg font-display uppercase text-[var(--color-muted)]">
          {expert.name.charAt(0)}
        </div>
      )}
    </div>

    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-display uppercase text-[var(--color-ink)] truncate">{expert.name}</h3>
          {expert.title && (
            <p className="text-xs text-[var(--color-muted)] mt-0.5 font-['Inter'] line-clamp-1">{expert.title}</p>
          )}
        </div>
        <button
          onClick={onEdit}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-paper-2)] border border-[var(--color-rule)] text-[var(--color-ink)] rounded-none text-xs font-medium font-['Inter'] hover:bg-[var(--color-paper-2)]  transition-all"
        >
          <Pencil className="w-3 h-3" />
          Edit
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-2">
        {expert.company && (
          <span className="inline-flex items-center gap-1 text-xs text-[var(--color-muted)] font-['Inter']">
            <BadgeCheck className="w-3 h-3 text-[var(--color-muted)]" />
            {expert.company}
          </span>
        )}
        {expert.package_lpa && (
          <span className="inline-flex items-center gap-1 text-xs text-[var(--color-ink)] font-['Inter']">
            <TrendingUp className="w-3 h-3" />
            ₹{expert.package_lpa} LPA
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-xs text-[var(--color-muted)] font-['Inter']">
          <Clock className="w-3 h-3" />
          ₹{expert.price_inr} / session
        </span>
      </div>

      {expert.skills && expert.skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {expert.skills.slice(0, 3).map((skill, i) => (
            <span
              key={i}
              className="px-2 py-0.5 bg-[var(--color-paper-2)] border border-[var(--color-rule)] text-[var(--color-ink)] text-xs rounded-full font-['Inter']"
            >
              {skill}
            </span>
          ))}
          {expert.skills.length > 3 && (
            <span className="px-2 py-0.5 text-[var(--color-muted)] text-xs font-['Inter']">
              +{expert.skills.length - 3} more
            </span>
          )}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-[var(--color-rule)]">
        <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-muted)] font-['Inter']">
          <ShieldCheck className="w-3 h-3" />
          Calls coordinated by the Connect team
        </span>
      </div>
    </div>
  </div>
);

/* ── Booking status config ─────────────────────────────────────────── */

const BOOKING_STATUS: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  paid: {
    label: 'Team coordinating',
    icon: <Hourglass className="w-3 h-3" />,
    cls: 'bg-[var(--color-paper-2)] text-[var(--color-ink)] border border-[var(--color-rule)]',
  },
  confirmed: {
    label: 'Confirmed',
    icon: <CheckCircle2 className="w-3 h-3" />,
    cls: 'bg-[var(--color-accent)] text-[var(--color-ink)] shadow-[3px_3px_0_var(--color-ink)] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none border border-[var(--color-ink)]',
  },
  completed: {
    label: 'Completed',
    icon: <CheckCircle2 className="w-3 h-3" />,
    cls: 'bg-[var(--color-accent)] text-[var(--color-ink)] shadow-[3px_3px_0_var(--color-ink)] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none border-[var(--color-ink)]',
  },
  cancelled: {
    label: 'Cancelled',
    icon: <XCircle className="w-3 h-3" />,
    cls: 'bg-[var(--color-paper-2)] text-[var(--color-muted)] border border-[var(--color-rule)]',
  },
  declined: {
    label: 'Declined',
    icon: <XCircle className="w-3 h-3" />,
    cls: 'bg-[var(--color-paper-2)] text-[var(--color-error)] border border-red-100',
  },
  refunded: {
    label: 'Refunded',
    icon: <XCircle className="w-3 h-3" />,
    cls: 'bg-blue-50 text-blue-700 border border-blue-100',
  },
  no_show: {
    label: 'No show',
    icon: <XCircle className="w-3 h-3" />,
    cls: 'bg-orange-50 text-orange-700 border border-orange-100',
  },
};

/* ── Expert bookings panel ─────────────────────────────────────────── */

interface ExpertBooking {
  id: string;
  expert_id: string;
  user_name: string;
  user_email: string;
  message: string | null;
  date: string;
  start_time: string;
  end_time: string;
  meet_link: string | null;
  status: string;
  experts: { name: string; photo_url: string | null; price_inr: number } | null;
}

const isMeetingEnded = (date: string, endTime: string) =>
  new Date(`${date}T${endTime}`) < new Date();

const BookingsPanel = () => {
  const { getToken } = useAuth();
  const [bookings, setBookings] = useState<ExpertBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/connect-expert-bookings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error('Could not load bookings');
      const data = await response.json();
      setBookings((data.bookings as ExpertBooking[]) || []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-[var(--color-rule)] border-t-[var(--color-ink)] rounded-full animate-spin" />
      </div>
    );
  }

  const closed = new Set(['declined', 'cancelled', 'refunded', 'no_show', 'completed']);
  const activeBookings = bookings.filter(
    (b) => !closed.has(b.status) && !isMeetingEnded(b.date, b.end_time)
  );
  const completedSessions = bookings.filter(
    (b) => b.status === 'completed' || (b.status === 'confirmed' && isMeetingEnded(b.date, b.end_time))
  );

  const totalEarned = completedSessions.reduce(
    (sum, b) => sum + (b.experts?.price_inr ?? 0), 0
  );
  const upcoming = activeBookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'paid'
  ).length;

  if (bookings.length === 0) {
    return (
      <div className="bg-[var(--color-paper-3)] rounded-none p-12 shadow-[var(--shadow-sheet)] flex flex-col items-center text-center">
        <CalendarDays className="w-8 h-8 text-[var(--color-muted)] mb-3" />
        <p className="text-[var(--color-muted)] text-sm font-['Inter']">No bookings yet.</p>
      </div>
    );
  }

  const order = ['paid', 'confirmed', 'declined'];
  const sorted = [...activeBookings].sort(
    (a, b) => order.indexOf(a.status) - order.indexOf(b.status)
  );

  return (
    <div className="space-y-4">
      {/* ── Income stats banner ── */}
      <div className="bg-[var(--color-paper-3)] rounded-none border border-[var(--color-rule)] shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--color-rule)]">
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[var(--color-muted)] font-['Inter']">
            Earnings Overview
          </p>
        </div>
        <div className="grid grid-cols-3 divide-x divide-[var(--color-rule)]">
          <div className="px-5 py-4 flex flex-col gap-0.5">
            <span className="text-[11px] text-[var(--color-muted)] font-['Inter']">Total Earned</span>
            <span className="text-xl font-bold font-['Inter'] text-[var(--color-ink)]">
              ₹{totalEarned.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-[var(--color-muted)] font-['Inter']">{completedSessions.length} session{completedSessions.length !== 1 ? 's' : ''} completed</span>
          </div>
          <div className="px-5 py-4 flex flex-col gap-0.5">
            <span className="text-[11px] text-[var(--color-muted)] font-['Inter']">Upcoming</span>
            <span className="text-xl font-bold font-['Inter'] text-[var(--color-ink)]">{upcoming}</span>
            <span className="text-[11px] text-[var(--color-muted)] font-['Inter']">session{upcoming !== 1 ? 's' : ''} scheduled</span>
          </div>
          <div className="px-5 py-4 flex flex-col gap-0.5">
            <span className="text-[11px] text-[var(--color-muted)] font-['Inter']">Pending</span>
            <span className="text-xl font-bold font-['Inter'] text-[var(--color-ink)]">
              {activeBookings.filter((b) => b.status === 'paid').length}
            </span>
            <span className="text-[11px] text-[var(--color-muted)] font-['Inter']">awaiting Connect team</span>
          </div>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="bg-[var(--color-paper-3)] rounded-none p-10 shadow-[var(--shadow-sheet)] flex flex-col items-center text-center">
          <CalendarDays className="w-7 h-7 text-[var(--color-muted)] mb-3" />
          <p className="text-[var(--color-muted)] text-sm font-['Inter']">No upcoming sessions.</p>
        </div>
      ) : null}

      {sorted.map((booking) => {
        const st = BOOKING_STATUS[booking.status] ?? BOOKING_STATUS.declined;
        const isPending = booking.status === 'paid';
        return (
          <div key={booking.id} className="bg-[var(--color-paper-3)] rounded-none p-5 shadow-[var(--shadow-sheet)] space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-display uppercase text-[var(--color-ink)]">{booking.user_name}</p>
                {booking.user_email && (
                  <p className="text-xs text-[var(--color-muted)] font-['Inter'] mt-0.5">{booking.user_email}</p>
                )}
              </div>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium font-['Inter'] flex-shrink-0 ${st.cls}`}>
                {st.icon}
                {st.label}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-[var(--color-muted)] font-['Inter']">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(parseISO(booking.date), 'EEE, MMM d, yyyy')}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {booking.start_time.slice(0, 5)} – {booking.end_time.slice(0, 5)}
              </span>
            </div>

            {booking.experts && (
              <p className="text-xs text-[var(--color-muted)] font-['Inter']">
                For: <span className="text-[var(--color-ink)] font-medium">{booking.experts.name}</span>
              </p>
            )}

            {booking.message && (
              <p className="text-xs text-[var(--color-muted)] font-['Inter'] bg-[var(--color-paper-2)] rounded-none px-3 py-2 line-clamp-3">
                {booking.message}
              </p>
            )}

            {isPending && (
              <div className="flex items-start gap-2.5 p-3 bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-none">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-muted)] flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-[var(--color-muted)] font-['Inter'] leading-relaxed">
                  The Connect team is reviewing this paid booking and will coordinate the schedule and meeting link with both sides.
                </p>
              </div>
            )}

            {/* Meet link */}
            {booking.meet_link ? (
              <a
                href={booking.meet_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 w-full py-2 bg-[var(--color-accent)] text-[var(--color-ink)] shadow-[3px_3px_0_var(--color-ink)] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none rounded-none text-xs font-medium font-['Inter'] transition-colors"
              >
                <Video className="w-3 h-3" />
                Join Google Meet
              </a>
            ) : booking.status !== 'declined' ? (
              <div className="flex items-center justify-center gap-1.5 w-full py-2 bg-[var(--color-paper-2)] border border-[var(--color-rule)] text-[var(--color-muted)] rounded-none text-xs font-medium font-['Inter']">
                <Clock className="w-3 h-3" />
                Meeting link managed by Connect team
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

/* ── Messages panel ────────────────────────────────────────────────── */

interface Message {
  id: string;
  sender_name: string;
  sender_email: string;
  subject: string | null;
  body: string;
  is_read: boolean;
  created_at: string;
  experts: { name: string } | null;
}

const MessagesPanel = ({ userId }: { userId: string }) => {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = await getToken();
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/connect-expert-profile`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ action: 'messages' }),
          }
        );
        if (!response.ok) throw new Error('Could not load messages');
        const data = await response.json();
        setMessages((data.messages as Message[]) || []);
      } catch {
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [userId, getToken]);

  const markRead = async (id: string) => {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, is_read: true } : m));
    const token = await getToken();
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/connect-expert-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'mark_read', message_id: id }),
    });
  };

  const unreadCount = messages.filter((m) => !m.is_read).length;

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-6 h-6 border-2 border-[var(--color-rule)] border-t-[var(--color-ink)] rounded-full animate-spin" />
    </div>
  );

  if (messages.length === 0) return (
    <div className="bg-[var(--color-paper-3)] rounded-none p-12 shadow-[var(--shadow-sheet)] flex flex-col items-center text-center">
      <MessageCircle className="w-8 h-8 text-[var(--color-muted)] mb-3" />
      <p className="text-[var(--color-muted)] text-sm font-['Inter']">No messages yet.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {unreadCount > 0 && (
        <p className="text-xs text-[var(--color-muted)] font-['Inter']">
          {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
        </p>
      )}
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`bg-[var(--color-paper-3)] rounded-none shadow-sm border transition-all ${msg.is_read ? 'border-[var(--color-rule)]' : 'border-[var(--color-rule)]'}`}
        >
          <button
            className="w-full text-left px-5 py-4 flex items-start justify-between gap-3"
            onClick={() => {
              setExpanded(expanded === msg.id ? null : msg.id);
              if (!msg.is_read) markRead(msg.id);
            }}
          >
            <div className="flex items-start gap-3 min-w-0">
              {!msg.is_read && (
                <span className="mt-1.5 w-2 h-2 bg-[var(--color-ink)] rounded-full flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p className={`text-sm font-['Inter'] truncate ${msg.is_read ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink)] font-semibold'}`}>
                  {msg.sender_name}
                  {msg.experts && <span className="text-[var(--color-muted)] font-normal"> → {msg.experts.name}</span>}
                </p>
                {msg.subject && (
                  <p className="text-xs text-[var(--color-muted)] font-['Inter'] mt-0.5 truncate">{msg.subject}</p>
                )}
                {!expanded && (
                  <p className="text-xs text-[var(--color-muted)] font-['Inter'] mt-0.5 line-clamp-1">{msg.body}</p>
                )}
              </div>
            </div>
            <span className="text-xs text-[var(--color-muted)] font-['Inter'] flex-shrink-0 mt-0.5">
              {format(parseISO(msg.created_at), 'MMM d')}
            </span>
          </button>

          {expanded === msg.id && (
            <div className="px-5 pb-4 space-y-3 border-t border-[var(--color-rule)] pt-3">
              <p className="text-sm text-[var(--color-ink)] font-['Inter'] leading-relaxed whitespace-pre-wrap">
                {msg.body}
              </p>
              <a
                href={`mailto:${msg.sender_email}?subject=Re: ${msg.subject ?? 'Your message'}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-[var(--color-accent)] text-[var(--color-ink)] shadow-[3px_3px_0_var(--color-ink)] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none rounded-none text-xs font-medium font-['Inter']  transition-all"
              >
                <Mail className="w-3 h-3" />
                Reply to {msg.sender_email}
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/* ── Management panel ──────────────────────────────────────────────── */

type View = 'list' | 'add' | 'edit';

const ManagementPanel = ({ userId }: { userId: string }) => {
  const { getToken } = useAuth();
  const [tab, setTab] = useState<'profiles' | 'bookings' | 'messages'>('profiles');
  const [view, setView] = useState<View>('list');
  const [experts, setExperts] = useState<Expert[]>([]);
  const [editingExpert, setEditingExpert] = useState<Expert | null>(null);
  const [fetching, setFetching] = useState(true);

  const fetchMyExperts = async () => {
    setFetching(true);
    try {
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/connect-expert-profile`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: 'list' }),
        }
      );
      if (!response.ok) throw new Error('Could not load profiles');
      const data = await response.json();
      setExperts((data.experts as Expert[]) || []);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchMyExperts(); }, []);

  const handleAddSuccess = () => { fetchMyExperts(); setView('list'); };
  const handleEditSuccess = () => { fetchMyExperts(); setView('list'); setEditingExpert(null); };
  const handleEdit = (expert: Expert) => { setEditingExpert(expert); setView('edit'); };
  const handleCancel = () => { setView('list'); setEditingExpert(null); };

  const headingMap: Record<View, string> = {
    list: 'My Profiles',
    add: 'Add Expert Profile',
    edit: 'Edit Profile',
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-12">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          {/* Back button — visible when in add/edit form */}
          {tab === 'profiles' && (view === 'add' || view === 'edit') && (
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 px-3 py-2 bg-[var(--color-paper-2)] text-[var(--color-ink)] rounded-none text-sm font-medium font-['Inter'] hover:bg-[var(--color-paper-2)]  transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}
          <h1 className="font-display uppercase text-4xl sm:text-5xl leading-none text-[var(--color-ink)]">
            {tab === 'profiles' ? headingMap[view] : tab === 'bookings' ? 'Bookings' : 'Messages'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {tab === 'profiles' && view === 'list' && (
            <button
              onClick={() => setView('add')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-accent)] text-[var(--color-ink)] shadow-[3px_3px_0_var(--color-ink)] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none rounded-none text-sm font-medium font-['Inter']  transition-all whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add Profile
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-[var(--color-paper-2)] rounded-none mb-6">
        {([['profiles', 'My Profiles'], ['bookings', 'Bookings'], ['messages', 'Messages']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setTab(key); if (key === 'profiles') setView('list'); }}
            className={`flex-1 py-2 text-sm font-medium font-['Inter'] rounded-none transition-all ${tab === key
              ? 'bg-[var(--color-paper-3)] text-[var(--color-ink)] shadow-sm'
              : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'bookings' && <BookingsPanel />}
      {tab === 'messages' && <MessagesPanel userId={userId} />}

      {tab === 'profiles' && view === 'list' && (
        <>
          {fetching ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-[var(--color-rule)] border-t-[var(--color-ink)] rounded-full animate-spin" />
            </div>
          ) : experts.length === 0 ? (
            <div className="bg-[var(--color-paper-3)] rounded-none p-12 shadow-[var(--shadow-sheet)] flex flex-col items-center text-center">
              <p className="text-[var(--color-muted)] text-sm font-['Inter'] mb-5">No expert profiles yet.</p>
              <button
                onClick={() => setView('add')}
                className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-accent)] text-[var(--color-ink)] shadow-[3px_3px_0_var(--color-ink)] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_var(--color-ink)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none rounded-none text-sm font-medium font-['Inter']  transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Your First Profile
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {experts.map((expert) => (
                <MyExpertCard
                  key={expert.id}
                  expert={expert}
                  onEdit={() => handleEdit(expert)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'profiles' && (view === 'add' || view === 'edit') && (
        <div className="bg-[var(--color-paper-3)] rounded-none p-5 sm:p-8 shadow-[var(--shadow-sheet)]">
          {/* Form header with X close button */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-widest font-['Inter']">
              {view === 'add' ? 'New Profile' : 'Editing Profile'}
            </p>
            <button
              onClick={handleCancel}
              className="p-1.5 rounded-none text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-2)]  transition-all"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <GuruProfileForm
            key={editingExpert?.id ?? 'new'}
            userId={userId}
            expertId={view === 'edit' ? editingExpert?.id : undefined}
            initialData={view === 'edit' ? editingExpert : undefined}
            onSuccess={view === 'add' ? handleAddSuccess : handleEditSuccess}
            onCancel={handleCancel}
          />
        </div>
      )}
    </div>
  );
};

/* ── Root page ─────────────────────────────────────────────────────── */

const PlacedGuruPage = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  // Move redirect into a useEffect so it never fires during
  // unrelated re-renders (e.g. closing the form with the X button)
  useEffect(() => {
    if (isLoaded && !user) {
      navigate('/?redirect=/placed-guru', { replace: true });
    }
  }, [isLoaded, user]);

  // Still resolving Clerk session OR about to redirect
  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-[var(--color-paper)] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[var(--color-rule)] border-t-[var(--color-ink)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <div className="w-full flex flex-col items-center z-50">
        <Header onStartTour={() => { }} />
      </div>
      <ManagementPanel userId={user.id} />
    </div>
  );
};

export default PlacedGuruPage;
