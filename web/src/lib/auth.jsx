import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthAPI, SettingsAPI, getToken, setToken, clearToken } from './api.js';

const AuthContext = createContext(null);

const USER_KEY = 'sanad_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return getToken() ? JSON.parse(localStorage.getItem(USER_KEY) || 'null') : null;
    } catch {
      return null;
    }
  });
  const [ready, setReady] = useState(false);

  const persistUser = useCallback((u) => {
    setUser(u);
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_KEY);
  }, []);

  // Revalidate the token + refresh settings on load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!getToken()) {
        setReady(true);
        return;
      }
      try {
        const settings = await SettingsAPI.get();
        if (!cancelled) persistUser({ ...(user || {}), ...settings });
      } catch (err) {
        if (!cancelled && err.status === 401) {
          clearToken();
          persistUser(null);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []); // once on mount — intentionally not re-run when user changes

  const login = useCallback(
    async (email, password) => {
      const { token, user: u } = await AuthAPI.login({ email, password });
      setToken(token);
      persistUser(u);
    },
    [persistUser]
  );

  const signup = useCallback(
    async (payload) => {
      const { token, user: u } = await AuthAPI.signup(payload);
      setToken(token);
      persistUser(u);
    },
    [persistUser]
  );

  const logout = useCallback(() => {
    clearToken();
    persistUser(null);
  }, [persistUser]);

  const value = useMemo(
    () => ({ user, ready, login, signup, logout, updateUser: persistUser }),
    [user, ready, login, signup, logout, persistUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}

export function useLocale() {
  const { user } = useAuth();
  return user?.locale === 'en' ? 'en' : 'ar';
}
