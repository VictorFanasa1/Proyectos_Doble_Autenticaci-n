# @fanasa/sso — Guía para Angular 8–13 (legacy)

Usa `@fanasa/sso/angular-legacy` si tu proyecto corre en **Angular 8, 9, 10, 11, 12 o 13**.

Para Angular 14 o superior usa [`@fanasa/sso/angular`](angular.md).

---

## Diferencias con la versión moderna

| | `@fanasa/sso/angular` (14+) | `@fanasa/sso/angular-legacy` (8–13) |
|---|---|---|
| Guard | Función `CanActivateFn` | Clase con `canActivate()` |
| Registro | `provideFanasaSSO()` en providers | igual + `FanasaSSOGuard` en providers |
| `inject()` | Sí | No (usar constructor) |

---

## Instalación

```bash
npm install @fanasa/sso
```

## 1. Registrar en AppModule

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { provideFanasaSSO } from '@fanasa/sso/angular-legacy';

@NgModule({
  providers: [
    ...provideFanasaSSO({
      ssoUrl:     'https://aplicacion.fanasa.com/SSO',
      clientName: 'Mi App Angular',
    }),
  ],
})
export class AppModule {}
```

## 2. Botón de login en un componente

```typescript
// login.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FanasaSSOService } from '@fanasa/sso/angular-legacy';

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
  loading = false;
  error: string | null = null;

  // Constructor injection — compatible con Angular 8+
  constructor(
    private sso: FanasaSSOService,
    private router: Router,
  ) {}

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
import { Component } from '@angular/core';
import { FanasaSSOService } from '@fanasa/sso/angular-legacy';

@Component({
  selector: 'app-header',
  template: `
    <nav *ngIf="sso.isAuthenticated()">
      <span>{{ sso.getUser()?.name }}</span>
      <button (click)="sso.logout()">Cerrar sesión</button>
    </nav>
  `,
})
export class HeaderComponent {
  constructor(public sso: FanasaSSOService) {}
}
```

## 4. Proteger rutas con Guard (clase)

```typescript
// app-routing.module.ts
import { FanasaSSOGuard } from '@fanasa/sso/angular-legacy';

const routes: Routes = [
  { path: 'login',     component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [FanasaSSOGuard] },
  { path: 'reportes',  component: ReportesComponent,  canActivate: [FanasaSSOGuard] },
];

// El guard se registra automáticamente con provideFanasaSSO()
// No necesitas agregar nada más en providers.
```

## 5. Alternativa — patrón forRoot() (Angular 8-13)

Si prefieres el patrón de módulo clásico:

```typescript
// app.module.ts
import { FanasaSSOModule } from '@fanasa/sso/angular-legacy';

@NgModule({
  imports: [
    FanasaSSOModule.forRoot({
      ssoUrl:     'https://aplicacion.fanasa.com/SSO',
      clientName: 'Mi App',
    }),
  ],
})
export class AppModule {}
```

## Referencia rápida

| Método | Descripción |
|---|---|
| `loginPopup()` | Abre popup, devuelve `Promise<SSOToken>` |
| `loginRedirect()` | Redirige la página al SSO |
| `handleRedirectCallback()` | Lee token del hash al regresar de redirect |
| `isAuthenticated()` | `true` si hay sesión activa y no expirada |
| `getUser()` | `{ name, email, objectId, tenantId, roles }` |
| `getToken()` | Token completo |
| `logout()` | Cierra sesión local |
