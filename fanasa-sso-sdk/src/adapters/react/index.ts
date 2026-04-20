import { useState, useEffect, useCallback, useRef } from 'react';
import { FanasaSSO } from '../../core/FanasaSSO';
import { FanasaSSOConfig, SSOToken, SSOUser } from '../../core/types';

export interface UseFanasaSSOReturn {
  user: SSOUser | null;
  token: SSOToken | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  loginPopup:   (redirectUri?: string) => Promise<void>;
  loginRedirect:(redirectUri?: string) => void;
  logout: () => void;
}

/**
 * Hook de React para el SSO de Fanasa.
 *
 * Uso:
 *   const { user, isAuthenticated, loginPopup, logout } = useFanasaSSO({
 *     ssoUrl: 'https://sso.fanasa.com',
 *     clientName: 'Mi App React',
 *   });
 */
export function useFanasaSSO(config: FanasaSSOConfig): UseFanasaSSOReturn {
  // Instancia estable (no se recrea en cada render)
  const ssoRef = useRef<FanasaSSO | null>(null);
  if (!ssoRef.current) {
    ssoRef.current = new FanasaSSO(config);
  }
  const sso = ssoRef.current;

  const [token,   setToken]   = useState<SSOToken | null>(() => sso.getToken());
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // Al montar el componente, verificar si el SSO regresó con un token en el hash
  useEffect(() => {
    const result = sso.handleRedirectCallback();
    if (result) setToken(result);
  }, []);

  const loginPopup = useCallback(async (redirectUri?: string) => {
    setLoading(true);
    setError(null);
    try {
      const t = await sso.loginPopup(redirectUri);
      setToken(t);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [sso]);

  const loginRedirect = useCallback((redirectUri?: string) => {
    sso.loginRedirect(redirectUri);
  }, [sso]);

  const logout = useCallback(() => {
    sso.logout();
    setToken(null);
  }, [sso]);

  return {
    user:            token ? sso.getUser() : null,
    token,
    isAuthenticated: sso.isAuthenticated(),
    loading,
    error,
    loginPopup,
    loginRedirect,
    logout,
  };
}

export { FanasaSSOConfig, SSOToken, SSOUser };
