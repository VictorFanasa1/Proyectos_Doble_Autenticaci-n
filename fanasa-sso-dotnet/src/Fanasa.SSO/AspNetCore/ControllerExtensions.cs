using Fanasa.SSO.Core;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Fanasa.SSO.AspNetCore
{
    /// <summary>
    /// Extensión para obtener el usuario desde un Controller.
    ///
    /// Uso:
    ///   [Authorize]
    ///   public IActionResult Dashboard() {
    ///     var user = this.GetSsoUser();
    ///     return View(user);
    ///   }
    /// </summary>
    public static class ControllerExtensions
    {
        public static SsoUser? GetSsoUser(this ControllerBase controller)
        {
            var claims = controller.User;
            if (claims?.Identity?.IsAuthenticated != true) return null;

            return new SsoUser
            {
                Name     = claims.FindFirst("name")?.Value              ?? string.Empty,
                Email    = claims.FindFirst("preferred_username")?.Value ?? string.Empty,
                ObjectId = claims.FindFirst("oid")?.Value               ?? string.Empty,
                TenantId = claims.FindFirst("tid")?.Value               ?? string.Empty,
                Roles    = claims.FindAll(ClaimTypes.Role)
                                 .Select(c => c.Value)
                                 .ToList(),
            };
        }
    }
}
