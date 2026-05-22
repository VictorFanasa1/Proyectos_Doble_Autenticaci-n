using Fanasa.SSO.Core;

namespace Fanasa.SSO.AspNet
{
    /// <summary>
    /// Configuración global del SSO para proyectos System.Web.
    /// Llama a FanasaSSOConfig.Initialize() en Application_Start del Global.asax.
    /// </summary>
    public static class FanasaSSOConfig
    {
        public static SsoOptions Current { get; private set; }

        /// <summary>
        /// Inicializa el SDK.
        ///
        /// Uso en Global.asax.cs → Application_Start:
        ///   FanasaSSOConfig.Initialize(new SsoOptions {
        ///     SsoUrl:    "https://aplicacion.fanasa.com/SSO",
        ///     ClientId:  "TU_CLIENT_ID",
        ///     TenantId:  "TU_TENANT_ID",
        ///     ClientName: "Mi App"
        ///   });
        /// </summary>
        public static void Initialize(SsoOptions options)
        {
            Current = options;
        }
    }
}
