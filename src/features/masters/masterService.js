import { supabase } from '../../services/supabase';

const DEFAULT_FUNCTION_TYPES = ['Wedding', 'Birthday', 'Corporate', 'Engagement', 'Anniversary', 'Other'];
const DEFAULT_EVENT_TIMES = ['Lunch', 'Dinner', 'Breakfast', 'Brunch', 'High Tea', 'Evening Snacks', 'Late Night', 'All Day', 'Custom'];
const DEFAULT_VENUES = ['Hotel Grand Regency', 'Royal Banquet', 'City Lawn', 'Orchard Club'];

export const masterService = {
  // --- FUNCTION TYPES ---
  async getFunctionTypes() {
    try {
      const { data, error } = await supabase
        .from('pms_function_types')
        .select('*')
        .order('id', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map(d => ({ id: d.id, name: d.name }));
      }
    } catch (e) {}
    return DEFAULT_FUNCTION_TYPES.map((name, i) => ({ id: i + 1, name }));
  },

  async addFunctionType(name) {
    const { data, error } = await supabase
      .from('pms_function_types')
      .insert([{ name }])
      .select();

    if (error) throw new Error(error.message);
    return data[0];
  },

  async updateFunctionType(id, name) {
    const { data, error } = await supabase
      .from('pms_function_types')
      .update({ name })
      .eq('id', id)
      .select();

    if (error) throw new Error(error.message);
    return data[0];
  },

  async deleteFunctionType(id) {
    const { error } = await supabase
      .from('pms_function_types')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  // --- EVENT TIMES ---
  async getEventTimes() {
    try {
      const { data, error } = await supabase
        .from('pms_event_times')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map(d => ({ id: d.id, name: d.name }));
      }
    } catch (e) {}
    return DEFAULT_EVENT_TIMES.map((name, i) => ({ id: i + 1, name }));
  },

  async addEventTime(name) {
    const { data, error } = await supabase
      .from('pms_event_times')
      .insert([{ name }])
      .select();

    if (error) throw new Error(error.message);
    return data[0];
  },

  async updateEventTime(id, name) {
    const { data, error } = await supabase
      .from('pms_event_times')
      .update({ name })
      .eq('id', id)
      .select();

    if (error) throw new Error(error.message);
    return data[0];
  },

  async deleteEventTime(id) {
    const { error } = await supabase
      .from('pms_event_times')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  // --- VENUES ---
  async getVenues() {
    try {
      const { data, error } = await supabase
        .from('pms_venues')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map(d => ({ id: d.id, name: d.name, address: d.address || '' }));
      }
    } catch (e) {}
    return DEFAULT_VENUES.map((name, i) => ({ id: String(i + 1), name, address: '' }));
  },

  async addVenue(name, address = '') {
    const { data, error } = await supabase
      .from('pms_venues')
      .insert([{ name, address }])
      .select();

    if (error) throw new Error(error.message);
    return data[0];
  },

  async updateVenue(id, name, address = '') {
    const { data, error } = await supabase
      .from('pms_venues')
      .update({ name, address })
      .eq('id', id)
      .select();

    if (error) throw new Error(error.message);
    return data[0];
  },

  async deleteVenue(id) {
    const { error } = await supabase
      .from('pms_venues')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
};
