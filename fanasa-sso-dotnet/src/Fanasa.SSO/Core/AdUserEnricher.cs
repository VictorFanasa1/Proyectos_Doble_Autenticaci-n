using System;
using System.Collections.Generic;

#if NET45
using System.DirectoryServices;
#endif

namespace Fanasa.SSO.Core
{
    /// <summary>
    /// Consulta Active Directory con la cuenta de servicio para enriquecer
    /// el SsoUser con datos adicionales (employeeNumber, área, jefe, etc.)
    /// que no vienen en el token de Entra ID.
    ///
    /// No requiere el password del usuario — Entra ID ya lo autenticó.
    /// Solo necesita el username (parte antes del @ en el email).
    ///
    /// Uso:
    ///   var adInfo = AdUserEnricher.GetUserInfo("enrique.marquez", options.Ad);
    ///   // adInfo.EmployeeNumber, adInfo.Area, adInfo.Manager, etc.
    /// </summary>
    public static class AdUserEnricher
    {
        public static AdUserInfo GetUserInfo(string username, AdOptions options)
        {
            if (options == null)        throw new ArgumentNullException(nameof(options));
            if (string.IsNullOrEmpty(username)) return null;

#if NET45
            return QueryActiveDirectory(username, options);
#else
            throw new PlatformNotSupportedException(
                "La consulta a Active Directory vía LDAP solo está disponible en .NET Framework 4.5. " +
                "Para .NET 6/8 usa Microsoft Graph API.");
#endif
        }

        /// <summary>
        /// Extrae el username del email (parte antes del @).
        /// </summary>
        public static string UsernameFromEmail(string email)
        {
            if (string.IsNullOrEmpty(email)) return email;
            var idx = email.IndexOf('@');
            return idx > 0 ? email.Substring(0, idx) : email;
        }

#if NET45
        private static AdUserInfo QueryActiveDirectory(string username, AdOptions options)
        {
            DirectoryEntry rootEntry = null;
            DirectorySearcher searcher = null;
            SearchResultCollection results = null;

            try
            {
                rootEntry = new DirectoryEntry(
                    options.LdapPath,
                    options.ServiceAccount,
                    options.ServicePassword,
                    AuthenticationTypes.Secure);

                searcher = new DirectorySearcher(rootEntry);
                searcher.Filter = $"(sAMAccountName={username})";
                searcher.PropertiesToLoad.Add("employeeNumber");
                searcher.PropertiesToLoad.Add("cn");
                searcher.PropertiesToLoad.Add("mail");
                searcher.PropertiesToLoad.Add("description");
                searcher.PropertiesToLoad.Add("manager");

                results = searcher.FindAll();

                if (results.Count == 0) return null;

                var result = results[0];

                var managerDn    = GetProp(result, "manager");
                var managerName  = ParseCnFromDn(managerDn);

                return new AdUserInfo
                {
                    Username       = username,
                    EmployeeNumber = GetProp(result, "employeeNumber"),
                    Name           = GetProp(result, "cn"),
                    Email          = GetProp(result, "mail"),
                    Area           = GetProp(result, "description"),
                    Manager        = managerName,
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[FanasaSSO] AdUserEnricher error: {ex.Message}");
                return null;
            }
            finally
            {
                results?.Dispose();
                searcher?.Dispose();
                rootEntry?.Dispose();
            }
        }

        private static string GetProp(SearchResult result, string key)
        {
            try { return result.Properties[key]?[0]?.ToString() ?? ""; }
            catch { return ""; }
        }

        private static string ParseCnFromDn(string dn)
        {
            if (string.IsNullOrEmpty(dn)) return "N/A";
            foreach (var part in dn.Split(','))
            {
                if (part.TrimStart().StartsWith("CN=", StringComparison.OrdinalIgnoreCase))
                    return part.Split('=').Length > 1 ? part.Split('=')[1].Trim() : "N/A";
            }
            return "N/A";
        }
#endif
    }

    public class AdUserInfo
    {
        public string Username       { get; set; }
        public string EmployeeNumber { get; set; }
        public string Name           { get; set; }
        public string Email          { get; set; }
        public string Area           { get; set; }
        public string Manager        { get; set; }
    }
}
