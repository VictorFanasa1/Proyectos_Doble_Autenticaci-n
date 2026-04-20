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
        scopes: ['openid', 'profile'],
        // ⚠️ Aquí va la URL del SSO, NO la del cliente.
        // Microsoft mandará el auth code de vuelta al SSO.
        // El SSO luego redirige al cliente con el token.
        redirectUri: `${window.location.origin}${environment.baseHref}auth/callback`,
      });
    } catch (e: any) {
      this.error   = 'Error al iniciar sesión con Microsoft. Por favor intenta de nuevo.';
      this.loading = false;
      console.error('[SSO] loginRedirect error:', e);
    }
  }
}