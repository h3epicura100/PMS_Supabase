import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services/notificationService';
import { Button } from '../../components/common/Button';
import { RefreshCw, Bell, Send, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export function NotificationLogs() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await notificationService.getNotificationLogs(100);
      setLogs(data || []);
    } catch (err) {
      console.error('Error loading notification logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleManualCheck = async (force = false) => {
    setIsTriggering(true);
    try {
      const result = await notificationService.checkAndSendDelayAlerts({ force });
      if (result.sentCount > 0) {
        toast.success(`Check complete: ${result.sentCount} alert(s) dispatched via WhatsApp.`);
      } else if (result.delayedCount > 0) {
        toast.info(`Found ${result.delayedCount} delayed task(s). Notifications were already sent or outside slot window.`);
      } else {
        toast.info('All pending department tasks are within the 48hr window.');
      }
      await loadLogs();
    } catch (e) {
      toast.error('Failed to trigger delay check: ' + (e.message || 'Unknown error'));
    } finally {
      setIsTriggering(false);
    }
  };

  const formatISTDateTime = (isoStr) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(d);
    } catch (_) {
      return isoStr;
    }
  };

  const formatTypeBadge = (type) => {
    switch (type) {
      case 'initial_delay':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            Initial Delay (48h)
          </span>
        );
      case 'reminder_11am':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Reminder 11:00 AM
          </span>
        );
      case 'reminder_3pm':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
            <Clock className="w-3 h-3 text-orange-600" />
            Reminder 3:00 PM
          </span>
        );
      case 'reminder_6pm':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <Clock className="w-3 h-3 text-indigo-600" />
            Reminder 6:00 PM
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
            {type || 'Notification'}
          </span>
        );
    }
  };

  const formatStatusBadge = (status) => {
    if (status === 'Sent') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Sent
        </span>
      );
    }
    if (status === 'Partial') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          Partial
        </span>
      );
    }
    if (status === 'Failed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
          Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
        {status || 'Skipped'}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-300" />
              <h3 className="text-base font-bold">Smart Delay & WhatsApp Notification Monitor</h3>
            </div>
            <p className="text-xs text-blue-100 leading-relaxed max-w-2xl">
              Tasks are delayed starting 48 hours after booking creation (with +24h extension when closer events are added). 
              Initial delay alert is sent immediately, followed by daily reminders at <strong>11:00 AM, 3:00 PM, and 6:00 PM IST</strong> strictly to assigned department staff numbers.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={loadLogs}
              disabled={isLoading}
              className="bg-white/10 text-white hover:bg-white/20 border-white/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => handleManualCheck(false)}
              disabled={isTriggering}
              className="bg-blue-500 hover:bg-blue-600 text-white shadow"
            >
              <Send className={`w-3.5 h-3.5 ${isTriggering ? 'animate-spin' : ''}`} />
              <span>{isTriggering ? 'Checking...' : 'Check & Send Alerts Now'}</span>
            </Button>
          </div>
        </div>

        {/* Schedule Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-blue-800/60 text-xs">
          <div className="bg-blue-950/40 rounded-lg p-2.5 border border-blue-800/40">
            <span className="text-[10px] uppercase text-blue-300 font-semibold block">Grace Period</span>
            <span className="font-bold text-sm text-white">48 Hours</span>
          </div>
          <div className="bg-blue-950/40 rounded-lg p-2.5 border border-blue-800/40">
            <span className="text-[10px] uppercase text-blue-300 font-semibold block">Priority Extension</span>
            <span className="font-bold text-sm text-white">+24 Hours / Closer</span>
          </div>
          <div className="bg-blue-950/40 rounded-lg p-2.5 border border-blue-800/40">
            <span className="text-[10px] uppercase text-blue-300 font-semibold block">Daily Reminders</span>
            <span className="font-bold text-sm text-white">11 AM • 3 PM • 6 PM</span>
          </div>
          <div className="bg-blue-950/40 rounded-lg p-2.5 border border-blue-800/40">
            <span className="text-[10px] uppercase text-blue-300 font-semibold block">Recipient Target</span>
            <span className="font-bold text-sm text-emerald-300">Dept Staff Only</span>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-pms-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-pms-border flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-pms-text">Dispatched Notification History</h4>
            <p className="text-xs text-pms-muted">Log of all initial delay and reminder alerts sent via WhatsApp.</p>
          </div>
          <span className="text-xs text-pms-muted bg-slate-100 px-2.5 py-1 rounded-md font-medium">
            {logs.length} Logged {logs.length === 1 ? 'Event' : 'Events'}
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-pms-muted">Loading notification logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center text-slate-400 space-y-1">
            <Bell className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm font-medium text-pms-text">No WhatsApp delay notifications recorded yet.</p>
            <p className="text-xs text-pms-muted">When department tasks exceed 48 hours, notifications sent to staff will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-pms-border text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Sent At (IST)</th>
                  <th className="py-3 px-4">Booking ID</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Recipients</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pms-border">
                {logs.map((log) => {
                  const recipientsList = Array.isArray(log.recipients) ? log.recipients : [];
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-medium font-mono text-[11px]">
                        {formatISTDateTime(log.sent_at)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono font-semibold text-pms-primary">
                        {log.booking_id}
                      </td>
                      <td className="py-3 px-4 font-semibold text-pms-text capitalize">
                        {log.department_key}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {formatTypeBadge(log.type)}
                      </td>
                      <td className="py-3 px-4 text-pms-text">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-semibold text-slate-800">
                            {recipientsList.length} staff
                          </span>
                          {recipientsList.length > 0 && (
                            <span className="text-[11px] text-slate-400 font-mono">
                              ({recipientsList.join(', ')})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {formatStatusBadge(log.status)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
