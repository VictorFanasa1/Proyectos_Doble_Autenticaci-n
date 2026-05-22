#if NET45
using Fanasa.SSO.Core;
using System.Text;
using System.Web;
using System.Web.Mvc;

namespace Fanasa.SSO.AspNet
{
    /// <summary>
    /// Helpers para Razor (ASP.NET MVC 4/5 — .NET 4.5+).
    ///
    /// Uso en tu .cshtml:
    ///   @using Fanasa.SSO.AspNet
    ///   @Html.FanasaLoginButton()
    /// </summary>
    public static class HtmlHelperExtensions
    {
        public static IHtmlString FanasaLoginButton(
            this HtmlHelper html,
            string buttonText  = "Iniciar sesión con Microsoft",
            string buttonClass = "fanasa-sso-btn",
            string redirectUri = null)
        {
            var options    = FanasaSSOConfig.Current;
            var ssoUrl     = options != null ? options.SsoUrl     : string.Empty;
            var clientName = options != null ? options.ClientName : string.Empty;
            var finalUri   = redirectUri
                ?? HttpContext.Current?.Request?.Url?.GetLeftPart(System.UriPartial.Authority)
                ?? string.Empty;

            var sb = new StringBuilder();

            sb.AppendLine("<script src=\"/fanasa-sso/script\"></script>");
            sb.AppendLine("<script>");
            sb.AppendLine("  var _fanasaSSO = new FanasaSSO({");
            sb.AppendFormat("    ssoUrl:      '{0}',\n", HttpUtility.JavaScriptStringEncode(ssoUrl));
            sb.AppendFormat("    redirectUri: '{0}',\n", HttpUtility.JavaScriptStringEncode(finalUri));
            sb.AppendFormat("    clientName:  '{0}'\n",  HttpUtility.JavaScriptStringEncode(clientName));
            sb.AppendLine("  });");
            sb.AppendLine("  function _fanasaLogin() {");
            sb.AppendLine("    _fanasaSSO.loginPopup()");
            sb.AppendLine("      .then(function() { window.location.reload(); })");
            sb.AppendLine("      .catch(function(e) { console.error('[FanasaSSO]', e.message); });");
            sb.AppendLine("  }");
            sb.AppendLine("</script>");
            sb.AppendFormat(
                "<button type=\"button\" class=\"{0}\" onclick=\"_fanasaLogin()\">{1}</button>",
                HttpUtility.HtmlAttributeEncode(buttonClass),
                HttpUtility.HtmlEncode(buttonText));

            return new HtmlString(sb.ToString());
        }

        public static SsoUser FanasaCurrentUser(this HtmlHelper html)
        {
            var cookie = HttpContext.Current?.Request?.Cookies["fanasa_id_token"];
            if (cookie == null || string.IsNullOrEmpty(cookie.Value)) return null;
            try { return JwtDecoder.DecodeUser(cookie.Value); }
            catch { return null; }
        }
    }
}
#endif
