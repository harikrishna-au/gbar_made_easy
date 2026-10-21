import React from 'react';
import { Clock } from 'lucide-react';

export interface TimeSlot {
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
}

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelect: (slot: TimeSlot) => void;
  loading?: boolean;
}

const GROUPS = [
  { label: 'Morning', from: 0, to: 12 * 60 },
  { label: 'Afternoon', from: 12 * 60, to: 17 * 60 },
  { label: 'Evening', from: 17 * 60, to: 24 * 60 },
];

const toMinutes = (t: string) => {
  const [h, m] = t.split(':');
  return parseInt(h, 10) * 60 + parseInt(m, 10);
};

// 24h "HH:MM" -> "3:40 PM"
const to12h = (t: string) => {
  const mins = toMinutes(t);
  const h = Math.floor(mins / 60);
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h % 12 === 0 ? 12 : h % 12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
};

const TimeSlotPicker = ({ slots, selectedSlot, onSelect, loading }: TimeSlotPickerProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2" aria-busy>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-stone-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Clock className="w-5 h-5 text-stone-400" />
        </div>
        <p className="text-stone-700 text-sm font-medium font-['Inter']">No open slots on this day</p>
        <p className="text-stone-500 text-xs mt-1 font-['Inter']">Every slot is taken. Go back and pick another date.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-stone-500 font-['Inter']">
        {slots.length} open {slots.length === 1 ? 'slot' : 'slots'} · each is 20 minutes
      </p>
      {GROUPS.map((group) => {
        const inGroup = slots.filter((s) => {
          const m = toMinutes(s.start);
          return m >= group.from && m < group.to;
        });
        if (inGroup.length === 0) return null;
        return (
          <div key={group.label}>
            <h4 className="text-[11px] uppercase tracking-[0.14em] text-stone-400 font-semibold font-['Inter'] mb-2.5">
              {group.label}
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {inGroup.map((slot) => {
                const isSelected = selectedSlot?.start === slot.start;
                return (
                  <button
                    key={slot.start}
                    onClick={() => onSelect(slot)}
                    aria-pressed={isSelected}
                    className={`py-3 rounded-xl text-sm font-medium border transition-all duration-150 font-['Inter'] tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-900 active:scale-[0.97] ${
                      isSelected
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-white text-stone-800 border-stone-200 hover:border-stone-900'
                    }`}
                  >
                    {to12h(slot.start)}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TimeSlotPicker;
