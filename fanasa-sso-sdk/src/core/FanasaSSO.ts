import { FanasaSSOConfig, SSOToken, SSOUser, SSOMessage } from './types';

const TOKEN_KEY    = 'fanasa_sso_token';
const POPUP_NAME   = 'FanasaSSO';

export class FanasaSSO {
  private config: Required<FanasaSSOConfig>;

  constructor(config: FanasaSSOConfig) {
    this.config = {
      clientName: '',
      popup: { width: 480, height: 620 },
      ...config,
      ssoUrl: config.ssoUrl.replace(/\/$/, ''), // quitar slash final
    };
  }

  // ─── LOGIN ────────────────────────────────────────────────────────────────

  /**
   * Abre el SSO en un popup y devuelve el token cuando el usuario se autentica.
   *
   * @param redirectUri  URL de tu app a donde regresará el SSO tras autenticar.
   *                     Por defecto usa window.location.href (la página actual).
   */
  loginPopup(redirectUri?: string): Promise<SSOToken> {
    const uri = redirectUri || window.location.href.split('#')[0];

    return new Promise((resolve, reject) => {
      const popup = this.openPopup(uri);

      if (!popup) {
        reject(new Error('No se pudo abrir el popup. Verifica que no esté bloqueado por el browser.'));
        return;
      }

      const onMessage = (event: MessageEvent<SSOMessage>) => {
        // Validar que el mensaje viene del SSO
        if (event.origin !== new URL(this.config.ssoUrl).origin) return;
        if (event.data?.type !== 'FANASA_SSO_TOKEN') return;

        window.removeEventListener('message', onMessage);
        clearInterval(closedChecker);

        const token = this.buildToken(event.data.payload);
        this.saveToken(token);
        resolve(token);
      };

      // Si el usuario cierra el popup manualmente
      const closedChecker = setInterval(() => {
        if (popup.closed) {
          clearInterval(closedChecker);
          window.removeEventListener('message', onMessage);
          reject(new Error('El usuario cerró el popup sin autenticarse.'));
        }
      }, 500);

      window.addEventListener('message', onMessage);
    });
  }

  /**
   * Redirige la página completa al SSO.
   * El SSO regresará a redirectUri con el token en el hash (#id_token=xxx).
   * Llama a handleRedirectCallback() en la página de regreso.
   */
  loginRedirect(redirectUri?: string): void {
    const uri = redirectUri || window.location.href.split('#')[0];
    window.location.href = this.buildLoginUrl(uri);
  }

  /**
   * Llama esto al cargar la página para detectar si el SSO está regresando
   * con un token en el hash. Devuelve el token si lo encontró, null si no.
   *
   * Úsalo en el componente raíz o en la página que recibe el callback.
   */
  handleRedirectCallback(): SSOToken | null {
    const hash = window.location.hash.substring(1);
    if (!hash) return null;

    const params = new URLSearchParams(hash);
    const idToken = params.get('id_token');
    if (!idToken) return null;

    const token = this.buildToken({
      id_token:     idToken,
      access_token: params.get('access_token') || undefined,
      token_type:   params.get('token_type')   || 'Bearer',
      expires_in:   Number(params.get('expires_in') || 3600),
      scope:        params.get('scope')         || 'openid profile',
    });

    this.saveToken(token);
    // Limpiar el hash para que el token no quede en el historial del browser
    history.replaceState(null, '', window.location.pathname + window.location.search);

    return token;
  }

  // ─── TOKEN ────────────────────────────────────────────────────────────────

  getToken(): SSOToken | null {
    const raw = sessionStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SSOToken;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && Date.now() < token.expiresAt;
  }

  /** Decodifica el JWT y devuelve la info del usuario (sin validar firma) */
  getUser(): SSOUser | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const raw = this.decodeJwt(token.idToken);
      return {
        name:     raw['name']               || '',
        email:    raw['preferred_username'] || raw['email'] || '',
        objectId: raw['oid']  || '',
        tenantId: raw['tid']  || '',
        raw,
      };
    } catch {
      return null;
    }
  }

  logout(): void {
    sessionStorage.removeItem(TOKEN_KEY);
  }

  // ─── PRIVADOS ─────────────────────────────────────────────────────────────

  private buildLoginUrl(redirectUri: string): string {
    const params = new URLSearchParams({ redirect_uri: redirectUri });
    if (this.config.clientName) params.set('client_name', this.config.clientName);
    return `${this.config.ssoUrl}/login?${params}`;
  }

  private openPopup(redirectUri: string): Window | null {
    const { width = 480, height = 620 } = this.config.popup;
    const left = Math.round(window.screenX + (window.outerWidth  - width)  / 2);
    const top  = Math.round(window.screenY + (window.outerHeight - height) / 2);

    return window.open(
      this.buildLoginUrl(redirectUri),
      POPUP_NAME,
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
    );
  }

  private buildToken(payload: SSOMessage['payload']): SSOToken {
    return {
      idToken:     payload.id_token,
      accessToken: payload.access_token,
      tokenType:   payload.token_type,
      expiresAt:   Date.now() + payload.expires_in * 1000,
      scope:       payload.scope,
    };
  }

  private saveToken(token: SSOToken): void {
    sessionStorage.setItem(TOKEN_KEY, JSON.stringify(token));
  }

  private decodeJwt(token: string): Record<string, any> {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  }
}
