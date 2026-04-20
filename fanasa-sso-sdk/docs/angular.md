# @fanasa/sso — Guía de integración Angular

## Instalación

```bash
npm install @fanasa/sso
```

## 1. Registrar el servicio

### AppModule (Angular 15)

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { provideFanasaSSO } from '@fanasa/sso/angular';

@NgModule({
  providers: [
    ...provideFanasaSSO({
      ssoUrl:     'https://aplicacion.fanasa.com/SSO',
      clientName: 'Nombre de mi App',
    }),
  ],
})
export class AppModule {}
```

### Standalone (Angular 16+)

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideFanasaSSO } from '@fanasa/sso/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    ...provideFanasaSSO({
      ssoUrl:     'https://aplicacion.fanasa.com/SSO',
      clientName: 'Mi App',
    }),
  ],
};
```

## 2. Botón de login

```typescript
// login.component.ts
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FanasaSSOService } from '@fanasa/sso/angular';

@Component({
  selector: 'app-login',
  template: `
    <button (click)="login()" [disabled]="loading">
      {{ loading ? 'Conectando...' : 'Iniciar sesión con Microsoft' }}
    </button>
    <p *ngIf="error" style="color:red">{{ error }}</p>
  `,
})
export class LoginComponent {
  private sso    = inject(FanasaSSOService);
  private router = inject(Router);

  loading = false;
  error: string | null = null;

  async login() {
    this.loading = true;
    this.error   = null;
    try {
      await this.sso.loginPopup();
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      this.error = e.message;
    } finally {
      this.loading = false;
    }
  }
}
```

## 3. Mostrar datos del usuario

```typescript
// header.component.ts
import { Component, inject } from '@angular/core';
import { FanasaSSOService } from '@fanasa/sso/angular';

@Component({
  selector: 'app-header',
  template: `
    <nav *ngIf="sso.isAuthenticated()">
      <span>{{ sso.getUser()?.name }}</span>
      <span>{{ sso.getUser()?.email }}</span>
      <button (click)="sso.logout()">Cerrar sesión</button>
    </nav>
  `,
})
export class HeaderComponent {
  sso = inject(FanasaSSOService);
}
```

## 4. Proteger rutas con Guard

```typescript
// app-routing.module.ts
import { fanasaSSOGuard } from '@fanasa/sso/angular';

const SSO_CONFIG = {
  ssoUrl:     'https://aplicacion.fanasa.com/SSO',
  clientName: 'Mi App',
};

const routes: Routes = [
  { path: 'login',     component: LoginComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [fanasaSSOGuard(SSO_CONFIG)],
  },
  {
    path: 'reportes',
    component: ReportesComponent,
    canActivate: [fanasaSSOGuard(SSO_CONFIG)],
  },
];
```

## 5. Enviar el token a tu API

```typescript
// api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FanasaSSOService } from '@fanasa/sso/angular';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private sso  = inject(FanasaSSOService);

  private get headers() {
    return new HttpHeaders({
      Authorization: `Bearer ${this.sso.getToken()?.idToken}`,
    });
  }

  getProductos() {
    return this.http.get('/api/productos', { headers: this.headers });
  }
}
```

## Referencia rápida

| Método | Descripción |
|---|---|
| `loginPopup()` | Abre popup, devuelve `Promise<SSOToken>` |
| `loginRedirect()` | Redirige la página al SSO |
| `handleRedirectCallback()` | Lee token del hash al regresar del redirect |
| `isAuthenticated()` | `true` si hay sesión activa y no expirada |
| `getUser()` | `{ name, email, objectId, tenantId, roles }` |
| `getToken()` | Token completo |
| `logout()` | Cierra sesión local |
