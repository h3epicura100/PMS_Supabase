import React from 'react';
import { Modal } from '../../components/common/Modal';
import { formatDateDisplay, formatDateRangeDisplay } from '../../utils/dateUtils';
import { EventScheduleTable } from '../../components/shared/EventScheduleTable';
import { storageService } from '../../services/storageService';
import { Paperclip, Calendar, User, MapPin } from 'lucide-react';

export function ViewMenuModal({ isOpen, onClose, booking }) {
  if (!booking) return null;

  const menu = booking.menu || {};
  const dateRange = formatDateRangeDisplay(
    booking.eventStartDate || booking.event_start_date || booking.eventDate || booking.event_date,
    booking.eventEndDate || booking.event_end_date || booking.eventDate || booking.event_date
  );
  const schedule = booking.eventSchedule || booking.pms_event_schedule || [];

  const handleDownloadAttachment = async () => {
    if (!menu.attachment) return;
    if (menu.attachment.path?.startsWith('data:')) {
      window.open(menu.attachment.path, '_blank');
      return;
    }
    const url = await storageService.getSignedUrl(menu.attachment.path);
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Finalized Menu — ${booking.id}`}
      subtitle="Read-only menu details and event schedule locked by admin."
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4">
        {/* Booking Meta Summary */}
        <div className="bg-slate-50 border border-pms-border rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
              Customer
            </span>
            <span className="font-semibold text-pms-text">
              {booking.customerName || booking.customer_name || '—'}
            </span>
          </div>
          <div>
            <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
              Event Period
            </span>
            <span className="font-semibold text-pms-text">
              {dateRange}
            </span>
          </div>
          <div>
            <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
              Finalized On
            </span>
            <span className="font-semibold text-pms-text">
              {formatDateDisplay(menu.finalizationDate)}
            </span>
          </div>
        </div>

        {/* Event Schedule Section */}
        {schedule.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-pms-primary">
              <Calendar className="w-3.5 h-3.5 text-pms-accent" />
              <span>Event Schedule & Headcount</span>
            </div>
            <EventScheduleTable schedule={schedule} showTotal={true} />
          </div>
        )}

        {/* Menu Attachment Section */}
        <div className="space-y-2 pt-1">
          <span className="text-xs font-bold uppercase tracking-wider text-pms-primary block">
            Menu Attachment
          </span>
          {menu.attachment && (menu.attachment.name || menu.attachment.path) ? (
            <button
              type="button"
              onClick={handleDownloadAttachment}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-pms-primary bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer"
            >
              <Paperclip className="w-4 h-4 text-pms-accent" />
              <span>{menu.attachment.name || 'View Menu Document'}</span>
            </button>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-400 italic">
              No menu attachment uploaded.
            </div>
          )}
        </div>

        {/* Remarks */}
        {menu.remarks && (
          <div className="text-xs space-y-1">
            <span className="font-semibold text-pms-muted">Remarks:</span>
            <p className="p-3 bg-white border border-pms-border rounded-lg text-pms-text whitespace-pre-line">
              {menu.remarks}
            </p>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-pms-border mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-pms-text rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
