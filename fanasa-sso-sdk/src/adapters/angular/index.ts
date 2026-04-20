/**
 * Adaptador Angular para @fanasa/sso.
 *
 * ¿Por qué sin decoradores?
 * tsup/esbuild no puede procesar @NgModule/@Injectable de forma compatible
 * con Angular Ivy. La solución es usar el patrón de providers sin decoradores
 * (soportado desde Angular 14+). Angular no requiere @Injectable si el
 * servicio se registra manualmente con useValue o useFactory.
 */
import type { Provider } from '@angular/core';
import { InjectionToken } from '@angular/core';
import type { CanActivateFn } from '@angular/router';

import { FanasaSSO } from '../../core/FanasaSSO';
import { FanasaSSOConfig, SSOToken, SSOUser } from '../../core/types';

// ─── Token de inyección ───────────────────────────────────────────────────────

export const FANASA_SSO = new InjectionToken<FanasaSSO>('FanasaSSO');

// ─── Service (sin @Injectable) ────────────────────────────────────────────────
//
// Sin decorador = sin procesamiento de ngcc/Ivy.
// Angular puede inyectar cualquier clase si la registras con useValue/useFactory.

export class FanasaSSOService {
  private readonly sso: FanasaSSO;

  constructor(config: FanasaSSOConfig) {
    this.sso = new FanasaSSO(config);
  }

  /** Abre popup del SSO. Resuelve con el token cuando el usuario se autentica. */
  loginPopup(redirectUri?: string): Promise<SSOToken> {
    return this.sso.loginPopup(redirectUri);
  }

  /** Redirige la página completa al SSO. */
  loginRedirect(redirectUri?: string): void {
    this.sso.loginRedirect(redirectUri);
  }

  /**
   * Detecta si el SSO regresó con token en el hash (#id_token=xxx).
   * Llama esto en AppComponent.ngOnInit().
   */
  handleRedirectCallback(): SSOToken | null {
    return this.sso.handleRedirectCallback();
  }

  isAuthenticated(): boolean  { return this.sso.isAuthenticated(); }
  getToken(): SSOToken | null { return this.sso.getToken(); }
  getUser(): SSOUser | null   { return this.sso.getUser(); }
  logout(): void              { this.sso.logout(); }
}

// ─── Provider factory ─────────────────────────────────────────────────────────
//
// Uso en AppModule:
//   providers: [...provideFanasaSSO({ ssoUrl: '...' })]
//
// Uso en app.config.ts (standalone):
//   providers: [provideFanasaSSO({ ssoUrl: '...' })]

export function provideFanasaSSO(config: FanasaSSOConfig): Provider[] {
  const service = new FanasaSSOService(config);
  return [
    { provide: FANASA_SSO,       useValue: service },
    { provide: FanasaSSOService, useValue: service },
  ];
}

// ─── Guard (CanActivateFn — Angular 14+) ──────────────────────────────────────
//
// Uso en rutas:
//   canActivate: [fanasaSSOGuard({ ssoUrl: '...' })]

export function fanasaSSOGuard(config: FanasaSSOConfig): CanActivateFn {
  const service = new FanasaSSOService(config);
  return () => {
    if (service.isAuthenticated()) return true;
    service.loginRedirect();
    return false;
  };
}

// ─── Re-exportar tipos ────────────────────────────────────────────────────────

export type { FanasaSSOConfig, SSOToken, SSOUser };
