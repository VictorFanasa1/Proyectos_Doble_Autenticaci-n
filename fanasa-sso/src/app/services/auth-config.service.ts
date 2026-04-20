import { Injectable } from '@angular/core';
import { SsoConfig, DeliveryMode } from '../models/sso-config.model';

const SESSION_KEY = 'fanasa_sso_config';

@Injectable({ providedIn: 'root' })
export class AuthConfigService {

  /**
   * Parsea los parámetros de la URL.
   * Solo es requerido `redirect_uri`; client_id y tenant_id
   * vienen del environment y son iguales para todos los proyectos.
   *
   * URL de ejemplo:
   *   /login?redirect_uri=https://mi-proyecto.com/callback
   *   /login?redirect_uri=https://mi-proyecto.com/callback&client_name=CRM
   */
  parseFromUrl(params: Record<string, string | null>): SsoConfig {
    const redirectUri = params['redirect_uri'];

    if (!redirectUri) {
      throw new Error('Parámetro requerido faltante: redirect_uri');
    }

    try {
      new URL(redirectUri);
    } catch {
      throw new Error(`redirect_uri no es una URL válida: "${redirectUri}"`);
    }

    const config: SsoConfig = {
      redirectUri,
      clientName: params['client_name'] || undefined,
    };

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(config));
    return config;
  }

  getStoredConfig(): SsoConfig | null {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SsoConfig;
    } catch {
      return null;
    }
  }

  clearStoredConfig(): void {
    sessionStorage.removeItem(SESSION_KEY);
  }

  getDeliveryMode(): DeliveryMode {
    // Popup: tiene ventana padre con acceso (mismo origen o opener accesible)
    if (window.opener && window.opener !== window) {
      return 'popup';
    }
    // Iframe: está dentro de otra ventana pero sin opener
    try {
      if (window.self !== window.top) return 'postmessage';
    } catch {
      return 'postmessage'; // iframe cross-origin
    }
    // Navegación normal
    return 'redirect';
  }
}
