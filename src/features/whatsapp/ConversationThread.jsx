import React, { useEffect, useRef } from 'react';
import { formatTimeDisplay, formatDateDisplay } from '../../utils/dateUtils';
import { MessageComposer } from './MessageComposer';
import {
  User,
  Phone,
  CheckCheck,
  AlertCircle,
  Clock,
  RotateCw,
  ArrowLeft,
  Calendar,
  Building,
  RefreshCw,
  FileText,
  Download,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

export function ConversationThread({
  conversation,
  messages = [],
  loading = false,
  sending = false,
  onSendMessage,
  onRetryMessage,
  onRefresh,
  onBackMobile,
}) {
  const scrollRef = useRef(null);

  // Auto-scroll to bottom on messages load / change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  if (!conversation) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-50/50">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
          <Phone className="w-8 h-8 opacity-40" />
        </div>
        <h3 className="text-base font-semibold text-slate-700">No conversation selected</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Select an existing chat thread from the left or click "+ New Message" to start a new WhatsApp conversation.
        </p>
      </div>
    );
  }

  const contact = conversation.contact || {};
  const isStaff = contact.is_staff;
  const displayName = contact.display_name || contact.phone || 'Contact';

  // Group messages by Date (YYYY-MM-DD)
  const groupedMessages = messages.reduce((groups, msg) => {
    const dateStr = msg.sent_at ? new Date(msg.sent_at).toISOString().split('T')[0] : 'Unknown';
    if (!groups[dateStr]) groups[dateStr] = [];
    groups[dateStr].push(msg);
    return groups;
  }, {});

  return (
    <div className="h-full flex flex-col bg-slate-100/60 overflow-hidden">
      {/* Header */}
      <div className="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* Back button for mobile */}
          <button
            type="button"
            onClick={onBackMobile}
            className="lg:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Contact Avatar */}
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center shrink-0 border border-emerald-200 shadow-xs">
            {displayName[0]?.toUpperCase() || 'C'}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 truncate">
                {displayName}
              </h2>
              {isStaff ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-pms-primary border border-blue-200">
                  Staff
                </span>
              ) : (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Direct
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
              <span>+{contact.phone}</span>
              {conversation.message_count > 0 && (
                <span className="text-[11px] text-slate-400 font-sans">
                  • {conversation.message_count} {conversation.message_count === 1 ? 'message' : 'messages'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            className="p-2 text-slate-500 hover:text-pms-primary hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh thread"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-pms-primary' : ''}`} />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-slate-400">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-6">
            <p className="text-xs">No messages sent in this thread yet.</p>
            <p className="text-[11px] text-slate-400 mt-1">Send a message below to start the conversation.</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([dateStr, msgs]) => {
            const dateDisplay = formatDateDisplay(dateStr);

            return (
              <div key={dateStr} className="space-y-3">
                {/* Date separator pill */}
                <div className="flex items-center justify-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-200/80 text-slate-600 px-2.5 py-0.5 rounded-full shadow-xs">
                    {dateDisplay}
                  </span>
                </div>

                {/* Messages in this date */}
                {msgs.map((msg) => {
                  const isIncoming = msg.direction === 'incoming';
                  const isFailed = msg.status === 'Failed';
                  const isPending = msg.status === 'Pending';
                  const time = formatTimeDisplay(msg.sent_at);

                  return (
                    <div key={msg.id} className={`flex flex-col ${isIncoming ? 'items-start' : 'items-end'}`}>
                      {/* Sender label for incoming messages */}
                      {isIncoming && (
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 mb-1 ml-1">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>{msg.sent_by_name || displayName}</span>
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 shadow-xs transition-all ${
                          isFailed
                            ? 'bg-rose-50 border border-rose-200 text-rose-950 rounded-tr-xs'
                            : isIncoming
                              ? 'bg-white border border-slate-200 rounded-tl-xs text-slate-900 shadow-xs'
                              : 'bg-emerald-50/90 border border-emerald-200/80 rounded-tr-xs text-slate-900'
                        }`}
                      >
                        {/* Optional Booking Reference pill */}
                        {msg.booking_id && (
                          <div className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-white/80 border border-emerald-200 text-emerald-800 mb-2">
                            <span>Booking: #{msg.booking_id}</span>
                          </div>
                        )}

                        {/* Media Attachment (Image preview or Document Card) */}
                        {msg.media_url && (
                          <div className="mb-2">
                            {msg.media_type?.startsWith('image/') || msg.media_url.match(/\.(jpeg|jpg|png|gif|webp)($|\?)/i) ? (
                              <div className="group relative rounded-xl overflow-hidden border border-black/10 bg-black/5 shadow-2xs max-w-sm">
                                <a
                                  href={msg.media_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block"
                                >
                                  <img
                                    src={msg.media_url}
                                    alt={msg.media_name || 'Attached image'}
                                    className="w-full max-h-64 object-cover group-hover:opacity-95 transition-opacity"
                                    loading="lazy"
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 text-xs font-semibold backdrop-blur-[1px]">
                                    <ExternalLink className="w-4 h-4" />
                                    <span>View Full Size</span>
                                  </div>
                                </a>
                              </div>
                            ) : (
                              <a
                                href={msg.media_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={msg.media_name || 'document'}
                                className="flex items-center gap-3 p-2.5 bg-white/95 hover:bg-white border border-black/10 rounded-xl transition-all text-slate-800 group shadow-2xs max-w-sm"
                              >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border group-hover:scale-105 transition-transform ${
                                  isIncoming
                                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                                    : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                }`}>
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                                    {msg.media_name || 'Document Attachment'}
                                  </div>
                                  <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                    <Download className="w-3 h-3 text-emerald-600" />
                                    <span>Click to open / download</span>
                                  </div>
                                </div>
                              </a>
                            )}
                          </div>
                        )}

                        {/* Message Text with preserved line breaks */}
                        {msg.message && (
                          <div className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed font-sans select-text">
                            {msg.message}
                          </div>
                        )}

                        {/* Meta info & Delivery Status */}
                        <div className="flex items-center justify-end gap-2 mt-2 pt-1 border-t border-black/5 text-[10px] text-slate-500">
                          {!isIncoming && msg.sent_by_name && (
                            <span className="italic">By {msg.sent_by_name}</span>
                          )}
                          <span>{time}</span>

                          {/* Status icon (outgoing only) */}
                          {!isIncoming && (
                            <>
                              {isFailed ? (
                                <span className="flex items-center gap-1 text-rose-600 font-semibold" title={msg.error_message || 'Delivery failed'}>
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  Failed
                                </span>
                              ) : isPending ? (
                                <span className="flex items-center gap-1 text-amber-600" title="Dispatching...">
                                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                                  Pending
                                </span>
                              ) : (
                                <span className="flex items-center gap-0.5 text-emerald-600" title="Delivered via Maytapi">
                                  <CheckCheck className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        {/* Error Message + Retry button if failed */}
                        {isFailed && !isIncoming && (
                          <div className="mt-2 pt-2 border-t border-rose-200/60 flex items-center justify-between text-[11px]">
                            <span className="text-rose-700 truncate mr-2">
                              {msg.error_message || 'Failed to send'}
                            </span>
                            {onRetryMessage && (
                              <button
                                type="button"
                                onClick={() => onRetryMessage(msg.id)}
                                className="px-2 py-0.5 rounded bg-rose-600 text-white font-semibold hover:bg-rose-700 flex items-center gap-1 shrink-0"
                              >
                                <RotateCw className="w-3 h-3" />
                                Retry
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      {/* Composer footer */}
      <MessageComposer
        onSendMessage={onSendMessage}
        disabled={!conversation}
        sending={sending}
      />
    </div>
  );
}
