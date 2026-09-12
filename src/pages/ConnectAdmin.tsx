import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Clipboard,
  Clock3,
  ExternalLink,
  Inbox,
  Link2,
  Loader2,
  LockKeyhole,
  LogOut,
  Mail,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type Priority = "low" | "normal" | "high" | "urgent";
type Filter = "action" | "upcoming" | "completed" | "all";

interface ExpertSummary {
  id: string;
  name: string;
  email: string | null;
  title: string | null;
  company: string | null;
  photo_url: string | null;
  price_inr: number;
}

interface AdminBooking {
  id: string;
  expert_id: string | null;
  user_name: string | null;
  user_email: string | null;
  message: string | null;
  date: string;
  start_time: string;
  end_time: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  meet_link: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
  admin_notes: string | null;
  priority: Priority;
  confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  meet_link_sent_at: string | null;
  experts: ExpertSummary | null;
}

interface BookingEvent {
  id: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

const SESSION_KEY = "connect_admin_secret";
const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/connect-admin`;

const statusStyle: Record<string, string> = {
  paid: "bg-amber-50 text-amber-800 border-amber-200",
  confirmed: "bg-emerald-50 text-emerald-800 border-emerald-200",
  completed: "bg-stone-900 text-white border-stone-900",
  cancelled: "bg-stone-100 text-stone-500 border-stone-200",
  declined: "bg-red-50 text-red-700 border-red-200",
  refunded: "bg-blue-50 text-blue-700 border-blue-200",
  no_show: "bg-orange-50 text-orange-700 border-orange-200",
};

function isUpcoming(booking: AdminBooking) {
  return new Date(`${booking.date}T${booking.end_time}`) >= new Date();
}

function isActionNeeded(booking: AdminBooking) {
  return booking.status === "paid" || (booking.status === "confirmed" && !booking.meet_link_sent_at);
}

export default function ConnectAdmin() {
  const navigate = useNavigate();
  const [secret, setSecret] = useState(() => sessionStorage.getItem(SESSION_KEY) ?? "");
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("action");
  const [query, setQuery] = useState("");
  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [loading, setLoading] = useState(Boolean(secret));
  const [saving, setSaving] = useState(false);
  const [loginError, setLoginError] = useState("");

  const request = async (body: Record<string, unknown>, key = secret) => {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        "x-admin-key": key,
      },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Connect admin request failed");
    return data;
  };

  const loadBookings = async (key = secret, quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const data = await request({ action: "list" }, key);
      setBookings(data.bookings ?? []);
      setAuthenticated(true);
      setLoginError("");
    } catch (error) {
      setAuthenticated(false);
      sessionStorage.removeItem(SESSION_KEY);
      setSecret("");
      if (error instanceof Error && error.message !== "Unauthorized") toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (secret) loadBookings(secret);
    // The saved secret is intentionally checked once when this admin app mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId || !authenticated) {
      setEvents([]);
      return;
    }
    request({ action: "events", booking_id: selectedId })
      .then((data) => setEvents(data.events ?? []))
      .catch(() => setEvents([]));
    // request is intentionally scoped to the active admin session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, authenticated]);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    try {
      const key = password.trim();
      const data = await request({ action: "list" }, key);
      sessionStorage.setItem(SESSION_KEY, key);
      setSecret(key);
      setBookings(data.bookings ?? []);
      setAuthenticated(true);
      setPassword("");
      setLoginError("");
    } catch {
      setLoginError("Incorrect Connect admin password.");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setSecret("");
    setAuthenticated(false);
    setBookings([]);
  };

  const selected = bookings.find((booking) => booking.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return bookings
      .filter((booking) => {
        if (filter === "action") return isActionNeeded(booking);
        if (filter === "upcoming") {
          return isUpcoming(booking) && ["paid", "confirmed"].includes(booking.status);
        }
        if (filter === "completed") {
          return ["completed", "cancelled", "declined", "refunded", "no_show"].includes(booking.status);
        }
        return true;
      })
      .filter((booking) => {
        if (!normalized) return true;
        return [
          booking.user_name,
          booking.user_email,
          booking.experts?.name,
          booking.experts?.email,
          booking.experts?.company,
          booking.razorpay_order_id,
        ].some((value) => value?.toLowerCase().includes(normalized));
      })
      .sort((a, b) => {
        if (isActionNeeded(a) !== isActionNeeded(b)) return isActionNeeded(a) ? -1 : 1;
        if (a.priority !== b.priority) {
          const rank = { urgent: 0, high: 1, normal: 2, low: 3 };
          return rank[a.priority] - rank[b.priority];
        }
        return new Date(`${a.date}T${a.start_time}`).getTime() -
          new Date(`${b.date}T${b.start_time}`).getTime();
      });
  }, [bookings, filter, query]);

  const metrics = useMemo(() => ({
    action: bookings.filter(isActionNeeded).length,
    today: bookings.filter((booking) =>
      booking.date === format(new Date(), "yyyy-MM-dd") &&
      ["paid", "confirmed"].includes(booking.status)).length,
    upcoming: bookings.filter((booking) =>
      isUpcoming(booking) && ["paid", "confirmed"].includes(booking.status)).length,
    completed: bookings.filter((booking) => booking.status === "completed").length,
  }), [bookings]);

  const replaceBooking = (booking: AdminBooking) => {
    setBookings((current) => current.map((item) => item.id === booking.id ? booking : item));
  };

  const updateBooking = async (patch: Partial<AdminBooking>, successMessage = "Booking updated") => {
    if (!selected) return;
    setSaving(true);
    try {
      const data = await request({ action: "update", booking_id: selected.id, ...patch });
      replaceBooking(data.booking);
      const eventData = await request({ action: "events", booking_id: selected.id });
      setEvents(eventData.events ?? []);
      toast.success(successMessage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const notifyBoth = async () => {
    if (!selected?.meet_link) {
      toast.error("Add and save a meeting link first.");
      return;
    }
    setSaving(true);
    try {
      const data = await request({ action: "notify", booking_id: selected.id });
      replaceBooking(data.booking);
      const eventData = await request({ action: "events", booking_id: selected.id });
      setEvents(eventData.events ?? []);
      toast.success("Meeting details sent to both sides");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Notification failed");
    } finally {
      setSaving(false);
    }
  };

  const updateExpertEmail = async (email: string) => {
    if (!selected?.experts) return;
    setSaving(true);
    try {
      const data = await request({
        action: "update_expert_contact",
        expert_id: selected.experts.id,
        email,
      });
      setBookings((current) => current.map((booking) =>
        booking.experts?.id === data.expert.id
          ? { ...booking, experts: { ...booking.experts, ...data.expert } }
          : booking
      ));
      toast.success("Expert email updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Expert update failed");
    } finally {
      setSaving(false);
    }
  };

  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center p-5">
        <form onSubmit={login} className="w-full max-w-sm bg-white border border-stone-200 rounded-3xl p-7 shadow-xl shadow-stone-900/5">
          <div className="w-12 h-12 rounded-2xl bg-stone-900 text-white flex items-center justify-center mb-6">
            <LockKeyhole className="w-5 h-5" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-semibold">Connect Operations</p>
          <h1 className="font-['Merriweather'] text-2xl text-stone-900 mt-2">Super-admin access</h1>
          <p className="text-sm text-stone-500 mt-2 mb-6">Control bookings, meeting links, and communication from one place.</p>
          <label className="text-xs font-semibold text-stone-600">Admin password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setLoginError("");
            }}
            autoFocus
            className="mt-2 w-full h-11 px-3.5 rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-900/15"
          />
          {loginError && <p className="mt-2 text-xs text-red-600">{loginError}</p>}
          <button
            disabled={loading || !password.trim()}
            className="mt-4 w-full h-11 rounded-xl bg-stone-900 text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Open command center
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-stone-900">
      <header className="sticky top-0 z-30 bg-[#f7f7f5]/90 backdrop-blur-xl border-b border-stone-200">
        <div className="max-w-[1500px] mx-auto h-16 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/admin")} className="w-9 h-9 rounded-xl hover:bg-stone-200 flex items-center justify-center" aria-label="Back to admin">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-['Merriweather'] text-lg">Connect Command Center</h1>
                <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 bg-stone-900 text-white rounded-full">V1</span>
              </div>
              <p className="text-[11px] text-stone-400">Manual operations · one source of truth</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => loadBookings(secret, true)} className="h-9 px-3 rounded-xl border border-stone-200 bg-white text-xs font-medium flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button onClick={logout} className="w-9 h-9 rounded-xl border border-stone-200 bg-white flex items-center justify-center" aria-label="Log out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1500px] mx-auto p-4 sm:p-6">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Needs action", value: metrics.action, icon: Inbox },
            { label: "Today", value: metrics.today, icon: Clock3 },
            { label: "Upcoming", value: metrics.upcoming, icon: CalendarDays },
            { label: "Completed", value: metrics.completed, icon: CheckCircle2 },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white border border-stone-200 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-stone-400">{label}</p>
                <p className="text-2xl font-semibold mt-1">{value}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
                <Icon className="w-4 h-4 text-stone-600" />
              </div>
            </div>
          ))}
        </section>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_440px] gap-5 items-start">
          <section className="bg-white border border-stone-200 rounded-2xl overflow-hidden min-h-[650px]">
            <div className="p-4 border-b border-stone-100 space-y-3">
              <div className="flex flex-wrap gap-2">
                {([
                  ["action", `Needs action · ${metrics.action}`],
                  ["upcoming", "Upcoming"],
                  ["completed", "Closed"],
                  ["all", "All bookings"],
                ] as [Filter, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`h-8 px-3 rounded-lg text-xs font-semibold ${filter === key ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-500"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search student, expert, company, payment ID…"
                  className="w-full h-10 pl-10 pr-3 rounded-xl bg-stone-50 border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                />
              </div>
            </div>

            {loading ? (
              <div className="h-96 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-stone-400" /></div>
            ) : filtered.length === 0 ? (
              <div className="h-96 flex flex-col items-center justify-center text-center p-6">
                <CheckCircle2 className="w-9 h-9 text-stone-300 mb-3" />
                <p className="font-semibold">Queue is clear</p>
                <p className="text-sm text-stone-400 mt-1">No bookings match this view.</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {filtered.map((booking) => (
                  <button
                    key={booking.id}
                    onClick={() => setSelectedId(booking.id)}
                    className={`w-full p-4 text-left hover:bg-stone-50 transition-colors ${selectedId === booking.id ? "bg-stone-50" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
                        <UserRound className="w-4 h-4 text-stone-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="font-semibold text-sm truncate">{booking.user_name || "Unnamed student"}</p>
                            {booking.priority !== "normal" && (
                              <span className="text-[9px] uppercase font-bold text-red-600">{booking.priority}</span>
                            )}
                          </div>
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold capitalize ${statusStyle[booking.status] ?? statusStyle.cancelled}`}>
                            {booking.status === "paid" ? "Needs review" : booking.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-1 truncate">
                          with {booking.experts?.name ?? "Unknown expert"} · {booking.experts?.company ?? "No company"}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-stone-400">
                          <span>{format(parseISO(booking.date), "EEE, MMM d")}</span>
                          <span>{booking.start_time.slice(0, 5)}–{booking.end_time.slice(0, 5)}</span>
                          {booking.meet_link_sent_at && <span className="text-emerald-600 flex items-center gap-1"><Check className="w-3 h-3" /> Link sent</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <aside className="lg:sticky lg:top-20">
            {selected ? (
              <BookingWorkspace
                key={selected.id}
                booking={selected}
                events={events}
                saving={saving}
                onClose={() => setSelectedId(null)}
                onUpdate={updateBooking}
                onNotify={notifyBoth}
                onUpdateExpertEmail={updateExpertEmail}
                onCopy={copy}
              />
            ) : (
              <div className="bg-white border border-stone-200 rounded-2xl h-64 flex flex-col items-center justify-center text-center p-6">
                <Users className="w-8 h-8 text-stone-300 mb-3" />
                <p className="font-semibold text-sm">Select a booking</p>
                <p className="text-xs text-stone-400 mt-1">Open a booking to operate the session.</p>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

function BookingWorkspace({
  booking,
  events,
  saving,
  onClose,
  onUpdate,
  onNotify,
  onUpdateExpertEmail,
  onCopy,
}: {
  booking: AdminBooking;
  events: BookingEvent[];
  saving: boolean;
  onClose: () => void;
  onUpdate: (patch: Partial<AdminBooking>, successMessage?: string) => Promise<void>;
  onNotify: () => Promise<void>;
  onUpdateExpertEmail: (email: string) => Promise<void>;
  onCopy: (value: string, label: string) => Promise<void>;
}) {
  const [meetLink, setMeetLink] = useState(booking.meet_link ?? "");
  const [notes, setNotes] = useState(booking.admin_notes ?? "");
  const [date, setDate] = useState(booking.date);
  const [startTime, setStartTime] = useState(booking.start_time.slice(0, 5));
  const [endTime, setEndTime] = useState(booking.end_time.slice(0, 5));
  const [expertEmail, setExpertEmail] = useState(booking.experts?.email ?? "");

  return (
    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-stone-100 flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-stone-400">Booking workspace</p>
          <h2 className="font-['Merriweather'] text-lg mt-1">{booking.user_name}</h2>
          <p className="text-xs text-stone-400 mt-0.5">Created {format(parseISO(booking.created_at), "MMM d, h:mm a")}</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center" aria-label="Close booking">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 max-h-[calc(100vh-130px)] overflow-y-auto space-y-5">
        {isActionNeeded(booking) && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-900">Operator action required</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                {booking.status === "paid" ? "Payment is captured. Review and arrange the call." : "Meeting details have not been sent yet."}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <ContactCard
            label="Student"
            name={booking.user_name ?? "Unknown"}
            email={booking.user_email}
            onCopy={onCopy}
          />
          <ContactCard
            label="Expert"
            name={booking.experts?.name ?? "Unknown"}
            email={booking.experts?.email ?? null}
            onCopy={onCopy}
          />
        </div>

        {!booking.experts?.email && (
          <div>
            <Label>Expert email required</Label>
            <div className="flex gap-2 mt-1.5">
              <input
                type="email"
                value={expertEmail}
                onChange={(event) => setExpertEmail(event.target.value)}
                placeholder="expert@email.com"
                className="flex-1 min-w-0 h-10 px-3 rounded-xl border border-red-200 bg-red-50/40 text-xs focus:outline-none focus:ring-2 focus:ring-red-900/10"
              />
              <button
                disabled={saving || !expertEmail.trim()}
                onClick={() => onUpdateExpertEmail(expertEmail)}
                className="h-10 px-3 rounded-xl bg-stone-900 text-white text-xs font-semibold disabled:opacity-40"
              >
                Save
              </button>
            </div>
            <p className="text-[10px] text-red-600 mt-1.5">Required before details can be sent to both sides.</p>
          </div>
        )}

        {booking.message && (
          <div>
            <Label>Student goal</Label>
            <p className="mt-1.5 bg-stone-50 border border-stone-100 rounded-xl p-3 text-xs text-stone-600 leading-relaxed">{booking.message}</p>
          </div>
        )}

        <div>
          <Label>Operations status</Label>
          <div className="grid grid-cols-2 gap-2 mt-1.5">
            <select
              value={booking.status}
              disabled={saving}
              onChange={(event) => onUpdate({ status: event.target.value }, "Status updated")}
              className="h-10 px-3 rounded-xl border border-stone-200 bg-white text-xs font-semibold capitalize"
            >
              {["paid", "confirmed", "completed", "cancelled", "declined", "refunded", "no_show"].map((status) => (
                <option key={status} value={status}>{status === "paid" ? "Needs review" : status.replace("_", " ")}</option>
              ))}
            </select>
            <select
              value={booking.priority}
              disabled={saving}
              onChange={(event) => onUpdate({ priority: event.target.value as Priority }, "Priority updated")}
              className="h-10 px-3 rounded-xl border border-stone-200 bg-white text-xs font-semibold capitalize"
            >
              {["low", "normal", "high", "urgent"].map((priority) => <option key={priority}>{priority}</option>)}
            </select>
          </div>
        </div>

        <div>
          <Label>Schedule (IST)</Label>
          <div className="grid grid-cols-[1fr_88px_88px] gap-2 mt-1.5">
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-10 px-2 rounded-xl border border-stone-200 text-xs" />
            <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="h-10 px-2 rounded-xl border border-stone-200 text-xs" />
            <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="h-10 px-2 rounded-xl border border-stone-200 text-xs" />
          </div>
          <button
            disabled={saving}
            onClick={() => onUpdate({ date, start_time: `${startTime}:00`, end_time: `${endTime}:00` }, "Schedule updated")}
            className="mt-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
          >
            Save schedule
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label>Meeting link</Label>
            {booking.meet_link && (
              <a href={booking.meet_link} target="_blank" rel="noopener noreferrer" className="text-[11px] font-semibold flex items-center gap-1 text-stone-500">
                Open <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <div className="flex gap-2 mt-1.5">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
              <input
                value={meetLink}
                onChange={(event) => setMeetLink(event.target.value)}
                placeholder="https://meet.google.com/..."
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-stone-200 bg-stone-50 text-xs focus:outline-none focus:ring-2 focus:ring-stone-900/10"
              />
            </div>
            <button
              disabled={saving || meetLink === (booking.meet_link ?? "")}
              onClick={() => onUpdate({ meet_link: meetLink }, "Meeting link saved")}
              className="h-10 px-3 rounded-xl bg-stone-900 text-white text-xs font-semibold disabled:opacity-40"
            >
              Save
            </button>
          </div>
          {booking.meet_link_sent_at && (
            <p className="text-[11px] text-emerald-700 mt-2 flex items-center gap-1">
              <Check className="w-3 h-3" /> Last sent {format(parseISO(booking.meet_link_sent_at), "MMM d, h:mm a")}
            </p>
          )}
        </div>

        <div>
          <Label>Private operator notes</Label>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Context, follow-up, refund note… only admins can see this."
            className="mt-1.5 w-full p-3 rounded-xl border border-stone-200 bg-stone-50 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-stone-900/10"
          />
          <button
            disabled={saving || notes === (booking.admin_notes ?? "")}
            onClick={() => onUpdate({ admin_notes: notes }, "Private notes saved")}
            className="mt-1 text-xs font-semibold text-stone-600 disabled:opacity-40"
          >
            Save notes
          </button>
        </div>

        <button
          onClick={onNotify}
          disabled={saving || !booking.meet_link}
          className="w-full h-12 rounded-xl bg-stone-900 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {booking.meet_link_sent_at ? "Resend details to both sides" : "Confirm & send to both sides"}
        </button>

        <div className="border-t border-stone-100 pt-4 grid grid-cols-2 gap-2">
          {booking.razorpay_order_id && (
            <button onClick={() => onCopy(booking.razorpay_order_id!, "Order ID")} className="h-9 rounded-xl bg-stone-50 border border-stone-100 text-[11px] text-stone-500 flex items-center justify-center gap-1.5">
              <Clipboard className="w-3 h-3" /> Copy order ID
            </button>
          )}
          <div className="h-9 rounded-xl bg-stone-50 border border-stone-100 text-[11px] text-stone-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3 h-3" /> Payment verified
          </div>
        </div>

        <div className="border-t border-stone-100 pt-4">
          <Label>Activity</Label>
          <div className="mt-2 space-y-2">
            {events.length === 0 ? (
              <p className="text-[11px] text-stone-400">No operator activity recorded yet.</p>
            ) : events.slice(0, 6).map((event) => (
              <div key={event.id} className="flex gap-2.5">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-stone-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-stone-600">
                    {event.event_type === "meeting_details_sent" ? "Meeting details sent to both sides" : "Booking updated"}
                  </p>
                  <p className="text-[10px] text-stone-400">
                    {format(parseISO(event.created_at), "MMM d, h:mm a")}
                    {event.from_status !== event.to_status && event.to_status
                      ? ` · ${event.from_status ?? "new"} → ${event.to_status}`
                      : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">{children}</p>;
}

function ContactCard({
  label,
  name,
  email,
  onCopy,
}: {
  label: string;
  name: string;
  email: string | null;
  onCopy: (value: string, label: string) => Promise<void>;
}) {
  return (
    <div className="rounded-xl border border-stone-200 p-3 min-w-0">
      <p className="text-[9px] uppercase tracking-wider text-stone-400">{label}</p>
      <p className="text-xs font-semibold mt-1 truncate">{name}</p>
      {email ? (
        <button onClick={() => onCopy(email, `${label} email`)} className="mt-1 text-[10px] text-stone-500 flex items-center gap-1 max-w-full">
          <Mail className="w-3 h-3 flex-shrink-0" /><span className="truncate">{email}</span>
        </button>
      ) : (
        <p className="mt-1 text-[10px] text-red-500">Email missing</p>
      )}
    </div>
  );
}
