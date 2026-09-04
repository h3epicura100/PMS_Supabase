import { supabase } from './supabase';

export function subscribeToRealtimeChanges(onDataChange) {
  const channel = supabase
    .channel('pms_realtime_all_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'pms_bookings' },
      () => onDataChange('pms_bookings')
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'pms_event_schedule' },
      () => onDataChange('pms_event_schedule')
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'pms_menu_tasks' },
      () => onDataChange('pms_menu_tasks')
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'pms_department_tasks' },
      () => onDataChange('pms_department_tasks')
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'pms_vegetable_entries' },
      () => onDataChange('pms_vegetable_entries')
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'pms_cheese_dairy_entries' },
      () => onDataChange('pms_cheese_dairy_entries')
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'pms_users' },
      () => onDataChange('pms_users')
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
