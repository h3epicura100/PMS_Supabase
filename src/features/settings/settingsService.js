import { supabase } from '../../services/supabase';
import { authService } from '../auth/authService';

export const settingsService = {
  async getUsers() {
    return authService.loadUsers();
  },

  async saveUser(userData, isEditing) {
    const users = await this.getUsers();

    const isFull = Boolean(userData.has_full_access || userData.role === 'admin' || userData.allowedPages?.includes('ALL'));
    const pageList = isFull ? ['ALL'] : (userData.allowedPages || ['dashboard']);

    const formattedUser = {
      id: userData.id,
      password_hash: userData.password_hash || userData.password || 'admin123',
      password: userData.password_hash || userData.password || 'admin123',
      display_name: userData.display_name || userData.name || userData.id,
      name: userData.display_name || userData.name || userData.id,
      whatsapp_number: userData.whatsapp_number || userData.whatsappNumber || null,
      role: userData.role,
      has_full_access: isFull,
      allowedPages: pageList,
    };

    if (isEditing) {
      const idx = users.findIndex(u => u.id === userData.id);
      if (idx !== -1) {
        users[idx] = formattedUser;
      }
    } else {
      if (users.some(u => u.id.toLowerCase() === userData.id.toLowerCase())) {
        throw new Error('That User ID is already in use.');
      }
      users.push(formattedUser);
    }

    try {
      // 1. Upsert pms_users table in Supabase
      await supabase.from('pms_users').upsert({
        id: formattedUser.id,
        password_hash: formattedUser.password_hash,
        display_name: formattedUser.display_name,
        whatsapp_number: formattedUser.whatsapp_number,
        role: formattedUser.role,
        has_full_access: formattedUser.has_full_access,
      });

      // 2. Sync pms_user_permissions junction table in Supabase
      if (!isFull) {
        // Delete existing permission rows for this user
        await supabase.from('pms_user_permissions').delete().eq('user_id', formattedUser.id);

        const permRows = pageList
          .filter(key => key !== 'ALL' && key !== 'dashboard')
          .map(key => ({
            user_id: formattedUser.id,
            permission_key: key,
          }));

        if (permRows.length > 0) {
          await supabase.from('pms_user_permissions').insert(permRows);
        }
      }
    } catch (e) {
      console.warn('Supabase user save warning/fallback:', e);
    }

    await authService.saveUsers(users);
    return users;
  },

  async deleteUser(id, currentUserId) {
    if (id === currentUserId) {
      throw new Error('You cannot delete the account you are logged in as.');
    }

    const users = await this.getUsers();
    const admins = users.filter(u => u.role === 'admin');
    const target = users.find(u => u.id === id);

    if (target?.role === 'admin' && admins.length <= 1) {
      throw new Error('At least one admin account must remain.');
    }

    const updated = users.filter(u => u.id !== id);

    try {
      await supabase.from('pms_user_permissions').delete().eq('user_id', id);
      await supabase.from('pms_users').delete().eq('id', id);
    } catch (e) {}

    await authService.saveUsers(updated);
    return updated;
  }
};
