// ─────────────────────────────────────────────────────────────────────────────
//  FANASA SSO — Validación en backend .NET
//  Paquete requerido: Microsoft.Identity.Web  (ya incluido en .NET 6+)
// ─────────────────────────────────────────────────────────────────────────────

// Program.cs — configuración única al arrancar la API
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true, // firma criptográfica
        };
    },
    msOptions =>
    {
        msOptions.TenantId = "TU_TENANT_ID";
        msOptions.ClientId = "TU_CLIENT_ID";
    });

builder.Services.AddAuthorization();

// ─── En cada controller que quieras proteger ──────────────────────────────

[Authorize]                    // ← solo esto, .NET valida el token automáticamente
[ApiController]
[Route("api/[controller]")]
public class ProductosController : ControllerBase
{
    [HttpGet]
    public IActionResult GetProductos()
    {
        // El token ya fue validado por el middleware.
        // Aquí puedes leer los claims del usuario:
        var nombre   = User.FindFirst("name")?.Value;
        var email    = User.FindFirst("preferred_username")?.Value;
        var objectId = User.FindFirst("oid")?.Value;

        return Ok(new { nombre, email });
    }
}

// ─── El cliente Angular/React envía el token en cada petición ────────────
//
//  fetch('https://api.fanasa.com/api/productos', {
//    headers: {
//      'Authorization': `Bearer ${sessionStorage.getItem('id_token')}`
//    }
//  });
