using Fanasa.SSO.Core;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Identity.Web;
using System.IO;
using System.Reflection;
using System.Security.Claims;

namespace Fanasa.SSO.AspNetCore
{
    public static class ServiceExtensions
    {
        /// <summary>
        /// Registra autenticación Fanasa SSO + sirve el fanasa-sso.js embebido.
        ///
        /// Uso en Program.cs:
        ///   builder.Services.AddFanasaSSO(builder.Configuration);
        ///   // appsettings.json → sección "FanasaSSO": { ClientId, TenantId, SsoUrl }
        /// </summary>
        public static IServiceCollection AddFanasaSSO(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            var options = configuration
                .GetSection(SsoOptions.Section)
                .Get<SsoOptions>()
                ?? throw new InvalidOperationException(
                    $"Falta la sección '{SsoOptions.Section}' en appsettings.json. " +
                    "Agrega: { \"FanasaSSO\": { \"ClientId\": \"...\", \"TenantId\": \"...\", \"SsoUrl\": \"...\" } }");

            services.Configure<SsoOptions>(configuration.GetSection(SsoOptions.Section));

            services
                .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddMicrosoftIdentityWebApi(
                    jwtOptions =>
                    {
                        jwtOptions.TokenValidationParameters.ValidAudiences =
                            options.ValidAudiences ?? new[] { options.ClientId };
                    },
                    msOptions =>
                    {
                        msOptions.TenantId = options.TenantId;
                        msOptions.ClientId = options.ClientId;
                    });

            services.AddAuthorization();
            services.AddHttpContextAccessor();
            services.AddScoped<ISsoUserAccessor, SsoUserAccessor>();

            return services;
        }

        /// <summary>
        /// Activa autenticación + sirve /fanasa-sso/script.
        ///
        /// Uso en Program.cs:
        ///   app.UseFanasaSSO();
        /// </summary>
        public static WebApplication UseFanasaSSO(this WebApplication app)
        {
            // Sirve el JavaScript embebido
            app.Map("/fanasa-sso/script", scriptApp =>
            {
                scriptApp.Run(async ctx =>
                {
                    ctx.Response.ContentType = "application/javascript; charset=utf-8";
                    ctx.Response.Headers["Cache-Control"] = "public, max-age=3600";

                    var assembly   = Assembly.GetExecutingAssembly();
                    var streamName = "Fanasa.SSO.Resources.fanasa-sso.js";
                    await using var stream = assembly.GetManifestResourceStream(streamName);
                    await stream!.CopyToAsync(ctx.Response.Body);
                });
            });

            app.UseAuthentication();
            app.UseAuthorization();

            return app;
        }
    }

    // ─── Acceso al usuario desde cualquier servicio ────────────────────────────

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

            return new SsoUser
            {
                Name     = user.FindFirst("name")?.Value              ?? string.Empty,
                Email    = user.FindFirst("preferred_username")?.Value ?? string.Empty,
                ObjectId = user.FindFirst("oid")?.Value               ?? string.Empty,
                TenantId = user.FindFirst("tid")?.Value               ?? string.Empty,
                Roles    = user.FindAll(ClaimTypes.Role)
                               .Select(c => c.Value)
                               .ToList(),
            };
        }
    }
}
