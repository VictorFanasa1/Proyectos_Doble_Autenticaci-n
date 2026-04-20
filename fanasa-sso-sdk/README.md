# @fanasa/sso

SDK oficial de autenticación SSO de Fanasa para Microsoft Entra ID.

Permite que cualquier proyecto de la organización autentique usuarios con su cuenta corporativa de Microsoft en **menos de 10 minutos**, sin configurar Azure AD por separado.

---

## Compatibilidad de plataformas

| Plataforma | Método de integración | Guía |
|---|---|---|
| **Angular** | npm package `@fanasa/sso/angular` | [docs/angular.md](docs/angular.md) |
| **React** | npm package `@fanasa/sso/react` | [docs/react.md](docs/react.md) |
| **Vanilla JS / TS** | npm package `@fanasa/sso` | Ver abajo |
| **Oracle APEX** | JavaScript directo (sin npm) | [docs/oracle-apex.md](docs/oracle-apex.md) |
| **.NET** | JS Interop / Microsoft.Identity.Web | [docs/dotnet.md](docs/dotnet.md) |
| **Kotlin / Android** | Chrome Custom Tab + Deep Link | [docs/kotlin-android.md](docs/kotlin-android.md) |
| **Java Android** | Chrome Custom Tab + Deep Link | [docs/java.md](docs/java.md) |
| **Java Spring Boot** | Spring Security + Azure AD | [docs/java.md](docs/java.md) |

---

## Índice

- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Inicio rápido](#inicio-rápido)
- [Angular](#angular)
- [React](#react)
- [Vanilla JS / TypeScript](#vanilla-js--typescript)
- [API completa](#api-completa)
- [Validación del token en el backend](#validación-del-token-en-el-backend)
- [Registro de tu proyecto en Azure AD](#registro-de-tu-proyecto-en-azure-ad)

---

## Requisitos

- Node.js >= 16
- El URL de tu aplicación registrado en Azure AD (ver [Registro en Azure AD](#registro-de-tu-proyecto-en-azure-ad))

---

## Instalación

```bash
npm install @fanasa/sso
```

---

## Inicio rápido

El SSO funciona con un **popup** — se abre una ventana de login, el usuario se autentica con su cuenta Microsoft, y el popup se cierra devolviendo el token a tu app.

```javascript
import { FanasaSSO } from '@fanasa/sso';

const sso = new FanasaSSO({
  ssoUrl:     'https://aplicacion.fanasa.com/SSO',
  clientName: 'Mi Aplicación',
});

// Abrir login
const token = await sso.loginPopup();

// Datos del usuario
const user = sso.getUser();
console.log(user.name);  // "Juan Pérez"
console.log(user.email); // "juan.perez@fanasa.com"
```

---

## Angular

### 1. Registrar el módulo

```typescript
// app.module.ts
import { FanasaSSOModule } from '@fanasa/sso/angular';

@NgModule({
  imports: [
    FanasaSSOModule.forRoot({
      ssoUrl:     'https://aplicacion.fanasa.com/SSO',
      clientName: 'Mi App Angular',
    }),
  ],
})
export class AppModule {}
```

### 2. Usar el servicio en un componente

```typescript
// login.component.ts
import { Component } from '@angular/core';
import { FanasaSSOService } from '@fanasa/sso/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  template: `
    <button (click)="login()" [disabled]="loading">
      {{ loading ? 'Conectando...' : 'Iniciar sesión con Microsoft' }}
    </button>
    <p *ngIf="error">{{ error }}</p>
  `,
})
export class LoginComponent {
  loading = false;
  error: string | null = null;

  constructor(
    private sso: FanasaSSOService,
    private router: Router,
  ) {}

  async login() {
    this.loading = true;
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

### 3. Mostrar datos del usuario

```typescript
// header.component.ts
import { Component } from '@angular/core';
import { FanasaSSOService } from '@fanasa/sso/angular';

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

### 4. Proteger rutas con el Guard

```typescript
// app-routing.module.ts
import { FanasaSSOGuard } from '@fanasa/sso/angular';

const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [FanasaSSOGuard], // redirige al SSO si no está autenticado
  },
];
```

---

## React

### Hook `useFanasaSSO`

```tsx
// App.tsx
import { useFanasaSSO } from '@fanasa/sso/react';

const SSO_CONFIG = {
  ssoUrl:     'https://aplicacion.fanasa.com/SSO',
  clientName: 'Mi App React',
};

export function App() {
  const { user, isAuthenticated, loading, error, loginPopup, logout } =
    useFanasaSSO(SSO_CONFIG);

  if (!isAuthenticated) {
    return (
      <div>
        <button onClick={() => loginPopup()} disabled={loading}>
          {loading ? 'Conectando...' : 'Iniciar sesión con Microsoft'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <p>Hola, {user?.name}</p>
      <p>{user?.email}</p>
      <button onClick={logout}>Cerrar sesión</button>
    </div>
  );
}
```

### Proteger rutas (React Router)

```tsx
// ProtectedRoute.tsx
import { useFanasaSSO } from '@fanasa/sso/react';
import { Navigate } from 'react-router-dom';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loginPopup } = useFanasaSSO({
    ssoUrl: 'https://aplicacion.fanasa.com/SSO',
  });

  if (!isAuthenticated) {
    loginPopup();
    return null;
  }

  return <>{children}</>;
}

// App.tsx
<Route path="/dashboard" element={
  <ProtectedRoute><Dashboard /></ProtectedRoute>
} />
```

---

## Vanilla JS / TypeScript

Sin frameworks — funciona en cualquier proyecto web.

```typescript
import { FanasaSSO } from '@fanasa/sso';

const sso = new FanasaSSO({
  ssoUrl:     'https://aplicacion.fanasa.com/SSO',
  clientName: 'Mi Portal',
});

document.getElementById('btn-login')?.addEventListener('click', async () => {
  try {
    const token = await sso.loginPopup();
    const user  = sso.getUser();

    document.getElementById('nombre')!.textContent = user?.name ?? '';
    document.getElementById('email')!.textContent  = user?.email ?? '';
  } catch (e: any) {
    console.error('Error de login:', e.message);
  }
});

document.getElementById('btn-logout')?.addEventListener('click', () => {
  sso.logout();
  location.reload();
});
```

---

## API completa

### `new FanasaSSO(config)`

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `ssoUrl` | `string` | ✅ | URL del SSO de Fanasa |
| `clientName` | `string` | No | Nombre de tu app (aparece en la pantalla de login) |
| `popup.width` | `number` | No | Ancho del popup (default: 480) |
| `popup.height` | `number` | No | Alto del popup (default: 620) |

### Métodos

| Método | Retorno | Descripción |
|---|---|---|
| `loginPopup(redirectUri?)` | `Promise<SSOToken>` | Abre popup y espera el token |
| `loginRedirect(redirectUri?)` | `void` | Redirige la página al SSO |
| `handleRedirectCallback()` | `SSOToken \| null` | Lee token del hash al regresar de redirect |
| `isAuthenticated()` | `boolean` | Verifica si hay sesión activa y no expirada |
| `getToken()` | `SSOToken \| null` | Token completo almacenado |
| `getUser()` | `SSOUser \| null` | Datos del usuario decodificados del JWT |
| `logout()` | `void` | Elimina la sesión local |

### Tipos

```typescript
interface SSOUser {
  name:      string;   // Nombre completo
  email:     string;   // preferred_username de Azure AD
  objectId:  string;   // oid — ID único en Azure AD
  tenantId:  string;   // tid — ID del tenant
  roles:     string[]; // roles asignados en Azure AD
  expiresAt: Date;
  raw:       Record<string, any>; // todos los claims del JWT
}

interface SSOToken {
  idToken:     string;
  accessToken?: string;
  tokenType:   string;
  expiresAt:   number;  // timestamp en ms
  scope:       string;
}
```

---

## Validación del token en el backend

El token debe validarse en el servidor en cada llamada a la API.

### .NET (recomendado para APIs Fanasa)

```csharp
// Program.cs
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(options => {},
    msOptions => {
        msOptions.TenantId = "TU_TENANT_ID";
        msOptions.ClientId = "TU_CLIENT_ID";
    });

// En tu controller
[Authorize]
[HttpGet("datos")]
public IActionResult GetDatos()
{
    var nombre = User.FindFirst("name")?.Value;
    var email  = User.FindFirst("preferred_username")?.Value;
    return Ok(new { nombre, email });
}
```

### Enviar el token desde el cliente

```typescript
const token = sso.getToken();

fetch('https://mi-api.fanasa.com/datos', {
  headers: {
    'Authorization': `Bearer ${token?.idToken}`,
  },
});
```

---

## Registro de tu proyecto en Azure AD

**Una sola vez por proyecto nuevo.** Contacta al equipo de infraestructura o hazlo tú mismo:

```
Azure Portal
→ Microsoft Entra ID
→ App registrations
→ Fanasa SSO (la app compartida)
→ Authentication
→ Redirect URIs
→ + Agregar la URL de tu proyecto
```

### URLs a registrar

| Entorno | URL a registrar |
|---|---|
| Desarrollo | `http://localhost:PUERTO` |
| QA / Staging | `https://qa.mi-proyecto.fanasa.com` |
| Producción | `https://mi-proyecto.fanasa.com` |

---

## Soporte

¿Problemas con la integración? Contacta al equipo de arquitectura de Fanasa.
