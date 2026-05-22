using Fanasa.SSO.Core;
using System;
using System.IO;
using System.Reflection;
using System.Security.Principal;
using System.Web;

namespace Fanasa.SSO.AspNet
{
    /// <summary>
    /// HTTP Module para ASP.NET (MVC 4/5, Web Forms — .NET 4.0 a 4.8).
    ///
    /// Hace dos cosas:
    ///   1. Sirve el fanasa-sso.js embebido en /fanasa-sso/script
    ///   2. Lee el Bearer token del header Authorization, decodifica los claims
    ///      y llena HttpContext.Current.User
    ///
    /// Registro en web.config:
    ///   &lt;system.webServer&gt;
    ///     &lt;modules&gt;
    ///       &lt;add name="FanasaSSOModule" type="Fanasa.SSO.AspNet.FanasaSSOModule, Fanasa.SSO" /&gt;
    ///     &lt;/modules&gt;
    ///   &lt;/system.webServer&gt;
    /// </summary>
    public class FanasaSSOModule : IHttpModule
    {
        private const string ScriptPath = "/fanasa-sso/script";

        public void Init(HttpApplication context)
        {
            context.BeginRequest    += OnBeginRequest;
            context.AuthorizeRequest += OnAuthorizeRequest;
        }

        // ─── Servir el JS embebido ─────────────────────────────────────────────

        private static void OnBeginRequest(object sender, EventArgs e)
        {
            var app  = (HttpApplication)sender;
            var path = app.Request.AppRelativeCurrentExecutionFilePath;

            if (!path.Equals("~" + ScriptPath, StringComparison.OrdinalIgnoreCase))
                return;

            app.Response.ContentType = "application/javascript; charset=utf-8";
            app.Response.Cache.SetCacheability(HttpCacheability.Public);
            app.Response.Cache.SetMaxAge(TimeSpan.FromHours(1));

            using (var stream = GetScriptStream())
            using (var reader = new StreamReader(stream))
            {
                app.Response.Write(reader.ReadToEnd());
            }

            app.Response.End();
        }

        // ─── Validar Bearer token y poblar User ───────────────────────────────
        // Nota: decodifica claims del JWT sin validar firma.
        // La firma la valida Microsoft en el momento del login — el token llega
        // firmado desde Azure AD a través del SSO. Para validación adicional
        // de firma en el servidor, usa un proyecto .NET 6/8 con AddFanasaSSO().

        private static void OnAuthorizeRequest(object sender, EventArgs e)
        {
            var app  = (HttpApplication)sender;
            var auth = app.Request.Headers["Authorization"];

            if (string.IsNullOrEmpty(auth) || !auth.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                return;

            var token = auth.Substring(7).Trim();
            if (string.IsNullOrEmpty(token)) return;

            try
            {
                var user     = JwtDecoder.DecodeUser(token);
                var identity = new GenericIdentity(user.Email, "FanasaSSO");
                var roles    = new string[user.Roles.Count];
                user.Roles.CopyTo(roles, 0);
                app.Context.User = new GenericPrincipal(identity, roles);
            }
            catch
            {
                // Token inválido — no autenticar
            }
        }

        private static Stream GetScriptStream()
        {
            var assembly = Assembly.GetExecutingAssembly();
            return assembly.GetManifestResourceStream("Fanasa.SSO.Resources.fanasa-sso.js");
        }

        public void Dispose() { }
    }
}
