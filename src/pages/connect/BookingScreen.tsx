import React, { useState, useEffect, useCallback } from 'react';
import {
  X, ChevronLeft, BadgeCheck, ArrowRight, Check, Link2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Expert, ExpertAvatar } from './ExpertCard';
import CalendarPicker from './CalendarPicker';
import TimeSlotPicker, { TimeSlot } from './TimeSlotPicker';
import BookingForm, { BookingFormData } from './BookingForm';
import PaymentHandler from './PaymentHandler';
import BookingSuccess from './BookingSuccess';
import { SignInButton, useUser } from '@clerk/clerk-react';

type Step = 'details' | 'date' | 'time' | 'form' | 'payment' | 'success';

interface AvailabilityWindow {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

function parseTimeToMinutes(t: string): number {
  const parts = t.split(':');
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

function generateSlots(windows: AvailabilityWindow[], dayOfWeek: number): TimeSlot[] {
  const dayWindows = windows.filter((w) => w.day_of_week === dayOfWeek);
  const slots: TimeSlot[] = [];
  for (const win of dayWindows) {
    const startMins = parseTimeToMinutes(win.start_time);
    const endMins = parseTimeToMinutes(win.end_time);
    let current = startMins;
    while (current + 20 <= endMins) {
      const sh = Math.floor(current / 60).toString().padStart(2, '0');
      const sm = (current % 60).toString().padStart(2, '0');
      const eh = Math.floor((current + 20) / 60).toString().padStart(2, '0');
      const em = ((current + 20) % 60).toString().padStart(2, '0');
      slots.push({ start: `${sh}:${sm}`, end: `${eh}:${em}` });
      current += 20;
    }
  }
  return slots;
}

const STEP_ORDER: Step[] = ['details', 'date', 'time', 'form', 'payment', 'success'];

const FLOW_STEPS: Step[] = ['details', 'date', 'time', 'form', 'payment'];

const STEP_TITLE: Record<Step, string> = {
  details: 'Expert Profile',
  date: 'Pick a Date',
  time: 'Choose a Slot',
  form: 'Your Details',
  payment: 'Confirm & Pay',
  success: 'Booking Confirmed',
};

const STEP_SHORT: Record<Step, string> = {
  details: 'Expert',
  date: 'Date',
  time: 'Time',
  form: 'Details',
  payment: 'Pay',
  success: 'Done',
};


interface BookingScreenProps {
  expert: Expert;
  onClose: () => void;
}

const BookingScreen = ({ expert, onClose }: BookingScreenProps) => {
  const { user } = useUser();
  const [step, setStep] = useState<Step>('details');
  const [availabilityWindows, setAvailabilityWindows] = useState<AvailabilityWindow[]>([]);
  const [availableDays, setAvailableDays] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [formData, setFormData] = useState<BookingFormData>({ name: '', email: '', message: '' });

  useEffect(() => {
    const accountEmail = user?.primaryEmailAddress?.emailAddress;
    setFormData((current) => ({
      ...current,
      name: current.name || user?.fullName || '',
      email: accountEmail || current.email,
    }));
  }, [user]);

  const placedAgo = expert.interview_date
    ? formatDistanceToNow(parseISO(expert.interview_date), { addSuffix: true })
    : null;

  useEffect(() => {
    supabase
      .from('availability')
      .select('day_of_week, start_time, end_time')
      .eq('expert_id', expert.id)
      .then(({ data }) => {
        if (data) {
          setAvailabilityWindows(data as AvailabilityWindow[]);
          setAvailableDays([...new Set(data.map((a: any) => a.day_of_week as number))]);
        }
      });
  }, [expert.id]);

  const loadSlots = useCallback(
    async (date: Date) => {
      setSlotsLoading(true);
      const dayOfWeek = date.getDay();
      const allSlots = generateSlots(availabilityWindows, dayOfWeek);
      const dateStr = format(date, 'yyyy-MM-dd');
      const { data: bookings } = await supabase
        .rpc('get_booked_slots', { p_expert_id: expert.id, p_date: dateStr });
      const bookedIntervals = (bookings || []).map((booking) => ({
        start: parseTimeToMinutes(booking.start_time),
        end: parseTimeToMinutes(booking.end_time),
      }));
      const freeSlots = allSlots.filter((slot) => {
        const sStart = parseTimeToMinutes(slot.start);
        const sEnd = parseTimeToMinutes(slot.end);
        return !bookedIntervals.some((b) => sStart < b.end && sEnd > b.start);
      });
      setSlots(freeSlots);
      setSlotsLoading(false);
    },
    [availabilityWindows, expert.id]
  );

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    if (date) {
      setStep('time');
      loadSlots(date);
    }
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep('form');
  };

  const handleBack = () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/connect/${expert.id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copied!', { description: 'Share this profile with anyone.' });
    });
  };

  const bookCta = (padding: string) => {
    const cls = `w-full ${padding} bg-stone-900 text-white rounded-2xl text-[15px] font-semibold font-['Inter'] hover:bg-stone-700 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-900`;
    return user ? (
      <button onClick={() => setStep('date')} className={cls}>
        Choose a time
        <ArrowRight className="w-4 h-4" />
      </button>
    ) : (
      <SignInButton mode="modal">
        <button className={cls}>
          Sign in to book
          <ArrowRight className="w-4 h-4" />
        </button>
      </SignInButton>
    );
  };

  const currentIdx = STEP_ORDER.indexOf(step);
  const canGoBack = step !== 'details' && step !== 'success';

  return (
    <div className="fixed inset-0 z-[100] bg-[#fbf6ea] flex flex-col animate-slide-in-right">

      {/* ── Top navigation bar ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 bg-white/90 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-2.5">
          {canGoBack ? (
            <button
              onClick={handleBack}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors text-stone-500"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-8 h-8" />
          )}
          <span className="text-sm font-['Merriweather'] text-stone-900">{STEP_TITLE[step]}</span>
        </div>

        {step !== 'success' && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopyLink}
              title="Copy shareable link"
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors text-stone-400"
            >
              <Link2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors text-stone-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ── Step flow indicator ── */}
      {step !== 'success' && (
        <div className="flex items-center justify-center px-6 py-4 bg-white border-b border-stone-50 flex-shrink-0">
          {FLOW_STEPS.map((s, i) => {
            const sIdx = STEP_ORDER.indexOf(s);
            const isDone = sIdx < currentIdx;
            const isActive = s === step;
            const nextIdx = STEP_ORDER.indexOf(FLOW_STEPS[i + 1]);

            return (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium font-['Inter'] transition-all duration-300 ${
                      isDone
                        ? 'bg-stone-900 text-white'
                        : isActive
                        ? 'bg-stone-900 text-white ring-4 ring-stone-900/10'
                        : 'bg-stone-100 text-stone-400'
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span
                    className={`${isActive ? 'inline' : 'hidden sm:inline'} text-[11px] font-['Inter'] transition-colors duration-200 ${
                      isActive
                        ? 'text-stone-700 font-semibold'
                        : isDone
                        ? 'text-stone-500'
                        : 'text-stone-300'
                    }`}
                  >
                    {STEP_SHORT[s]}
                  </span>
                </div>

                {i < FLOW_STEPS.length - 1 && (
                  <div
                    className={`h-px w-6 sm:w-8 sm:mb-4 mx-1.5 transition-colors duration-500 ${
                      nextIdx <= currentIdx ? 'bg-stone-800' : 'bg-stone-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* ── Context strip (shows expert + selection summary after details) ── */}
      {step !== 'details' && step !== 'success' && (
        <div className="flex items-center gap-3 px-5 py-2.5 bg-stone-50/80 border-b border-stone-100 flex-shrink-0">
          {expert.photo_url ? (
            <img
              src={expert.photo_url}
              alt={expert.name}
              className="w-7 h-7 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-stone-200 flex items-center justify-center text-stone-500 text-xs font-['Merriweather'] flex-shrink-0">
              {expert.name.charAt(0)}
            </div>
          )}
          <p className="text-xs font-['Inter'] text-stone-500">
            <span className="font-medium text-stone-700">{expert.name}</span>
            {selectedDate && (
              <span> · {format(selectedDate, 'EEE, MMM d')}</span>
            )}
            {selectedSlot && (
              <span className="text-stone-400"> · {selectedSlot.start}</span>
            )}
          </p>
        </div>
      )}

      {/* ── Scrollable content area ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ════ DETAILS STEP ════ */}
        {step === 'details' && (
          <div className="max-w-5xl mx-auto w-full px-5 sm:px-8 pt-8 sm:pt-12 pb-32 lg:pb-16 grid lg:grid-cols-[1fr_340px] gap-10 lg:gap-14 items-start">

            {/* Profile */}
            <div className="min-w-0">
              <div className="flex items-start gap-5">
                <ExpertAvatar expert={expert} size="lg" />
                <div className="min-w-0 pt-1">
                  <h2 className="text-3xl sm:text-4xl font-['Merriweather'] text-stone-900 leading-tight tracking-tight">
                    {expert.name}
                  </h2>
                  {expert.title && (
                    <p className="text-[15px] text-stone-500 mt-2 font-['Inter'] leading-relaxed">
                      {expert.title}
                    </p>
                  )}
                </div>
              </div>

              {/* Placement facts */}
              {(expert.company || expert.package_lpa || placedAgo) && (
                <dl className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-px rounded-2xl overflow-hidden border border-stone-200 bg-stone-200">
                  {expert.company && (
                    <div className="bg-white px-4 py-3.5">
                      <dt className="text-[10.5px] uppercase tracking-[0.12em] font-semibold text-[#43695a] font-['Inter']">Placed at</dt>
                      <dd className="font-['Merriweather'] text-lg text-stone-900 mt-1 leading-tight">{expert.company}</dd>
                    </div>
                  )}
                  {expert.package_lpa && (
                    <div className="bg-white px-4 py-3.5">
                      <dt className="text-[10.5px] uppercase tracking-[0.12em] font-semibold text-stone-400 font-['Inter']">Package</dt>
                      <dd className="font-['Merriweather'] text-lg text-stone-900 mt-1 leading-tight tabular-nums">₹{expert.package_lpa} LPA</dd>
                    </div>
                  )}
                  {placedAgo && (
                    <div className="bg-white px-4 py-3.5 col-span-2 sm:col-span-1">
                      <dt className="text-[10.5px] uppercase tracking-[0.12em] font-semibold text-stone-400 font-['Inter']">Interviewed</dt>
                      <dd className="font-['Merriweather'] text-lg text-stone-900 mt-1 leading-tight">{placedAgo}</dd>
                    </div>
                  )}
                </dl>
              )}

              {expert.proof_url && (
                <p className="mt-4 inline-flex items-center gap-2 text-sm text-[#43695a] font-medium font-['Inter']">
                  <BadgeCheck className="w-4 h-4" />
                  Placement proof is on file with the Connect team
                </p>
              )}

              {expert.bio && (
                <div className="mt-10">
                  <h3 className="text-[11px] uppercase tracking-[0.14em] text-stone-400 font-semibold font-['Inter'] mb-3">
                    About {expert.name.split(' ')[0]}
                  </h3>
                  <p className="text-stone-700 text-base leading-[1.75] font-['Inter'] whitespace-pre-line">
                    {expert.bio}
                  </p>
                </div>
              )}

              {expert.skills && expert.skills.length > 0 && (
                <div className="mt-10">
                  <h3 className="text-[11px] uppercase tracking-[0.14em] text-stone-400 font-semibold font-['Inter'] mb-3">
                    You can ask about
                  </h3>
                  <ul className="flex flex-wrap gap-2">
                    {expert.skills.map((skill) => (
                      <li
                        key={skill}
                        className="px-3.5 py-1.5 bg-white text-stone-700 rounded-full text-sm font-medium border border-stone-200 font-['Inter']"
                      >
                        {skill}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Booking panel (desktop: sticky card, mobile: bottom bar below) */}
            <aside className="hidden lg:block lg:sticky lg:top-6">
              <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_24px_48px_-32px_rgba(28,25,23,0.35)]">
                <div className="flex items-baseline justify-between">
                  <p className="font-['Merriweather'] text-4xl text-stone-900 tabular-nums">₹{expert.price_inr}</p>
                  <p className="text-sm text-stone-500 font-['Inter']">20-minute call</p>
                </div>
                <p className="text-xs text-stone-400 font-['Inter'] mt-1.5">
                  A 10% platform fee is added at checkout.
                </p>

                <ol className="mt-6 space-y-4 border-t border-stone-100 pt-6">
                  {[
                    ['Pick a date and time', 'From the slots this senior has open.'],
                    ['Pay securely', 'Your request is saved once payment clears.'],
                    ['Get one meeting link', 'Our team confirms and emails you both.'],
                  ].map(([t, d], i) => (
                    <li key={t} className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-700 text-xs font-semibold font-['Inter'] flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-stone-800 font-['Inter']">{t}</span>
                        <span className="block text-[13px] text-stone-500 font-['Inter'] leading-snug mt-0.5">{d}</span>
                      </span>
                    </li>
                  ))}
                </ol>

                <div className="mt-6">{bookCta('py-4')}</div>
              </div>
            </aside>

            {/* Mobile sticky bar */}
            <div className="lg:hidden fixed bottom-0 inset-x-0 z-10 bg-white/95 backdrop-blur border-t border-stone-200 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center gap-4">
              <div className="flex-shrink-0">
                <p className="font-['Merriweather'] text-2xl text-stone-900 leading-none tabular-nums">₹{expert.price_inr}</p>
                <p className="text-[11px] text-stone-500 font-['Inter'] mt-1">20 min · +10% fee</p>
              </div>
              <div className="flex-1">{bookCta('py-3.5')}</div>
            </div>
          </div>
        )}

        {/* ════ DATE STEP ════ */}
        {step === 'date' && (
          <div className="max-w-lg mx-auto px-5 py-8">
            <h3 className="font-['Merriweather'] text-2xl text-stone-900 text-center">When works for you?</h3>
            <p className="text-sm text-stone-500 font-['Inter'] text-center mt-2 mb-6">
              Days {expert.name.split(' ')[0]} is free are selectable. The rest are greyed out.
            </p>
            {availableDays.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-stone-400 text-sm font-['Inter']">
                  This expert hasn't set their availability yet.
                </p>
              </div>
            ) : (
              <div className="rounded-3xl border border-stone-200 bg-white p-3 sm:p-5">
                <CalendarPicker
                  availableDays={availableDays}
                  selectedDate={selectedDate}
                  onSelect={handleDateSelect}
                />
              </div>
            )}
          </div>
        )}

        {/* ════ TIME STEP ════ */}
        {step === 'time' && (
          <div className="max-w-lg mx-auto px-5 py-8">
            <h3 className="font-['Merriweather'] text-2xl text-stone-900">
              {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Choose a slot'}
            </h3>
            <p className="text-sm text-stone-500 font-['Inter'] mt-2 mb-6">Pick the start time for your 20-minute call.</p>
            <TimeSlotPicker
              slots={slots}
              selectedSlot={selectedSlot}
              onSelect={handleSlotSelect}
              loading={slotsLoading}
            />
          </div>
        )}

        {/* ════ FORM STEP ════ */}
        {step === 'form' && (
          <div className="max-w-lg mx-auto px-5 py-8 space-y-6">
            <div>
              <h3 className="font-['Merriweather'] text-2xl text-stone-900">Tell {expert.name.split(' ')[0]} what you need</h3>
              <p className="text-sm text-stone-500 font-['Inter'] mt-2">
                The more specific you are, the more useful the 20 minutes will be.
              </p>
            </div>
            <BookingForm data={formData} onChange={setFormData} emailLocked={Boolean(user?.primaryEmailAddress?.emailAddress)} />
            <button
              onClick={() => setStep('payment')}
              disabled={!formData.name.trim() || !formData.email.trim() || !formData.message.trim()}
              className="w-full py-3.5 bg-stone-900 text-white rounded-xl text-sm font-semibold font-['Inter'] hover:bg-stone-700 active:scale-95 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue to Payment
            </button>
          </div>
        )}

        {/* ════ PAYMENT STEP ════ */}
        {step === 'payment' && selectedDate && selectedSlot && (
          <div className="max-w-lg mx-auto px-5 py-6">
            <PaymentHandler
              expert={expert}
              date={selectedDate}
              slot={selectedSlot}
              formData={formData}
              onSuccess={() => setStep('success')}
              onError={() => {}}
            />
          </div>
        )}

        {/* ════ SUCCESS STEP ════ */}
        {step === 'success' && selectedDate && selectedSlot && (
          <div className="max-w-lg mx-auto px-5 py-6">
            <BookingSuccess
              expertName={expert.name}
              date={selectedDate}
              startTime={selectedSlot.start}
              endTime={selectedSlot.end}
              userEmail={formData.email}
              meetLink={null}
              onClose={onClose}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingScreen;
