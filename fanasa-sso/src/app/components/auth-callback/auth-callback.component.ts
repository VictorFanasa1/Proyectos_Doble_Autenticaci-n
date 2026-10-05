import { Component, OnInit } from '@angular/core';
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
      <div *ngIf="!error && !debugData" class="status">
        <div class="spinner-lg"></div>
        <p>Autenticando, por favor espera…</p>
      </div>
      <div *ngIf="error" class="status error">
        <p>{{ error }}</p>
        <a href="javascript:history.back()">← Volver</a>
      </div>
      <div *ngIf="debugData" class="debug-panel">
        <div class="debug-header">
          <div class="badge">SSO</div>
          <h2>Autenticación exitosa</h2>
          <p class="subtitle">Token generado correctamente</p>
        </div>

        <div class="section">
          <div class="section-title">👤 Usuario</div>
          <div class="field-row">
            <span class="label">Nombre completo</span>
            <span class="value">{{ debugData.user.name }}</span>
          </div>
          <div class="field-row" *ngIf="debugData.user.givenName">
            <span class="label">Nombre</span>
            <span class="value">{{ debugData.user.givenName }}</span>
          </div>
          <div class="field-row" *ngIf="debugData.user.familyName">
            <span class="label">Apellido</span>
            <span class="value">{{ debugData.user.familyName }}</span>
          </div>
          <div class="field-row">
            <span class="label">Email / UPN</span>
            <span class="value">{{ debugData.user.email }}</span>
          </div>
          <div class="field-row" *ngIf="debugData.user.username">
            <span class="label">Usuario</span>
            <span class="value">{{ debugData.user.username }}</span>
          </div>
          <div class="field-row">
            <span class="label">Object ID</span>
            <span class="value mono">{{ debugData.user.oid }}</span>
          </div>
          <div class="field-row">
            <span class="label">Tenant ID</span>
            <span class="value mono">{{ debugData.user.tid }}</span>
          </div>
          <div class="field-row" *ngIf="debugData.user.roles?.length">
            <span class="label">Roles</span>
            <span class="value">{{ debugData.user.roles.join(', ') }}</span>
          </div>
        </div>

        <div class="section" *ngIf="debugData.graph.displayName">
          <div class="section-title">☁️ Microsoft Graph</div>
          <div class="field-row" *ngIf="debugData.graph.displayName">
            <span class="label">Nombre completo</span>
            <span class="value">{{ debugData.graph.displayName }}</span>
          </div>
          <div class="field-row" *ngIf="debugData.graph.givenName">
            <span class="label">Nombre</span>
            <span class="value">{{ debugData.graph.givenName }}</span>
          </div>
          <div class="field-row" *ngIf="debugData.graph.familyName">
            <span class="label">Apellido</span>
            <span class="value">{{ debugData.graph.familyName }}</span>
          </div>
          <div class="field-row" *ngIf="debugData.graph.mail">
            <span class="label">Email</span>
            <span class="value">{{ debugData.graph.mail }}</span>
          </div>
          <div class="field-row" *ngIf="debugData.graph.department">
            <span class="label">Departamento</span>
            <span class="value">{{ debugData.graph.department }}</span>
          </div>
          <div class="field-row" *ngIf="debugData.graph.jobTitle">
            <span class="label">Puesto</span>
            <span class="value">{{ debugData.graph.jobTitle }}</span>
          </div>
          <div class="field-row" *ngIf="debugData.graph.officeLocation">
            <span class="label">Oficina</span>
            <span class="value">{{ debugData.graph.officeLocation }}</span>
          </div>
          <div class="field-row" *ngIf="debugData.graph.mobilePhone">
            <span class="label">Celular</span>
            <span class="value">{{ debugData.graph.mobilePhone }}</span>
          </div>
        </div>

        <div class="section" *ngIf="debugData.ad.employeeNumber">
          <div class="section-title">🏢 Active Directory</div>
          <div class="field-row">
            <span class="label">No. Empleado</span>
            <span class="value highlight">{{ debugData.ad.employeeNumber }}</span>
          </div>
          <div class="field-row">
            <span class="label">Área</span>
            <span class="value">{{ debugData.ad.area }}</span>
          </div>
          <div class="field-row" *ngIf="debugData.ad.manager">
            <span class="label">Manager</span>
            <span class="value">{{ debugData.ad.manager }}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">🔑 Token</div>
          <div class="field-row">
            <span class="label">Tipo</span>
            <span class="value">{{ debugData.tokenType }}</span>
          </div>
          <div class="field-row">
            <span class="label">Expira en</span>
            <span class="value">{{ debugData.expiresIn }}s</span>
          </div>
          <div class="field-row">
            <span class="label">Scopes</span>
            <span class="value">{{ debugData.scope }}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title-row">
            <span class="section-title">📄 id_token (JWT)</span>
            <button class="btn-copy" (click)="copiar(debugData.idToken, $event)">Copiar</button>
          </div>
          <div class="token-box">{{ debugData.idToken }}</div>
        </div>

        <div class="section" *ngIf="debugData.accessToken">
          <div class="section-title-row">
            <span class="section-title">🔐 access_token (JWT)</span>
            <button class="btn-copy" (click)="copiar(debugData.accessToken, $event)">Copiar</button>
          </div>
          <div class="token-box" style="color:#f472b6">{{ debugData.accessToken }}</div>
        </div>

        <div class="section">
          <div class="section-title-row">
            <span class="section-title">🧩 Claims decodificados (id_token)</span>
            <button class="btn-copy" (click)="copiar(debugData.claimsJson, $event)">Copiar</button>
          </div>
          <pre class="claims-box">{{ debugData.claimsJson }}</pre>
        </div>

        <button class="btn-continue" (click)="continuar()">Continuar al portal →</button>
      </div>
    </div>
  `,
  styles: [`
    .callback-screen {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f3460 100%);
      font-family: 'Segoe UI', sans-serif;
      padding: 2rem;
      box-sizing: border-box;
    }
    .status { text-align: center; color: #fff; p { margin-top: 1rem; opacity: 0.8; } }
    .status.error p { color: #fca5a5; }
    .status.error a { color: #93c5fd; font-size: 0.9rem; }
    .spinner-lg {
      width: 48px; height: 48px;
      border: 4px solid rgba(255,255,255,0.15);
      border-top-color: #60a5fa;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .debug-panel {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 2rem;
      width: 100%;
      max-width: 520px;
      box-shadow: 0 25px 50px rgba(0,0,0,0.5);
    }
    .debug-header {
      text-align: center;
      margin-bottom: 1.5rem;
      .badge {
        display: inline-block;
        background: #3b82f6;
        color: #fff;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 2px;
        padding: 3px 10px;
        border-radius: 20px;
        margin-bottom: 0.75rem;
      }
      h2 { color: #f1f5f9; font-size: 1.3rem; margin: 0 0 0.3rem; }
      .subtitle { color: #64748b; font-size: 0.85rem; margin: 0; }
    }
    .section {
      background: #0f172a;
      border-radius: 10px;
      padding: 1rem 1.2rem;
      margin-bottom: 0.75rem;
    }
    .section-title {
      color: #64748b;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 0.75rem;
    }
    .field-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.35rem 0;
      border-bottom: 1px solid #1e293b;
      &:last-child { border-bottom: none; }
    }
    .label { color: #475569; font-size: 0.82rem; }
    .value { color: #cbd5e1; font-size: 0.85rem; text-align: right; max-width: 65%; word-break: break-all; }
    .value.mono { font-family: monospace; font-size: 0.75rem; color: #94a3b8; }
    .value.highlight { color: #34d399; font-weight: 600; }
    .section-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .token-box {
      background: #020617;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 0.75rem;
      font-family: monospace;
      font-size: 0.68rem;
      color: #60a5fa;
      word-break: break-all;
      line-height: 1.5;
      max-height: 100px;
      overflow-y: auto;
    }
    .claims-box {
      background: #020617;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 0.75rem;
      font-family: monospace;
      font-size: 0.72rem;
      color: #a3e635;
      line-height: 1.6;
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 220px;
      overflow-y: auto;
    }
    .btn-copy {
      background: #334155;
      color: #94a3b8;
      border: none;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 0.72rem;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
      &:hover { background: #475569; color: #fff; }
      &.copied { background: #16a34a; color: #fff; }
    }
    .btn-continue {
      margin-top: 1.25rem;
      width: 100%;
      background: #3b82f6;
      color: #fff;
      border: none;
      padding: 0.8rem;
      border-radius: 10px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
      &:hover { background: #2563eb; }
    }
  `],
})
export class AuthCallbackComponent implements OnInit {
  error: string | null = null;
  ready = false;
  debugData: any = null;
  private pendingDeliver: (() => void) | null = null;

  constructor(
    private msalService: MsalService,
    private authConfigService: AuthConfigService,
    private tokenDeliveryService: TokenDeliveryService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const result: AuthenticationResult | null =
        await this.msalService.instance.handleRedirectPromise();

      if (!result) {
        window.location.href = environment.baseHref + 'login';
        return;
      }

      const config = this.authConfigService.getStoredConfig();
      if (!config) {
        this.error = 'Sesión de SSO expirada. Vuelve al proyecto e inicia sesión de nuevo.';
        return;
      }

      const idTokenClaims = JSON.parse(atob(result.idToken.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
      const userEmail = idTokenClaims['preferred_username'] || idTokenClaims['upn'] || idTokenClaims['email'] || '';

      // ── Graph API (datos de Entra ID) ────────────────────────────────────
      let graphData: Pick<TokenPayload, 'display_name' | 'given_name' | 'family_name' | 'mail' | 'department' | 'job_title' | 'mobile_phone' | 'office_location'> = {};
      if (result.accessToken) {
        try {
          const graphRes = await fetch(
            'https://graph.microsoft.com/v1.0/me?$select=displayName,givenName,surname,mail,department,jobTitle,mobilePhone,officeLocation',
            { headers: { Authorization: `Bearer ${result.accessToken}` } }
          );
          if (graphRes.ok) {
            const g = await graphRes.json();
            graphData = {
              given_name:      g.givenName      ?? undefined,
              family_name:     g.surname        ?? undefined,
              department:      g.department     ?? undefined,
              job_title:       g.jobTitle       ?? undefined,
              mobile_phone:    g.mobilePhone    ?? undefined,
              display_name:    g.displayName    ?? undefined,
              mail:            g.mail           ?? undefined,
              office_location: g.officeLocation ?? undefined,
            };
          }
        } catch {
          // No bloquear el login si Graph no responde
        }
      }

      // ── AD API (datos de Active Directory vía LDAP) ───────────────────────
      let adData: Pick<TokenPayload, 'employee_number' | 'area' | 'manager'> = {};
      if (environment.adEnrichmentUrl && userEmail) {
        try {
          const adRes = await fetch(`${environment.adEnrichmentUrl}?email=${encodeURIComponent(userEmail)}`, {
            headers: { Authorization: `Bearer ${result.idToken}` },
          });
          if (adRes.ok) {
            const adJson = await adRes.json();
            adData = {
              employee_number: adJson.employee_number ?? adJson.employeeNumber ?? undefined,
              area:            adJson.area            ?? undefined,
              manager:         adJson.manager         ?? undefined,
            };
          }
        } catch {
          // No bloquear el login si AD no responde
        }
      }

      const payload: TokenPayload = {
        id_token:     result.idToken,
        access_token: result.accessToken || undefined,
        token_type:   'Bearer',
        expires_in:   result.expiresOn
          ? Math.floor((result.expiresOn.getTime() - Date.now()) / 1000)
          : 3600,
        scope: result.scopes.join(' '),
        ...graphData,
        ...adData,  // AD sobreescribe Graph si ambos tienen el mismo campo
      };

      const mode = this.authConfigService.getDeliveryMode();
      let allowedOrigin: string | undefined;
      try { allowedOrigin = new URL(config.redirectUri).origin; } catch {}

      this.authConfigService.clearStoredConfig();
      this.pendingDeliver = () => this.tokenDeliveryService.deliver(config.redirectUri, payload, mode, allowedOrigin);
      this.ready = true;
      this.debugData = {
        user: {
          name:       idTokenClaims['name']               || '',
          givenName:  idTokenClaims['given_name']         || '',
          familyName: idTokenClaims['family_name']        || '',
          email:      userEmail,
          username:   idTokenClaims['unique_name']        || idTokenClaims['preferred_username'] || '',
          oid:        idTokenClaims['oid']                || '',
          tid:        idTokenClaims['tid']                || '',
          roles:      Array.isArray(idTokenClaims['roles']) ? idTokenClaims['roles'] : [],
        },
        graph: {
          displayName:    graphData.display_name    || null,
          givenName:      graphData.given_name      || null,
          familyName:     graphData.family_name     || null,
          mail:           graphData.mail            || null,
          department:     graphData.department      || null,
          jobTitle:       graphData.job_title       || null,
          mobilePhone:    graphData.mobile_phone    || null,
          officeLocation: graphData.office_location || null,
        },
        ad: {
          employeeNumber: adData.employee_number || null,
          area:           adData.area            || null,
          manager:        adData.manager         || null,
        },
        tokenType: payload.token_type,
        expiresIn: payload.expires_in,
        scope: payload.scope,
        idToken: result.idToken,
        accessToken: result.accessToken || null,
        claimsJson: JSON.stringify(idTokenClaims, null, 2),
      };

    } catch (e: any) {
      console.error('[SSO] Callback error:', e);
      this.error = 'Error al procesar la autenticación. Por favor intenta de nuevo.';
    }
  }

  continuar(): void {
    if (this.pendingDeliver) {
      this.pendingDeliver();
      this.pendingDeliver = null;
    }
  }

  copiar(texto: string, event: Event): void {
    navigator.clipboard.writeText(texto).catch(() => {});
    const btn = event.target as HTMLButtonElement;
    const original = btn.textContent;
    btn.textContent = '✓ Copiado';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = original; btn.classList.remove('copied'); }, 1500);
  }
}
