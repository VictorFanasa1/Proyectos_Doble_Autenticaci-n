# @fanasa/sso — Guía de integración .NET

En .NET no se usa el paquete npm. La integración depende del tipo de app:

| Tipo de app | Integración |
|---|---|
| **Blazor WebAssembly** | JS Interop — llama al SSO desde C# |
| **ASP.NET MVC / Razor** | JavaScript en la vista + validación en el backend |
| **API REST (.NET)** | Solo valida el token recibido del frontend |
| **WPF / WinForms** | Abre el navegador del sistema con la URL del SSO |

---

## Opción A — API REST: validar el token (más común)

El frontend (Angular, React, etc.) ya autenticó al usuario con el SSO y envía el token en cada petición. El backend .NET solo valida.

### Instalar el paquete NuGet

```bash
dotnet add package Microsoft.Identity.Web
```

### Configurar en `Program.cs`

```csharp
using Microsoft.Identity.Web;
using Microsoft.AspNetCore.Authentication.JwtBearer;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(options => { },
    msOptions =>
    {
        msOptions.TenantId = "TU_TENANT_ID";
        msOptions.ClientId = "TU_CLIENT_ID";
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();

var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
```

### Proteger un controller

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProductosController : ControllerBase
{
    [HttpGet]
    public IActionResult GetProductos()
    {
        // Claims disponibles tras validar el token
        var nombre   = User.FindFirst("name")?.Value;
        var email    = User.FindFirst("preferred_username")?.Value;
        var objectId = User.FindFirst("oid")?.Value;

        return Ok(new { nombre, email, objectId });
    }
}
```

### `appsettings.json`

```json
{
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "TU_TENANT_ID",
    "ClientId": "TU_CLIENT_ID"
  }
}
```

---

## Opción B — Blazor WebAssembly (JS Interop)

Blazor corre en el browser, por lo que puede usar el SSO via JavaScript.

### `wwwroot/sso-interop.js`

```javascript
import { FanasaSSO } from 'https://cdn.fanasa.com/sso/latest/index.js';
// o bien instala @fanasa/sso via npm si usas webpack/vite en Blazor

const sso = new FanasaSSO({ ssoUrl: 'https://aplicacion.fanasa.com/SSO' });

window.FanasaSSOInterop = {
  loginPopup:       () => sso.loginPopup(),
  isAuthenticated:  () => sso.isAuthenticated(),
  getUser:          () => sso.getUser(),
  getIdToken:       () => sso.getToken()?.idToken ?? null,
  logout:           () => sso.logout(),
};
```

### Servicio C# que llama al JS

```csharp
// SsoService.cs
using Microsoft.JSInterop;

public class SsoService
{
    private readonly IJSRuntime _js;

    public SsoService(IJSRuntime js) => _js = js;

    public async Task LoginAsync()
        => await _js.InvokeVoidAsync("FanasaSSOInterop.loginPopup");

    public async Task<bool> IsAuthenticatedAsync()
        => await _js.InvokeAsync<bool>("FanasaSSOInterop.isAuthenticated");

    public async Task<SsoUser?> GetUserAsync()
        => await _js.InvokeAsync<SsoUser?>("FanasaSSOInterop.getUser");

    public async Task<string?> GetIdTokenAsync()
        => await _js.InvokeAsync<string?>("FanasaSSOInterop.getIdToken");

    public async Task LogoutAsync()
        => await _js.InvokeVoidAsync("FanasaSSOInterop.logout");
}

public record SsoUser(string Name, string Email, string ObjectId, string TenantId);
```

### Registrar en `Program.cs` (Blazor WASM)

```csharp
builder.Services.AddScoped<SsoService>();
```

### Usar en un componente Razor

```razor
@page "/login"
@inject SsoService Sso
@inject NavigationManager Nav

<button @onclick="Login" disabled="@loading">
    @(loading ? "Conectando..." : "Iniciar sesión con Microsoft")
</button>

@code {
    bool loading = false;

    async Task Login()
    {
        loading = true;
        await Sso.LoginAsync();
        var user = await Sso.GetUserAsync();
        if (user is not null) Nav.NavigateTo("/dashboard");
        loading = false;
    }
}
```

---

## Opción C — WPF / WinForms / Consola

Para apps de escritorio, se abre el navegador del sistema con la URL del SSO y se escucha el token via un servidor HTTP local.

```csharp
using System.Diagnostics;
using System.Net;

public class DesktopSsoClient
{
    private const string SsoUrl       = "https://aplicacion.fanasa.com/SSO";
    private const int    CallbackPort = 7777;

    public async Task<string> LoginAsync()
    {
        var redirectUri  = $"http://localhost:{CallbackPort}/callback";
        var loginUrl     = $"{SsoUrl}/login?redirect_uri={Uri.EscapeDataString(redirectUri)}&client_name=Mi App .NET";

        // Abrir el browser del sistema
        Process.Start(new ProcessStartInfo(loginUrl) { UseShellExecute = true });

        // Escuchar el callback con un servidor HTTP local
        using var listener = new HttpListener();
        listener.Prefixes.Add($"http://localhost:{CallbackPort}/");
        listener.Start();

        var context  = await listener.GetContextAsync();
        var fragment = context.Request.Url?.Fragment ?? "";

        // Responder al browser para cerrar la ventana
        var response = context.Response;
        var html     = "<html><body><script>window.close()</script><p>Puedes cerrar esta ventana.</p></body></html>";
        var bytes    = System.Text.Encoding.UTF8.GetBytes(html);
        await response.OutputStream.WriteAsync(bytes);
        response.Close();

        // Extraer el id_token del fragment (#id_token=xxx)
        var idToken = System.Web.HttpUtility.ParseQueryString(fragment.TrimStart('#'))["id_token"];
        return idToken ?? throw new Exception("No se recibió token del SSO");
    }
}
```

> **Nota:** Registra `http://localhost:7777/callback` en Azure AD como Redirect URI.
