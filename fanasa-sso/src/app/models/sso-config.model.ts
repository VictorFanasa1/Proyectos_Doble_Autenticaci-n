export interface SsoConfig {
  redirectUri: string;
  clientName?: string;
}

export interface TokenPayload {
  id_token: string;
  access_token?: string;
  token_type: string;
  expires_in: number;
  scope: string;
  // Active Directory (LDAP)
  employee_number?: string;
  area?: string;
  manager?: string;
  // Microsoft Graph
  display_name?: string;
  given_name?: string;
  family_name?: string;
  mail?: string;
  department?: string;
  job_title?: string;
  mobile_phone?: string;
  office_location?: string;
}

/**
 * popup    → abierto con window.open() desde el cliente
 * postmessage → embebido en iframe (Microsoft lo bloquea, pero por si acaso)
 * redirect → navegación normal de página completa
 */
export type DeliveryMode = 'popup' | 'postmessage' | 'redirect';
