import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

const SSO_URL        = 'https://sso.fanasa.com';  // URL del SSO
const TOKEN_KEY      = 'fanasa_id_token';
const TOKEN_EXP_KEY  = 'fanasa_token_exp';

@Injectable({ providedIn: 'root' })
export class AuthService {

  constructor(private router: Router) {}

  /** Redirige al SSO mandando la URL actual como redirect_uri */
  redirectToLogin(clientName?: string): void {
    const params = new URLSearchParams({
      // El usuario vuelve a la misma página donde estaba
      redirect_uri: window.location.href.split('#')[0], // sin hash previo
      ...(clientName ? { client_name: clientName } : {}),
    });

    window.location.href = `${SSO_URL}/login?${params}`;
  }

  /**
   * Llama esto en el componente raíz (AppComponent.ngOnInit) o en la ruta
   * que recibe el callback. Lee el token del hash de la URL.
   *
   * Ejemplo redirect_uri: https://aplicacion.farmaciasespecializadas.com/FrenteTest
   * El SSO regresa:        https://aplicacion.farmaciasespecializadas.com/FrenteTest#id_token=xxx
   */
  handleCallback(): boolean {
    const hash   = window.location.hash.substring(1);
    if (!hash) return false;

    const params = new URLSearchParams(hash);
    const idToken = params.get('id_token');
    if (!idToken) return false;

    const expiresIn = Number(params.get('expires_in') || 3600);
    const expiresAt = Date.now() + expiresIn * 1000;

    sessionStorage.setItem(TOKEN_KEY,     idToken);
    sessionStorage.setItem(TOKEN_EXP_KEY, String(expiresAt));

    // Limpiar el hash de la URL (el token no debe quedar en el historial)
    history.replaceState(null, '', window.location.pathname + window.location.search);

    return true;
  }

  isAuthenticated(): boolean {
    const token   = sessionStorage.getItem(TOKEN_KEY);
    const expAt   = Number(sessionStorage.getItem(TOKEN_EXP_KEY) || 0);
    return !!token && Date.now() < expAt;
  }

  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  /** Decodifica el payload del JWT sin validar firma (solo para UI) */
  getUser(): Record<string, any> | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64));
    } catch {
      return null;
    }
  }

  logout(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_EXP_KEY);
    this.redirectToLogin();
  }
}
