import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../../features/auth/authService';
import { hasPermission } from '../../utils/permissionUtils';

const AuthContext = createContext(null);
const SESSION_KEY = 'pms_session_v2';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    try {
      if (saved) {
        const u = JSON.parse(saved);
        const isFull = Boolean(u.has_full_access || u.role === 'admin' || u.allowedPages?.includes('ALL'));
        return {
          ...u,
          has_full_access: isFull,
          allowedPages: isFull ? ['ALL'] : (u.allowedPages || ['dashboard']),
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  const [users, setUsersState] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      const list = await authService.loadUsers();
      setUsersState(list);

      // Refresh logged-in user profile from loaded list
      if (currentUser) {
        const updatedSelf = list.find(u => u.id.toLowerCase() === currentUser.id.toLowerCase());
        if (updatedSelf) {
          setCurrentUser(updatedSelf);
          localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSelf));
        }
      }

      setLoading(false);
    }
    initAuth();
  }, []);

  const login = async (id, password) => {
    const user = await authService.login(id, password);
    setCurrentUser(user);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const setUsers = (userList) => {
    setUsersState(userList);
    if (currentUser) {
      const updatedSelf = userList.find(u => u.id.toLowerCase() === currentUser.id.toLowerCase());
      if (updatedSelf) {
        setCurrentUser(updatedSelf);
        localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSelf));
      }
    }
  };

  const checkAccess = (pageKey) => {
    if (!currentUser) return false;
    return hasPermission(currentUser, currentUser.allowedPages, pageKey);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        loading,
        login,
        logout,
        hasAccess: checkAccess,
        setUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
