using Fanasa.SSO.Core;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Microsoft.Extensions.Options;

namespace Fanasa.SSO.AspNetCore
{
    /// <summary>
    /// TagHelper para Razor Pages y ASP.NET Core MVC.
    ///
    /// Registro en _ViewImports.cshtml:
    ///   @addTagHelper *, Fanasa.SSO
    ///
    /// Uso en cualquier .cshtml:
    ///   <fanasa-login />
    ///   <fanasa-login button-text="Entrar" redirect-uri="https://mi-app.com" />
    /// </summary>
    [HtmlTargetElement("fanasa-login")]
    public class FanasaSSOTagHelper : TagHelper
    {
        private readonly SsoOptions _options;

        public FanasaSSOTagHelper(IOptions<SsoOptions> options)
        {
            _options = options.Value;
        }

        /// <summary>Texto del botón. Por defecto: "Iniciar sesión con Microsoft"</summary>
        public string ButtonText { get; set; } = "Iniciar sesión con Microsoft";

        /// <summary>Clase CSS del botón.</summary>
        public string ButtonClass { get; set; } = "fanasa-sso-btn";

        /// <summary>
        /// URI a donde el SSO regresará el token.
        /// Por defecto: origen de la página actual (window.location.origin).
        /// </summary>
        public string? RedirectUri { get; set; }

        public override void Process(TagHelperContext context, TagHelperOutput output)
        {
            output.TagName = null; // El TagHelper no genera un tag wrapper

            var ssoUrl      = _options.SsoUrl     ?? string.Empty;
            var clientName  = _options.ClientName ?? string.Empty;
            var redirectUri = RedirectUri != null
                ? $"'{EscapeJs(RedirectUri)}'"
                : "window.location.origin";

            output.Content.SetHtmlContent($@"
<script src=""/fanasa-sso/script""></script>
<script>
  (function() {{
    var sso = new FanasaSSO({{
      ssoUrl:      '{EscapeJs(ssoUrl)}',
      redirectUri: {redirectUri},
      clientName:  '{EscapeJs(clientName)}'
    }});
    document.addEventListener('DOMContentLoaded', function() {{
      var btn = document.getElementById('fanasa-login-btn');
      if (!btn) return;
      btn.addEventListener('click', function() {{
        btn.disabled = true;
        btn.textContent = 'Conectando…';
        sso.loginPopup()
          .then(function(token) {{
            // Guarda el token como cookie para que el servidor lo lea
            document.cookie = 'fanasa_id_token=' + token.idToken + '; path=/; SameSite=Strict';
            window.location.reload();
          }})
          .catch(function(e) {{
            btn.disabled    = false;
            btn.textContent = '{EscapeJs(ButtonText)}';
            console.error('[FanasaSSO]', e.message);
          }});
      }});
    }});
  }})();
</script>
<button id=""fanasa-login-btn"" type=""button"" class=""{EscapeHtml(ButtonClass)}"">
  {EscapeHtml(ButtonText)}
</button>");
        }

        private static string EscapeJs(string s)   => s.Replace("'", "\\'").Replace("\n", "").Replace("\r", "");
        private static string EscapeHtml(string s) => System.Net.WebUtility.HtmlEncode(s);
    }
}
