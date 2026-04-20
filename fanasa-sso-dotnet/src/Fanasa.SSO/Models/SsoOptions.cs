namespace Fanasa.SSO.Models;

public class SsoOptions
{
    public const string Section = "FanasaSSO";

    /// <summary>Client ID del App Registration en Azure AD</summary>
    public string ClientId { get; set; } = string.Empty;

    /// <summary>Tenant ID de Azure AD</summary>
    public string TenantId { get; set; } = string.Empty;

    /// <summary>Audiences válidas para el token (por defecto = ClientId)</summary>
    public IEnumerable<string>? ValidAudiences { get; set; }
}
