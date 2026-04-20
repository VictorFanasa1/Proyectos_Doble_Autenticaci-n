# Fanasa.SSO — SDK .NET

## Instalación

```bash
dotnet add package Fanasa.SSO
```

## Configuración (`appsettings.json`)

```json
{
  "FanasaSSO": {
    "ClientId": "TU_CLIENT_ID",
    "TenantId": "TU_TENANT_ID"
  }
}
```

## `Program.cs`

```csharp
using Fanasa.SSO.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddFanasaSSO(builder.Configuration);
builder.Services.AddControllers();

var app = builder.Build();
app.UseFanasaSSO();
app.MapControllers();
app.Run();
```

## Proteger un endpoint

```csharp
using Fanasa.SSO.Extensions;
using Microsoft.AspNetCore.Authorization;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProductosController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        var user = this.GetSsoUser();
        return Ok(new { user.Name, user.Email, user.Roles });
    }
}
```

## Inyectar el usuario en un servicio

```csharp
public class MiServicio
{
    private readonly ISsoUserAccessor _sso;

    public MiServicio(ISsoUserAccessor sso) => _sso = sso;

    public void Procesar()
    {
        var user = _sso.GetCurrentUser();
        Console.WriteLine($"Usuario: {user?.Name}");
    }
}
```

## Publicar como NuGet

```bash
dotnet pack -c Release
dotnet nuget push bin/Release/Fanasa.SSO.1.0.0.nupkg --source github
```
