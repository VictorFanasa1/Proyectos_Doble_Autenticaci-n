using System;
using System.DirectoryServices;
using Microsoft.Extensions.Options;
using FanasaAdApi.Models;

namespace FanasaAdApi.Services
{
    public class AdService
    {
        private readonly AdOptions _options;

        public AdService(IOptions<AdOptions> options) => _options = options.Value;

        public (AdUserInfo? info, string? error) GetUserByEmail(string email)
        {
            // Intentar primero por sAMAccountName (parte antes del @)
            var username = email.Contains('@') ? email.Split('@')[0] : email;

            try
            {
                using var entry = new DirectoryEntry(
                    _options.LdapPath,
                    _options.ServiceAccount,
                    _options.ServicePassword,
                    AuthenticationTypes.Secure);

                // Buscar por sAMAccountName O por mail en un solo query
                using var searcher = new DirectorySearcher(entry)
                {
                    Filter = $"(|(sAMAccountName={EscapeLdap(username)})(mail={EscapeLdap(email)}))",
                };

                searcher.PropertiesToLoad.Add("employeeNumber");
                searcher.PropertiesToLoad.Add("cn");
                searcher.PropertiesToLoad.Add("mail");
                searcher.PropertiesToLoad.Add("description");
                searcher.PropertiesToLoad.Add("manager");
                searcher.PropertiesToLoad.Add("title");  // ← nuevo campo

                var result = searcher.FindOne();
                if (result == null)
                    return (null, $"No se encontró ningún objeto en AD con sAMAccountName='{username}' ni mail='{email}'.");

                return (new AdUserInfo
                {
                    EmployeeNumber = Get(result, "employeeNumber"),
                    Name           = Get(result, "cn"),
                    Email          = Get(result, "mail"),
                    Area           = Get(result, "description"),
                    Manager        = ParseCn(Get(result, "manager")),
                    JobTitle       = Get(result, "title"),  // ← nuevo campo
                }, null);
            }
            catch (Exception ex)
            {
                return (null, $"Error LDAP: {ex.GetType().Name} — {ex.Message}");
            }
        }

        private static string? Get(SearchResult result, string attr) =>
            result.Properties[attr]?.Count > 0
                ? result.Properties[attr][0]?.ToString()
                : null;

        // Extrae el CN del DN del manager: "CN=Juan Pérez,OU=..." → "Juan Pérez"
        private static string? ParseCn(string? dn)
        {
            if (string.IsNullOrEmpty(dn)) return null;
            foreach (var part in dn.Split(','))
            {
                var trimmed = part.Trim();
                if (trimmed.StartsWith("CN=", StringComparison.OrdinalIgnoreCase))
                    return trimmed.Substring(3);
            }
            return dn;
        }

        // Escapar caracteres especiales en filtros LDAP (RFC 4515)
        private static string EscapeLdap(string value) =>
            value
                .Replace("\\", "\\5c")
                .Replace("*",  "\\2a")
                .Replace("(",  "\\28")
                .Replace(")",  "\\29")
                .Replace("\0", "\\00");
    }
}
