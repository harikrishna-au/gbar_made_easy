import React from 'react';
import { CheckCircle2, Calendar, Clock, Mail, Video } from 'lucide-react';
import { format } from 'date-fns';

interface BookingSuccessProps {
  expertName: string;
  date: Date;
  startTime: string;
  endTime: string;
  userEmail: string;
  meetLink: string | null;
  onClose: () => void;
}

const BookingSuccess = ({ expertName, date, startTime, endTime, userEmail, meetLink, onClose }: BookingSuccessProps) => {
  return (
    <div className="flex flex-col items-center text-center py-4 space-y-6">
      {/* Icon */}
      <div className="relative mt-2">
        <div className="relative w-20 h-20 bg-stone-100 border border-stone-200 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-stone-700" />
        </div>
      </div>

      {/* Title */}
      <div>
        <h3 className="text-2xl font-['Merriweather'] text-stone-900 mb-2">Request received.</h3>
        <p className="text-stone-500 text-sm leading-relaxed font-['Inter']">
          Your payment is verified. Our Connect team will coordinate with{' '}
          <span className="font-semibold text-stone-700">{expertName}</span>, confirm the session,
          and email the meeting link to both of you.
        </p>
      </div>

      {/* Details card */}
      <div className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 space-y-3 text-left">
        <div className="flex items-center gap-3 text-sm font-['Inter']">
          <div className="w-7 h-7 bg-white rounded-lg border border-stone-200 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-3.5 h-3.5 text-stone-500" />
          </div>
          <span className="text-stone-700 font-medium">{format(date, 'EEEE, MMMM d, yyyy')}</span>
        </div>
        <div className="flex items-center gap-3 text-sm font-['Inter']">
          <div className="w-7 h-7 bg-white rounded-lg border border-stone-200 flex items-center justify-center flex-shrink-0">
            <Clock className="w-3.5 h-3.5 text-stone-500" />
          </div>
          <span className="text-stone-700">
            {startTime} – {endTime}{' '}
            <span className="text-stone-400">(20 min)</span>
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm font-['Inter']">
          <div className="w-7 h-7 bg-white rounded-lg border border-stone-200 flex items-center justify-center flex-shrink-0">
            <Mail className="w-3.5 h-3.5 text-stone-500" />
          </div>
          <span className="text-stone-500">
            Meeting details will be sent to{' '}
            <span className="text-stone-700 font-medium">{userEmail}</span>
          </span>
        </div>
      </div>

      {/* What happens next */}
      <ol className="w-full text-left space-y-3 border-t border-stone-100 pt-5">
        {[
          ['Payment received', 'Your request is saved.'],
          ['Team confirms with ' + expertName, 'We email you if anything changes.'],
          ['One meeting link', 'Sent to your email and shown in My Bookings.'],
        ].map(([t, d], i) => (
          <li key={t} className="flex gap-3">
            <span className={`w-6 h-6 rounded-full text-xs font-semibold font-['Inter'] flex items-center justify-center flex-shrink-0 mt-0.5 ${i === 0 ? 'bg-[#557d6b] text-white' : 'bg-stone-100 text-stone-600'}`}>
              {i === 0 ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
            </span>
            <span>
              <span className="block text-sm font-semibold text-stone-800 font-['Inter']">{t}</span>
              <span className="block text-[13px] text-stone-500 font-['Inter'] leading-snug">{d}</span>
            </span>
          </li>
        ))}
      </ol>

      {/* Google Meet link */}
      {meetLink ? (
        <div className="w-full">
          <a
            href={meetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-stone-900 hover:bg-stone-700 active:scale-95 text-white rounded-xl text-sm font-medium font-['Inter'] transition-all duration-200"
          >
            <Video className="w-4 h-4" />
            Join Google Meet
          </a>
          <p className="text-stone-400 text-xs mt-2 font-['Inter'] break-all">{meetLink}</p>
        </div>
      ) : (
        <p className="text-stone-400 text-xs max-w-xs leading-relaxed font-['Inter']">
          Track the request in "My Bookings." The meeting link will appear there after our team confirms it.
        </p>
      )}

      <button
        onClick={onClose}
        className="w-full py-3 bg-stone-900 text-white rounded-xl text-sm font-medium font-['Inter'] hover:bg-stone-700 active:scale-95 transition-all duration-200"
      >
        Done
      </button>
    </div>
  );
};

export default BookingSuccess;
