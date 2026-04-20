export interface FanasaSSOConfig {
  /** URL donde está desplegado el SSO. Ej: 'https://sso.fanasa.com' */
  ssoUrl: string;
  /** Nombre de tu app (aparece en la pantalla de login). Opcional. */
  clientName?: string;
  /** Tamaño del popup. Por defecto 480x620. */
  popup?: { width?: number; height?: number };
}

export interface SSOToken {
  idToken: string;
  accessToken?: string;
  tokenType: string;
  expiresAt: number;   // timestamp en ms
  scope: string;
}

export interface SSOUser {
  name: string;
  email: string;
  objectId: string;    // oid en Azure AD
  tenantId: string;    // tid en Azure AD
  raw: Record<string, any>;
}

/** Mensaje que llega por postMessage desde el popup del SSO */
export interface SSOMessage {
  type: 'FANASA_SSO_TOKEN';
  payload: {
    id_token: string;
    access_token?: string;
    token_type: string;
    expires_in: number;
    scope: string;
  };
}
