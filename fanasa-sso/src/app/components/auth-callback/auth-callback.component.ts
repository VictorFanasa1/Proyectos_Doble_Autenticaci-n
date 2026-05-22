import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MsalService } from '@azure/msal-angular';
import { AuthenticationResult } from '@azure/msal-browser';

import { AuthConfigService } from '../../services/auth-config.service';
import { TokenDeliveryService } from '../../services/token-delivery.service';
import { TokenPayload } from '../../models/sso-config.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-auth-callback',
  standalone: false,
  template: `
    <div class="callback-screen">
      <div *ngIf="!error" class="status">
        <div class="spinner-lg"></div>
        <p>Autenticando, por favor espera…</p>
      </div>
      <div *ngIf="error" class="status error">
        <p>{{ error }}</p>
        <a href="javascript:history.back()">← Volver</a>
      </div>
    </div>
  `,
  styles: [`
    .callback-screen {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      font-family: 'Segoe UI', sans-serif;
    }
    .status {
      text-align: center;
      color: #fff;
      p { font-size: 1rem; margin-top: 1.2rem; opacity: 0.85; }
    }
    .status.error p { color: #fca5a5; }
    .status.error a { color: #93c5fd; font-size: 0.9rem; }
    .spinner-lg {
      width: 48px; height: 48px;
      border: 4px solid rgba(255,255,255,0.2);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class AuthCallbackComponent implements OnInit {
  error: string | null = null;

  constructor(
    private msalService: MsalService,
    private authConfigService: AuthConfigService,
    private tokenDeliveryService: TokenDeliveryService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      // handleRedirectPromise procesa el hash de respuesta de Microsoft
      const result: AuthenticationResult | null =
        await this.msalService.instance.handleRedirectPromise();

      if (!result) {
        // No hay respuesta de Microsoft en esta URL → redirigir al login
        window.location.href = environment.baseHref + 'login';
        return;
      }

      const config = this.authConfigService.getStoredConfig();
      if (!config) {
        this.error = 'Sesión de SSO expirada. Vuelve al proyecto e inicia sesión de nuevo.';
        return;
      }

      const payload: TokenPayload = {
        id_token:     result.idToken,
        access_token: result.accessToken || undefined,
        token_type:   'Bearer',
        expires_in:   result.expiresOn
          ? Math.floor((result.expiresOn.getTime() - Date.now()) / 1000)
          : 3600,
        scope: result.scopes.join(' '),
      };

      // Detectar si estamos en iframe o navegación normal
      const mode = this.authConfigService.getDeliveryMode();

      // Extraer origin del redirect_uri para postMessage seguro
      let allowedOrigin: string | undefined;
      try {
        allowedOrigin = new URL(config.redirectUri).origin;
      } catch {}

      this.authConfigService.clearStoredConfig();

      this.tokenDeliveryService.deliver(
        config.redirectUri,
        payload,
        mode,
        allowedOrigin
      );

    } catch (e: any) {
      console.error('[SSO] Callback error:', e);
      this.error = 'Error al procesar la autenticación. Por favor intenta de nuevo.';
    }
  }
}
