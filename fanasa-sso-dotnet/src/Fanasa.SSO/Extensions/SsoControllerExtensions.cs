using Fanasa.SSO.Models;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Fanasa.SSO.Extensions;

/// <summary>
/// Extensiones para obtener el usuario desde un Controller.
///
/// Uso:
///   public IActionResult MiEndpoint() {
///     var user = this.GetSsoUser();
///   }
/// </summary>
public static class SsoControllerExtensions
{
    public static SsoUser? GetSsoUser(this ControllerBase controller)
    {
        var claims = controller.User;
        if (claims?.Identity?.IsAuthenticated != true) return null;

        return new SsoUser(
            Name:     claims.FindFirst("name")?.Value              ?? string.Empty,
            Email:    claims.FindFirst("preferred_username")?.Value ?? string.Empty,
            ObjectId: claims.FindFirst("oid")?.Value               ?? string.Empty,
            TenantId: claims.FindFirst("tid")?.Value               ?? string.Empty,
            Roles:    claims.FindAll(ClaimTypes.Role)
                            .Select(c => c.Value)
                            .ToList()
                            .AsReadOnly()
        );
    }
}
