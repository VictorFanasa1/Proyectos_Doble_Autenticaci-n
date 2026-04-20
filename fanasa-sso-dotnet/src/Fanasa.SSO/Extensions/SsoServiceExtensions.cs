using Fanasa.SSO.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Identity.Web;
using System.Security.Claims;

namespace Fanasa.SSO.Extensions;

public static class SsoServiceExtensions
{
    /// <summary>
    /// Registra la autenticación Fanasa SSO en la aplicación .NET.
    ///
    /// Uso en Program.cs:
    ///   builder.Services.AddFanasaSSO(builder.Configuration);
    /// </summary>
    public static IServiceCollection AddFanasaSSO(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var options = configuration
            .GetSection(SsoOptions.Section)
            .Get<SsoOptions>()
            ?? throw new InvalidOperationException(
                $"Falta la sección '{SsoOptions.Section}' en appsettings.json");

        services.Configure<SsoOptions>(configuration.GetSection(SsoOptions.Section));

        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddMicrosoftIdentityWebApi(
                jwtOptions =>
                {
                    jwtOptions.TokenValidationParameters.ValidAudiences =
                        options.ValidAudiences ?? [options.ClientId];
                },
                msOptions =>
                {
                    msOptions.TenantId = options.TenantId;
                    msOptions.ClientId = options.ClientId;
                });

        services.AddAuthorization();
        services.AddScoped<ISsoUserAccessor, SsoUserAccessor>();
        services.AddHttpContextAccessor();

        return services;
    }

    /// <summary>
    /// Activa el middleware de autenticación.
    ///
    /// Uso en Program.cs:
    ///   app.UseFanasaSSO();
    /// </summary>
    public static WebApplication UseFanasaSSO(this WebApplication app)
    {
        app.UseAuthentication();
        app.UseAuthorization();
        return app;
    }
}

// ─── Acceso al usuario autenticado desde cualquier servicio ────────────────

public interface ISsoUserAccessor
{
    SsoUser? GetCurrentUser();
}

public class SsoUserAccessor : ISsoUserAccessor
{
    private readonly IHttpContextAccessor _http;

    public SsoUserAccessor(IHttpContextAccessor http) => _http = http;

    public SsoUser? GetCurrentUser()
    {
        var user = _http.HttpContext?.User;
        if (user?.Identity?.IsAuthenticated != true) return null;

        return new SsoUser(
            Name:     user.FindFirst("name")?.Value              ?? string.Empty,
            Email:    user.FindFirst("preferred_username")?.Value ?? string.Empty,
            ObjectId: user.FindFirst("oid")?.Value               ?? string.Empty,
            TenantId: user.FindFirst("tid")?.Value               ?? string.Empty,
            Roles:    user.FindAll(ClaimTypes.Role)
                          .Select(c => c.Value)
                          .ToList()
                          .AsReadOnly()
        );
    }
}
