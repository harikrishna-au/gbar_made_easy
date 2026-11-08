import React from 'react';
import { Plus, X } from 'lucide-react';

export interface TimeWindow {
  start: string; // "HH:MM", 24h
  end: string;   // "HH:MM", 24h
}

// key is day_of_week (0=Sun … 6=Sat)
export type WeeklyAvailability = Record<number, TimeWindow[]>;

const DAYS = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 00, 05 … 55
const pad = (n: number) => String(n).padStart(2, '0');

/** "HH:MM" (24h) -> clock parts. Anything unparsable falls back to 10:00 AM. */
const parse = (value: string) => {
  const [h, m] = value.split(':').map(Number);
  const hour24 = Number.isFinite(h) ? h : 10;
  const minute = Number.isFinite(m) ? m : 0;
  return { hour12: hour24 % 12 === 0 ? 12 : hour24 % 12, minute, pm: hour24 >= 12 };
};

/** Clock parts -> "HH:MM" (24h), the format the database stores. */
const build = (hour12: number, minute: number, pm: boolean) =>
  `${pad((hour12 % 12) + (pm ? 12 : 0))}:${pad(minute)}`;

const toMinutes = (value: string) => {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
};

const selectCls =
  "h-9 bg-[var(--color-paper-3)] border-[1.5px] border-[var(--color-ink)] px-1.5 text-sm tabular-nums text-[var(--color-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] font-['Inter']";

/** Hour, minute and AM/PM as separate controls, so nothing depends on the browser's time input. */
const TimeField = ({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) => {
  const { hour12, minute, pm } = parse(value);
  // A time saved off the 5-minute grid (e.g. 10:20) still has to show up and stay selectable.
  const minutes = MINUTES.includes(minute) ? MINUTES : [...MINUTES, minute].sort((a, b) => a - b);

  return (
    <div className="flex items-center gap-1" role="group" aria-label={label}>
      <select aria-label={`${label} hour`} value={hour12} onChange={(e) => onChange(build(Number(e.target.value), minute, pm))} className={`${selectCls} w-[3.25rem]`}>
        {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
      </select>
      <span aria-hidden className="text-sm font-semibold">:</span>
      <select aria-label={`${label} minute`} value={minute} onChange={(e) => onChange(build(hour12, Number(e.target.value), pm))} className={`${selectCls} w-[3.25rem]`}>
        {minutes.map((m) => <option key={m} value={m}>{pad(m)}</option>)}
      </select>
      <div className="ml-1 flex" role="radiogroup" aria-label={`${label} AM or PM`}>
        {(['AM', 'PM'] as const).map((p) => {
          const on = (p === 'PM') === pm;
          return (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(build(hour12, minute, p === 'PM'))}
              className={`h-9 px-2.5 text-xs font-semibold transition-colors first:border-r-0 border-[1.5px] border-[var(--color-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] ${
                on ? 'bg-[var(--color-ink)] text-[var(--color-paper)]' : 'bg-[var(--color-paper-3)] text-[var(--color-ink)] hover:bg-[var(--color-paper-2)]'
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>
    </div>
  );
};

interface AvailabilitySchedulerProps {
  value: WeeklyAvailability;
  onChange: (val: WeeklyAvailability) => void;
}

/** True when every window ends after it starts and is at least one 20-minute session long. */
export const availabilityProblem = (value: WeeklyAvailability): string | null => {
  for (const [day, windows] of Object.entries(value)) {
    for (const w of windows) {
      if (toMinutes(w.end) - toMinutes(w.start) < 20) {
        const label = DAYS.find((d) => d.value === Number(day))?.label ?? 'a day';
        return `${label}: each time window must end at least 20 minutes after it starts.`;
      }
    }
  }
  return null;
};

const AvailabilityScheduler = ({ value, onChange }: AvailabilitySchedulerProps) => {
  const addWindow = (day: number) => {
    const existing = value[day] || [];
    onChange({ ...value, [day]: [...existing, { start: '10:00', end: '12:00' }] });
  };

  const updateWindow = (day: number, idx: number, field: 'start' | 'end', val: string) => {
    const windows = [...(value[day] || [])];
    windows[idx] = { ...windows[idx], [field]: val };
    onChange({ ...value, [day]: windows });
  };

  const removeWindow = (day: number, idx: number) => {
    const windows = (value[day] || []).filter((_, i) => i !== idx);
    const updated = { ...value };
    if (windows.length === 0) delete updated[day];
    else updated[day] = windows;
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-[var(--color-ink)] font-['Inter']">Weekly availability</p>

      <div className="space-y-2">
        {DAYS.map(({ label, value: dayNum }) => {
          const windows = value[dayNum] || [];
          const isActive = windows.length > 0;

          return (
            <div
              key={dayNum}
              className={`transition-colors ${isActive ? 'bg-[var(--color-paper-3)] shadow-[var(--shadow-card)]' : 'bg-[var(--color-paper-2)]'}`}
            >
              <div className="px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-baseline gap-3">
                    <span className={`w-9 flex-shrink-0 font-display text-xl uppercase leading-none ${isActive ? 'text-[var(--color-ink)]' : 'text-[var(--color-muted)]'}`}>
                      {label}
                    </span>
                    {!isActive && <span className="text-sm text-[var(--color-muted)] font-['Inter']">Unavailable</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => addWindow(dayNum)}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center bg-[var(--color-accent)] text-[var(--color-ink)] shadow-[2px_2px_0_var(--color-ink)] transition-[transform,box-shadow] hover:translate-x-px hover:translate-y-px hover:shadow-[1px_1px_0_var(--color-ink)]"
                    title={`Add time window for ${label}`}
                    aria-label={`Add time window for ${label}`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {isActive && (
                  <div className="mt-3 flex flex-col gap-3">
                  {windows.map((win, idx) => {
                      const bad = toMinutes(win.end) - toMinutes(win.start) < 20;
                      return (
                        <div key={idx}>
                          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-9 text-xs font-medium text-[var(--color-muted)] sm:hidden">From</span>
                              <TimeField value={win.start} onChange={(v) => updateWindow(dayNum, idx, 'start', v)} label={`${label} start`} />
                            </div>
                            <span className="hidden text-sm text-[var(--color-muted)] sm:inline" aria-hidden>to</span>
                            <div className="flex items-center gap-2">
                              <span className="w-9 text-xs font-medium text-[var(--color-muted)] sm:hidden">To</span>
                              <TimeField value={win.end} onChange={(v) => updateWindow(dayNum, idx, 'end', v)} label={`${label} end`} />
                              <button
                                type="button"
                                onClick={() => removeWindow(dayNum, idx)}
                                aria-label={`Remove ${label} time window`}
                                className="ml-auto flex h-9 w-9 flex-shrink-0 items-center justify-center text-[var(--color-muted)] transition-colors hover:bg-[var(--color-paper-2)] hover:text-[var(--color-error)] sm:ml-0"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          {bad && (
                            <p className="mt-1 text-xs font-medium text-[var(--color-error)]">
                              Ends too early. Leave at least 20 minutes between start and end.
                            </p>
                          )}
                        </div>
                      );
                    })}

                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-sm text-[var(--color-muted)] font-['Inter']">
        Sessions are 20 minutes. Each window is split into consecutive 20-minute slots automatically.
      </p>
    </div>
  );
};

export default AvailabilityScheduler;
