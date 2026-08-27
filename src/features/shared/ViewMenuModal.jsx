import React from 'react';
import { Modal } from '../../components/common/Modal';
import { formatDateDisplay } from '../../utils/dateUtils';
import { Paperclip } from 'lucide-react';

export function ViewMenuModal({ isOpen, onClose, booking }) {
  if (!booking) return null;

  const menu = booking.menu || {};

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Finalized Menu — ${booking.id}`}
      subtitle="Read-only menu details locked by admin."
    >
      <div className="bg-slate-50 border border-pms-border rounded-lg p-4 mb-4 grid grid-cols-2 gap-4 text-xs">
        <div>
          <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
            Finalized On
          </span>
          <span className="font-semibold text-pms-text">
            {formatDateDisplay(menu.finalizationDate)}
          </span>
        </div>
        <div>
          <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
            Attachment
          </span>
          {menu.attachment ? (
            <a
              href={menu.attachment.dataUrl || '#'}
              download={menu.attachment.name}
              className="font-semibold text-pms-primary underline flex items-center gap-1"
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>{menu.attachment.name}</span>
            </a>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </div>
      </div>

      {menu.remarks && (
        <div className="text-xs space-y-1">
          <span className="font-semibold text-pms-muted">Remarks:</span>
          <p className="p-3 bg-white border border-pms-border rounded-lg text-pms-text">
            {menu.remarks}
          </p>
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-pms-border mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-pms-text rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
