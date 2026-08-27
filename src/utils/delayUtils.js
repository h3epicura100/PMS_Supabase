/**
 * Calculates planned date for department tasks.
 * Rule: Always 1 day before the eventDate.
 */
export function derivedPlannedDate(eventDate) {
  if (!eventDate) return '';
  const d = new Date(eventDate);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Calculates exact delay state and label based on HTML source logic.
 */
export function calculateDelayInfo(plannedDateStr, status, completedAtStr) {
  if (!plannedDateStr) {
    return { label: '—', cls: 'pending', isDelayed: false, isDueToday: false };
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
      return { label: 'On Time', cls: 'completed', isDelayed: false, isDueToday: false };
    }
    return {
      label: `${diffDays} Day${diffDays > 1 ? 's' : ''} Delayed`,
      cls: 'delayed',
      isDelayed: true,
      isDueToday: false,
    };
  }

  // Pending status
  const diffDays = Math.round((today - planned) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: 'On Time', cls: 'completed', isDelayed: false, isDueToday: false };
  }
  if (diffDays === 0) {
    return { label: 'Due Today', cls: 'atrisk', isDelayed: false, isDueToday: true };
  }
  return {
    label: `${diffDays} Day${diffDays > 1 ? 's' : ''} Delayed`,
    cls: 'delayed',
    isDelayed: true,
    isDueToday: false,
  };
}
