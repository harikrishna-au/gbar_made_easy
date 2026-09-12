import React from 'react';

export interface BookingFormData {
  name: string;
  email: string;
  message: string;
}

interface BookingFormProps {
  data: BookingFormData;
  onChange: (data: BookingFormData) => void;
  emailLocked?: boolean;
}

const BookingForm = ({ data, onChange, emailLocked = false }: BookingFormProps) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5 font-['Inter']">
          Your Name <span className="text-stone-400">*</span>
        </label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
          placeholder="Full name"
          className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent transition-all font-['Inter']"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5 font-['Inter']">
          Email <span className="text-stone-400">*</span>
        </label>
        <input
          type="email"
          value={data.email}
          onChange={(e) => onChange({ ...data, email: e.target.value })}
          readOnly={emailLocked}
          placeholder="you@example.com"
          className={`w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent transition-all font-['Inter'] ${emailLocked ? 'bg-stone-100 cursor-not-allowed' : 'bg-stone-50'}`}
        />
        <p className="text-xs text-stone-400 mt-1 font-['Inter']">
          {emailLocked ? 'Protected by your signed-in account. Meeting details will be sent here.' : 'Booking confirmation will be sent here.'}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5 font-['Inter']">
          What would you like to discuss? <span className="text-stone-400">*</span>
        </label>
        <textarea
          value={data.message}
          onChange={(e) => onChange({ ...data, message: e.target.value })}
          placeholder="e.g. I have an Accenture interview next week and want tips on the technical rounds..."
          rows={3}
          className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm placeholder:text-stone-400 resize-none focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent transition-all font-['Inter']"
        />
      </div>
    </div>
  );
};

export default BookingForm;
