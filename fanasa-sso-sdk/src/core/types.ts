export interface FanasaSSOConfig {
  /** URL donde está desplegado el SSO. Ej: 'https://aplicacion.fanasa.com/SSO' */
  ssoUrl: string;
  /**
   * URL de tu proyecto a donde el SSO regresará tras autenticar.
   * Debe estar registrada en Azure AD.
   * Ej: 'https://mi-proyecto.fanasa.com'
   */
  redirectUri: string;
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
  adInfo?: AdInfo;
}

export interface SSOUser {
  name: string;              // Nombre completo (claim: name)
  givenName: string;         // Nombre de pila (claim: given_name)
  familyName: string;        // Apellido (claim: family_name)
  email: string;             // Correo / UPN (claim: preferred_username)
  username: string;          // Nombre de usuario (claim: unique_name)
  objectId: string;          // OID único en Azure AD (claim: oid)
  tenantId: string;          // Tenant de la organización (claim: tid)
  roles: string[];           // Roles asignados en Azure AD (claim: roles)
  raw: Record<string, any>;  // Todos los claims sin filtrar
}

export interface AdInfo {
  // Active Directory (LDAP)
  employeeNumber: string | null;
  area:           string | null;
  manager:        string | null;
  // Microsoft Graph
  displayName:    string | null;
  givenName:      string | null;
  familyName:     string | null;
  mail:           string | null;
  department:     string | null;
  jobTitle:       string | null;
  mobilePhone:    string | null;
  officeLocation: string | null;
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
    employee_number?: string;
    area?: string;
    manager?: string;
    display_name?: string;
    given_name?: string;
    family_name?: string;
    mail?: string;
    department?: string;
    job_title?: string;
    mobile_phone?: string;
    office_location?: string;
  };
}
