import React from 'react';
import { Button } from '../../components/common/Button';
import { formatDateDisplay } from '../../utils/dateUtils';
import { CheckCircle2, Archive } from 'lucide-react';

export function ReadyToClose({ bookings = [], closedBookings = [], onCloseBooking }) {
  const hasBookings = bookings.length > 0 || closedBookings.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
        <h3 className="text-base font-bold text-pms-text">Wrapped Up & Closed Events</h3>
      </div>

      {!hasBookings ? (
        <div className="bg-white border border-pms-border rounded-xl p-6 text-center text-xs text-pms-muted">
          No events wrapped up or closed yet.
        </div>
      ) : (
        <div className="space-y-2">
          {/* 1. Ready to Close (Active) */}
          {bookings.map((b) => (
            <div
              key={b.id}
              className="bg-white border border-pms-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-pms-text">
                    <span className="font-mono text-pms-primary mr-2">{b.id}</span>
                    <span>{b.customerName}</span>
                    <span className="text-pms-muted font-normal text-xs ml-2">
                      · {formatDateDisplay(b.eventDate)}
                    </span>
                  </div>
                  <div className="text-xs text-emerald-600 font-medium">
                    All department tasks complete — Ready to close
                  </div>
                </div>
              </div>

              <Button
                size="sm"
                variant="primary"
                onClick={() => onCloseBooking(b.id)}
              >
                Move to History
              </Button>
            </div>
          ))}

          {/* 2. Closed / History Bookings */}
          {closedBookings.map((b) => (
            <div
              key={b.id}
              className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex items-center gap-3">
                <Archive className="w-5 h-5 text-slate-500 flex-shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-slate-700">
                    <span className="font-mono text-slate-500 mr-2">{b.id}</span>
                    <span>{b.customerName}</span>
                    <span className="text-slate-400 font-normal text-xs ml-2">
                      · {formatDateDisplay(b.eventDate)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    Closed & Archived Event
                  </div>
                </div>
              </div>

              <span className="text-xs font-bold text-slate-500 bg-slate-200 px-3 py-1 rounded-full uppercase tracking-wider">
                Closed
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
