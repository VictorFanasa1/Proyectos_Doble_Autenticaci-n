# Fanasa SSO — Reporte Técnico y Propuesta de SDK Multi-plataforma

> **Proyecto:** Sistema de Autenticación Centralizada (Single Sign-On)
> **Tecnología base:** Microsoft Entra ID (Azure Active Directory)
> **Estado actual:** Fase 1 completada y desplegada en producción
> **Fecha:** Abril 2026

---

## 1. Problema que resuelve

Actualmente cada proyecto de Fanasa (CRM, ERP, portales, apps móviles) implementa su propio login de forma independiente. Esto genera:

- **Duplicación de código** de autenticación en cada proyecto
- **Experiencia inconsistente** para el usuario (distintas pantallas de login)
- **Riesgo de seguridad** — cada equipo configura Azure AD de forma diferente
- **Mantenimiento costoso** — un cambio de política de seguridad obliga a tocar todos los proyectos
- **Tiempo de desarrollo** — cada proyecto nuevo tarda días en implementar auth desde cero

---

## 2. Solución implementada — Fanasa SSO

Un **portal de login centralizado** que funciona para todos los proyectos de la organización. Cada proyecto redirige al SSO, el usuario se autentica una sola vez con su cuenta corporativa de Microsoft, y el SSO devuelve el token al proyecto que lo llamó.

### URL en producción

```
https://aplicacion.fanasa.com/SSO/
```

### ¿Cómo lo usa un proyecto nuevo?

Solo necesita abrir esta URL con su `redirect_uri`:

```
https://aplicacion.fanasa.com/SSO/login
  ?redirect_uri=https://mi-proyecto.fanasa.com/inicio
  &client_name=Nombre del Proyecto
```

**No requiere instalar librerías. No requiere configurar Azure AD por separado. Solo una URL.**

---

## 3. Arquitectura técnica

### Stack

| Componente | Tecnología |
|---|---|
| SSO App | Angular 15 + MSAL (Microsoft Authentication Library) |
| Proveedor de identidad | Microsoft Entra ID (Azure AD) |
| Protocolo | OAuth 2.0 + OpenID Connect |
| Despliegue | https://aplicacion.fanasa.com/SSO/ |

### Flujo de autenticación

```
┌─────────────────┐        ┌──────────────────────┐        ┌─────────────────────┐
│  Proyecto       │        │  Fanasa SSO           │        │  Microsoft Entra ID │
│  Cliente        │        │  (este proyecto)      │        │  (Azure AD)         │
└────────┬────────┘        └──────────┬───────────┘        └──────────┬──────────┘
         │                            │                                │
         │  1. Abre popup SSO         │                                │
         │  con redirect_uri ────────►│                                │
         │                            │  2. loginRedirect()            │
         │                            │──────────────────────────────►│
         │                            │                                │
         │                            │  3. Usuario ingresa            │
         │                            │     credenciales corporativas  │
         │                            │◄──────────────────────────────│
         │                            │                                │
         │                            │  4. Auth code → /auth/callback │
         │  5. postMessage(id_token)  │                                │
         │◄───────────────────────────│                                │
         │                            │                                │
         │  6. Popup se cierra solo   │                                │
         │  App recibe el token       │                                │
```

### Modos de entrega del token

| Modo | Cuándo se usa | Cómo recibe el token el cliente |
|---|---|---|
| **Popup** | App web (Angular, React, etc.) | `window.addEventListener('message')` |
| **Redirect** | Apps sin soporte de popups | Hash en la URL (`#id_token=xxx`) |

### Seguridad

- El token viaja en el **fragment** (`#`) de la URL, nunca en query string — no llega al servidor
- Validación **client-side**: expiración, issuer de Microsoft, tenant y audience
- Validación **server-side** (backend): firma RSA con llaves públicas de Microsoft (JWKS)
- El `redirect_uri` de cada proyecto debe estar registrado en Azure AD — control centralizado

---

## 4. Estado actual — Fase 1 ✅

### Lo que ya está funcionando

- [x] Portal de login desplegado en `https://aplicacion.fanasa.com/SSO/`
- [x] Autenticación con Microsoft Entra ID (cuenta corporativa)
- [x] Entrega de token por popup + postMessage
- [x] Entrega de token por redirect + hash fragment
- [x] Detección automática del modo (popup vs redirect)
- [x] Un solo App Registration en Azure AD para todos los proyectos
- [x] Pantalla de login con nombre del proyecto cliente configurable
- [x] Manejo de errores (parámetros faltantes, token inválido, popup bloqueado)

### Integración actual (3 líneas de código por proyecto)

```javascript
// Abrir el SSO
window.open(
  'https://aplicacion.fanasa.com/SSO/login?redirect_uri=https://mi-proyecto.com&client_name=Mi Proyecto',
  'sso', 'width=480,height=620'
);

// Recibir el token
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://aplicacion.fanasa.com') return;
  const { id_token } = event.data.payload;
  // usuario autenticado
});
```

---

## 5. Propuesta — Fase 2: SDK Multi-plataforma `@fanasa/sso`

### El problema de la integración manual

Aunque el SSO ya funciona con las 3 líneas de código mostradas, cada proyecto todavía necesita:

- Escribir el `window.open()` con los parámetros correctos
- Manejar el evento `postMessage` con la validación de origen
- Gestionar el almacenamiento del token (sessionStorage)
- Implementar la lógica de "¿está autenticado?"
- Manejar la expiración del token
- Decodificar el JWT para obtener nombre/email del usuario

Esto genera inconsistencias entre proyectos y bugs repetibles.

### La solución: un paquete npm privado

```bash
npm install @fanasa/sso
```

### API propuesta por plataforma

#### Angular

```typescript
// app.module.ts — una sola vez
imports: [
  FanasaSSOModule.forRoot({ ssoUrl: 'https://aplicacion.fanasa.com/SSO' })
]

// En cualquier componente
constructor(private sso: FanasaSSOService) {}

async login() {
  await this.sso.loginPopup();
  const user = this.sso.getUser();
  console.log(user.name, user.email);
}
```

#### React

```tsx
const { user, isAuthenticated, loginPopup } = useFanasaSSO({
  ssoUrl: 'https://aplicacion.fanasa.com/SSO'
});

return isAuthenticated
  ? <p>Hola {user.name}</p>
  : <button onClick={() => loginPopup()}>Iniciar sesión</button>;
```

#### Vanilla JavaScript (cualquier proyecto)

```javascript
import { FanasaSSO } from '@fanasa/sso';

const sso = new FanasaSSO({ ssoUrl: 'https://aplicacion.fanasa.com/SSO' });
const token = await sso.loginPopup();
const user  = sso.getUser(); // { name, email, objectId, tenantId }
```

### Plataformas en el roadmap del SDK

| Plataforma | Paquete | Estado |
|---|---|---|
| Angular | `@fanasa/sso/angular` | Desarrollado, pendiente publicar |
| React | `@fanasa/sso/react` | Desarrollado, pendiente publicar |
| Vanilla JS | `@fanasa/sso` | Desarrollado, pendiente publicar |
| Android | AAR en Maven privado | Por desarrollar |
| iOS | Swift Package (SPM) | Por desarrollar |
| .NET | NuGet privado | Por desarrollar |

### Funcionalidades incluidas en el SDK

| Funcionalidad | Sin SDK | Con SDK |
|---|---|---|
| Abrir popup del SSO | Manual | `sso.loginPopup()` |
| Redirect de página completa | Manual | `sso.loginRedirect()` |
| Recibir token (postMessage) | Manual | Automático |
| Validar origen del mensaje | Manual | Automático |
| Guardar token en sesión | Manual | Automático |
| Verificar si está autenticado | Manual | `sso.isAuthenticated()` |
| Obtener datos del usuario | Manual | `sso.getUser()` |
| Manejar expiración del token | Manual | Automático |
| Guard de rutas (Angular) | Manual | `FanasaSSOGuard` |
| Hook de estado (React) | Manual | `useFanasaSSO()` |

---

## 6. Registro en Azure AD — proceso por proyecto nuevo

Para agregar un proyecto nuevo al SSO, solo se necesita **un paso en Azure AD**:

```
Azure Portal
→ Microsoft Entra ID
→ App registrations
→ Fanasa SSO (app compartida)
→ Authentication
→ Redirect URIs
→ + Agregar URI del nuevo proyecto
```

**Tiempo estimado:** 2 minutos por proyecto nuevo.
**Sin cambios en el código del SSO.**

---

## 7. Comparativa — antes vs después

| Aspecto | Antes (sin SSO) | Después (con SSO) |
|---|---|---|
| Tiempo de impl. de auth en proyecto nuevo | 2-5 días | 30 minutos |
| Configuración de Azure AD por proyecto | Independiente (riesgo de error) | Centralizada |
| Experiencia de login para el usuario | Diferente en cada app | Uniforme |
| Cambios de política de seguridad | Tocar todos los proyectos | Solo el SSO |
| Soporte de plataformas | Por proyecto | Angular, React, Android, iOS, .NET |
| Mantenimiento de credenciales | Distribuido | Centralizado |

---

## 8. Roadmap

### Fase 1 — Completada ✅
- SSO app desplegada en producción
- Soporte para Angular y cualquier JS via popup/redirect
- Integración manual documentada

### Fase 2 — Propuesta (próximas 4-6 semanas)
- Publicar paquete `@fanasa/sso` en registry privado (Azure Artifacts)
- Adaptadores para Angular y React listos (ya desarrollados)
- Documentación de integración para equipos
- Incorporar primeros 2-3 proyectos piloto

### Fase 3 — Futuro
- SDK Android (AAR)
- SDK iOS (Swift Package Manager)
- SDK .NET (NuGet)
- Dashboard de administración (qué proyectos usan el SSO, últimos logins)
- Soporte de roles y permisos por proyecto desde Azure AD

---

## 9. Inversión estimada

### Fase 2 (SDK web + publicación)

| Actividad | Estimado |
|---|---|
| Configurar Azure Artifacts (registry privado) | 2-4 horas |
| Pruebas e integración con proyectos piloto | 1-2 días |
| Documentación para desarrolladores | 1 día |
| **Total Fase 2** | **~3-4 días** |

### Fase 3 (SDKs nativos)

| SDK | Estimado |
|---|---|
| Android (AAR) | 3-5 días |
| iOS (Swift Package) | 3-5 días |
| .NET (NuGet) | 2-3 días |
| **Total Fase 3** | **~10-15 días** |

---

## 10. Conclusión

El **Fanasa SSO** resuelve el problema de autenticación duplicada en todos los proyectos de la organización con un enfoque estándar de la industria (OAuth 2.0 / OpenID Connect sobre Microsoft Entra ID).

La **Fase 1 ya está en producción** y funciona. La **Fase 2 (SDK npm)** convierte la integración de días a minutos, y la **Fase 3** extiende el beneficio a proyectos móviles y .NET.

**El SSO es infraestructura compartida — se desarrolla una vez y beneficia a todos los proyectos actuales y futuros de Fanasa.**

---

*Documento generado el 16 de abril de 2026*
*Repositorio: `c:\Fanasa\SSO\fanasa-sso`*
