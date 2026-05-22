import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MsalService } from '@azure/msal-angular';

import { AuthConfigService } from '../../services/auth-config.service';
import { SsoConfig } from '../../models/sso-config.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  config: SsoConfig | null = null;
  error: string | null = null;
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private authConfigService: AuthConfigService,
    private msalService: MsalService
  ) {}

  ngOnInit(): void {
    // Fallback defensivo:
    // si Microsoft regresó por error a /login con code/hash de OAuth,
    // reenviar al callback real para que se haga el canje y la entrega al consumer.
    if (this.hasAuthResponseInUrl()) {
      window.location.replace(
        `${environment.baseHref}auth/callback${window.location.search}${window.location.hash}`
      );
      return;
    }

    const queryParams = this.route.snapshot.queryParamMap;

    try {
      this.config = this.authConfigService.parseFromUrl({
        redirect_uri: queryParams.get('redirect_uri'),
        client_name:  queryParams.get('client_name'),
      });
    } catch (e: any) {
      this.error = e.message;
    }
  }

  async login(): Promise<void> {
    if (!this.config) return;

    this.loading = true;
    this.error   = null;

    try {
      await this.msalService.instance.loginRedirect({
        scopes:      ['openid', 'profile'],
        redirectUri: environment.redirectUri,   // definido en environment.ts / environment.prod.ts
      });
    } catch (e: any) {
      this.error   = 'Error al iniciar sesión con Microsoft. Por favor intenta de nuevo.';
      this.loading = false;
      console.error('[SSO] loginRedirect error:', e);
    }
  }

  private hasAuthResponseInUrl(): boolean {
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash;
    const query = window.location.search.startsWith('?')
      ? window.location.search.slice(1)
      : window.location.search;

    const authPattern = /(?:^|[&])(code|id_token|access_token|error)=/;
    return authPattern.test(hash) || authPattern.test(query);
  }
}
