import React, { useState } from 'react';
import { formatDateRangeDisplay } from '../../utils/dateUtils';
import { EventScheduleTable } from './EventScheduleTable';
import { ChevronDown, ChevronUp, Calendar, Users, MapPin, User } from 'lucide-react';

export function BookingSummary({ booking, onViewMenu, defaultOpenSchedule = true }) {
  const [showSchedule, setShowSchedule] = useState(defaultOpenSchedule);

  if (!booking) return null;

  const customerName = booking.customer_name || booking.customerName || '—';
  const customerMobile = booking.customer_mobile || booking.customerMobile || '';
  const startDate = booking.event_start_date || booking.eventStartDate || booking.event_date || booking.eventDate;
  const endDate = booking.event_end_date || booking.eventEndDate || booking.event_date || booking.eventDate;
  const dateRange = formatDateRangeDisplay(startDate, endDate);
  const venue = booking.venue_name || booking.venueName || '—';
  const totalPax = (booking.total_guest_count ?? booking.totalGuestCount ?? booking.guest_count ?? booking.guestCount)?.toLocaleString() || '—';
  const schedule = booking.pms_event_schedule || booking.eventSchedule || [];

  return (
    <div className="bg-slate-50 border border-pms-border rounded-xl p-4 mb-4 text-xs space-y-3 shadow-xs">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
            Customer
          </span>
          <span className="font-semibold text-pms-text text-sm block">
            {customerName}
          </span>
          {customerMobile && (
            <span className="text-[11px] text-slate-500 font-mono block">{customerMobile}</span>
          )}
        </div>

        <div>
          <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
            Event Period
          </span>
          <span className="font-semibold text-pms-text block">
            {dateRange}
          </span>
          {schedule.length > 0 && (
            <button
              type="button"
              onClick={() => setShowSchedule(!showSchedule)}
              className="inline-flex items-center gap-1 text-[11px] text-pms-accent hover:underline font-medium mt-0.5"
            >
              <span>{schedule.length} session{schedule.length > 1 ? 's' : ''}</span>
              {showSchedule ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>

        <div>
          <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
            Venue
          </span>
          <span className="font-semibold text-pms-text block">
            {venue}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
              Total Pax
            </span>
            <span className="font-mono font-bold text-pms-primary text-sm block">
              {totalPax}
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

      {showSchedule && schedule.length > 0 && (
        <div className="pt-3 border-t border-slate-200">
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-pms-accent" />
            <span>Event Schedule Breakdown</span>
          </div>
          <EventScheduleTable schedule={schedule} showTotal={true} />
        </div>
      )}
    </div>
  );
}
