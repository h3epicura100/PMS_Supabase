/**
 * Delay utilities for Order Rail PMS.
 * Calculates task delays based on 48-hour creation window + priority extension overrides.
 */

/**
 * Calculates planned date for department tasks.
 * Rule: 1 day before the eventDate.
 */
export function derivedPlannedDate(eventDate) {
  if (!eventDate) return '';
  const d = new Date(eventDate);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Returns the effective delay deadline Date for a booking.
 * - If delayDeadlineOverride is set: uses that timestamp.
 * - Otherwise: booking.createdAt + 48 hours (exact timestamp).
 */
export function getEffectiveDeadline(booking) {
  if (!booking) return new Date();

  const override = booking.delayDeadlineOverride || booking.delay_deadline_override;
  if (override) {
    return new Date(override);
  }

  const rawCreated = booking.createdAt || booking.created_at || booking.bookingDate || booking.booking_date;
  if (rawCreated) {
    const createdDate = new Date(rawCreated);
    if (!isNaN(createdDate.getTime())) {
      return new Date(createdDate.getTime() + 48 * 60 * 60 * 1000);
    }
  }

  return new Date();
}

/**
 * Calculates exact delay state and label for a department task.
 * Delay clock starts at booking creation timestamp + 48 hours (+24hr priority extensions if any).
 *
 * @param {Object|string} bookingOrPlanned - Booking object or fallback plannedDate string
 * @param {string} status - 'Pending' | 'Complete'
 * @param {string} [completedAtStr] - Task completion timestamp
 * @returns {{ label: string, cls: string, isDelayed: boolean, isDueToday: boolean, hoursOverdue: number, effectiveDeadline: Date }}
 */
export function calculateDelayInfo(bookingOrPlanned, status, completedAtStr) {
  // If a booking object is passed
  if (bookingOrPlanned && typeof bookingOrPlanned === 'object') {
    return calculateTaskDelayInfo(bookingOrPlanned, status, completedAtStr);
  }

  // Fallback for legacy date string usage
  const plannedDateStr = bookingOrPlanned;
  if (!plannedDateStr) {
    return { label: '—', cls: 'pending', isDelayed: false, isDueToday: false, hoursOverdue: 0, effectiveDeadline: new Date() };
  }

  const planned = new Date(plannedDateStr);
  planned.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (status === 'Complete') {
    const completedDate = completedAtStr ? new Date(completedAtStr) : today;
    completedDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((completedDate - planned) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { label: 'On Time', cls: 'completed', isDelayed: false, isDueToday: false, hoursOverdue: 0, effectiveDeadline: planned };
    }
    return {
      label: `${diffDays} Day${diffDays > 1 ? 's' : ''} Delayed`,
      cls: 'delayed',
      isDelayed: true,
      isDueToday: false,
      hoursOverdue: diffDays * 24,
      effectiveDeadline: planned,
    };
  }

  // Pending status
  const diffDays = Math.round((today - planned) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: 'On Time', cls: 'completed', isDelayed: false, isDueToday: false, hoursOverdue: 0, effectiveDeadline: planned };
  }
  if (diffDays === 0) {
    return { label: 'Due Today', cls: 'atrisk', isDelayed: false, isDueToday: true, hoursOverdue: 0, effectiveDeadline: planned };
  }
  return {
    label: `${diffDays} Day${diffDays > 1 ? 's' : ''} Delayed`,
    cls: 'delayed',
    isDelayed: true,
    isDueToday: false,
    hoursOverdue: diffDays * 24,
    effectiveDeadline: planned,
  };
}

/**
 * Modern delay calculation based on 48h booking creation timestamp & priority override.
 */
export function calculateTaskDelayInfo(booking, status, completedAtStr) {
  if (!booking) {
    return { label: '—', cls: 'pending', isDelayed: false, isDueToday: false, hoursOverdue: 0, effectiveDeadline: new Date() };
  }

  const effectiveDeadline = getEffectiveDeadline(booking);
  const now = new Date();

  if (status === 'Complete' || booking.status === 'closed' || booking.closed) {
    let completedDate = null;
    if (completedAtStr) {
      const parsed = new Date(completedAtStr);
      if (!isNaN(parsed.getTime())) {
        completedDate = parsed;
      }
    }
    if (!completedDate) {
      const rawFallback = booking.updatedAt || booking.updated_at;
      if (rawFallback) {
        const parsed = new Date(rawFallback);
        if (!isNaN(parsed.getTime())) {
          completedDate = parsed;
        }
      }
    }
    if (!completedDate) {
      completedDate = now;
    }

    const diffMs = completedDate.getTime() - effectiveDeadline.getTime();

    if (diffMs <= 0) {
      return { label: 'On Time', cls: 'completed', isDelayed: false, isDueToday: false, hoursOverdue: 0, effectiveDeadline };
    }

    const hours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
    if (hours < 24) {
      return {
        label: `${hours}h Delayed`,
        cls: 'delayed',
        isDelayed: true,
        isDueToday: false,
        hoursOverdue: hours,
        effectiveDeadline,
      };
    }

    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    const label = remHours > 0 && days < 3 ? `${days}d ${remHours}h Delayed` : `${days} Day${days > 1 ? 's' : ''} Delayed`;

    return {
      label,
      cls: 'delayed',
      isDelayed: true,
      isDueToday: false,
      hoursOverdue: hours,
      effectiveDeadline,
    };
  }

  // Pending status
  const diffMs = now.getTime() - effectiveDeadline.getTime();

  if (diffMs <= 0) {
    // Grace period still active
    const msRemaining = Math.abs(diffMs);
    const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));

    if (hoursRemaining <= 12) {
      return {
        label: `${hoursRemaining}h Left`,
        cls: 'atrisk',
        isDelayed: false,
        isDueToday: true,
        hoursOverdue: 0,
        effectiveDeadline,
      };
    }

    return {
      label: 'On Time',
      cls: 'completed',
      isDelayed: false,
      isDueToday: false,
      hoursOverdue: 0,
      effectiveDeadline,
    };
  }

  // Delayed! (Past 48h + extensions)
  const hours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
  if (hours < 24) {
    return {
      label: `${hours}h Delayed`,
      cls: 'delayed',
      isDelayed: true,
      isDueToday: false,
      hoursOverdue: hours,
      effectiveDeadline,
    };
  }

  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  const label = remHours > 0 && days < 3 ? `${days}d ${remHours}h Delayed` : `${days} Day${days > 1 ? 's' : ''} Delayed`;

  return {
    label,
    cls: 'delayed',
    isDelayed: true,
    isDueToday: false,
    hoursOverdue: hours,
    effectiveDeadline,
  };
}
