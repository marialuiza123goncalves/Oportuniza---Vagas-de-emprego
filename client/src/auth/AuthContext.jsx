import { useMemo, useState } from 'react';
import { apiRequest } from '../services/api.js';
import { AuthContext } from './authContext.js';

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('oportuniza-admin') || 'null');
    } catch {
      sessionStorage.removeItem('oportuniza-admin');
      return null;
    }
  });

  async function login(email, password) {
    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    sessionStorage.setItem('oportuniza-token', result.token);
    sessionStorage.setItem('oportuniza-admin', JSON.stringify(result.admin));
    setAdmin(result.admin);
  }

  function logout() {
    sessionStorage.removeItem('oportuniza-token');
    sessionStorage.removeItem('oportuniza-admin');
    setAdmin(null);
  }

  const value = useMemo(() => ({ admin, login, logout }), [admin]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
