/**
 * Adaptador Angular LEGACY para @fanasa/sso.
 * Compatible con Angular 8, 9, 10, 11, 12, 13.
 *
 * Diferencias vs @fanasa/sso/angular (Angular 14+):
 *  - Guard es una clase con canActivate() en lugar de CanActivateFn
 *  - No usa inject() — compatible con versiones antiguas
 *  - ModuleWithProviders para el patrón forRoot()
 *
 * Uso:
 *   import { provideFanasaSSO, FanasaSSOService, FanasaSSOGuard }
 *     from '@fanasa/sso/angular-legacy';
 */
import type { Provider, ModuleWithProviders, Type } from '@angular/core';
import { InjectionToken } from '@angular/core';

import { FanasaSSO } from '../../core/FanasaSSO';
import type { FanasaSSOConfig, SSOToken, SSOUser } from '../../core/types';

// ─── Token de inyección ───────────────────────────────────────────────────────

export const FANASA_SSO = new InjectionToken<FanasaSSO>('FanasaSSO');

// ─── Service (sin decoradores — compatible con cualquier versión de Angular) ──

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
   * Detecta si el SSO regresó con token en el hash.
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

// ─── Guard — clase con canActivate() (Angular 8-13) ──────────────────────────
//
// En Angular < 14 no existe CanActivateFn. El guard es una clase
// que implementa la interfaz CanActivate via duck typing.
//
// Uso en rutas:
//   canActivate: [FanasaSSOGuard]   ← debe estar en providers también

export class FanasaSSOGuard {
  constructor(private service: FanasaSSOService) {}

  canActivate(): boolean {
    if (this.service.isAuthenticated()) return true;
    this.service.loginRedirect();
    return false;
  }
}

// ─── Provider factory ─────────────────────────────────────────────────────────
//
// Uso en AppModule:
//   providers: [...provideFanasaSSO({ ssoUrl: '...' })]

export function provideFanasaSSO(config: FanasaSSOConfig): Provider[] {
  const service = new FanasaSSOService(config);
  const guard   = new FanasaSSOGuard(service);

  return [
    { provide: FANASA_SSO,       useValue: service },
    { provide: FanasaSSOService, useValue: service },
    { provide: FanasaSSOGuard,   useValue: guard   },
  ];
}

// ─── forRoot helper — patrón módulo legacy (Angular 8-13) ────────────────────
//
// Para quienes prefieren el patrón FanasaSSOModule.forRoot():
//
//   imports: [FanasaSSOModule.forRoot({ ssoUrl: '...' })]
//
// Nota: FanasaSSOModule es un objeto plano, no usa @NgModule,
// pero Angular acepta ModuleWithProviders sin el decorador en imports
// cuando solo se usa para providers.

export const FanasaSSOModule = {
  forRoot(config: FanasaSSOConfig): ModuleWithProviders<object> {
    return {
      ngModule:  class {} as Type<object>,  // clase vacía como placeholder
      providers: provideFanasaSSO(config),
    };
  },
};

// ─── Re-exportar tipos ────────────────────────────────────────────────────────

export type { FanasaSSOConfig, SSOToken, SSOUser };
