import { supabase } from '../../services/supabase';

const LOCAL_USERS_KEY = 'pms_users_v2';

const DEFAULT_USERS = [
  {
    id: 'admin',
    password_hash: 'admin123',
    password: 'admin123',
    display_name: 'Administrator',
    name: 'Administrator',
    role: 'admin',
    has_full_access: true,
    allowedPages: ['ALL'],
  }
];

export const authService = {
  /**
   * Loads users from Supabase (with joined pms_user_permissions) or localStorage fallback.
   */
  async loadUsers() {
    try {
      const { data, error } = await supabase
        .from('pms_users')
        .select(`
          *,
          pms_user_permissions(permission_key)
        `);

      if (!error && data && data.length > 0) {
        return data.map(u => {
          const perms = (u.pms_user_permissions || []).map(p => p.permission_key);
          const isFull = Boolean(u.has_full_access || u.role === 'admin' || perms.includes('ALL'));
          return {
            ...u,
            name: u.display_name || u.id,
            password: u.password_hash,
            has_full_access: isFull,
            allowedPages: isFull ? ['ALL'] : (perms.length ? perms : ['dashboard']),
          };
        });
      }
    } catch (e) {
      console.warn('Using local users fallback');
    }

    const saved = localStorage.getItem(LOCAL_USERS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map(u => {
          const isFull = Boolean(u.has_full_access || u.role === 'admin' || u.allowedPages?.includes('ALL'));
          return {
            ...u,
            name: u.display_name || u.name || u.id,
            display_name: u.display_name || u.name || u.id,
            password: u.password_hash || u.password,
            has_full_access: isFull,
            allowedPages: isFull ? ['ALL'] : (u.allowedPages || ['dashboard']),
          };
        });
      } catch (e) {}
    }

    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  },

  /**
   * Authenticates user matching username & password.
   */
  async login(id, password) {
    const users = await this.loadUsers();
    const trimmedId = id.trim().toLowerCase();
    const match = users.find(u =>
      u.id.toLowerCase() === trimmedId &&
      (u.password_hash === password || u.password === password)
    );
    if (!match) {
      throw new Error('Incorrect ID or password.');
    }
    return match;
  },

  /**
   * Saves updated user list to localStorage.
   */
  async saveUsers(users) {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  }
};
