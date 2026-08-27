import React from 'react';
import { formatDateDisplay } from '../../utils/dateUtils';

export function BookingSummary({ booking, onViewMenu }) {
  if (!booking) return null;

  return (
    <div className="bg-slate-50 border border-pms-border rounded-lg p-4 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
      <div>
        <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
          Customer
        </span>
        <span className="font-semibold text-pms-text text-sm">
          {booking.customer_name || booking.customerName}
        </span>
      </div>
      <div>
        <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
          Event Date & Time
        </span>
        <span className="font-semibold text-pms-text">
          {formatDateDisplay(booking.event_date || booking.eventDate)}{' '}
          {booking.event_start || booking.eventStart || ''}
        </span>
      </div>
      <div>
        <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
          Venue
        </span>
        <span className="font-semibold text-pms-text">
          {booking.venue_name || booking.venueName || '—'}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
            Guests
          </span>
          <span className="font-semibold text-pms-text">
            {booking.guest_count || booking.guestCount || '—'}
          </span>
        </div>
        {onViewMenu && (
          <button
            type="button"
            onClick={() => onViewMenu(booking.id)}
            className="text-xs text-pms-accent hover:underline font-semibold"
          >
            View Menu
          </button>
        )}
      </div>
    </div>
  );
}
