namespace Fanasa.SSO.Core
{
    public class SsoOptions
    {
        public const string Section = "FanasaSSO";

        /// <summary>Client ID del App Registration en Azure AD (ej: e9315c81-...)</summary>
        public string ClientId { get; set; } = string.Empty;

        /// <summary>Tenant ID de Azure AD (ej: 08a4f0b0-...)</summary>
        public string TenantId { get; set; } = string.Empty;

        /// <summary>URL del SSO de Fanasa (ej: https://aplicacion.fanasa.com/SSO)</summary>
        public string SsoUrl { get; set; } = string.Empty;

        /// <summary>Nombre de la app — aparece en la pantalla de login (opcional)</summary>
        public string ClientName { get; set; } = string.Empty;

        /// <summary>Audiences válidas. Por defecto se usa ClientId.</summary>
        public string[] ValidAudiences { get; set; } = null;
    }
}
