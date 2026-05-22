using System;
using System.Collections.Generic;
using System.Text;

#if NET40 || NET45
using System.Web.Script.Serialization;
#else
using System.Text.Json;
#endif

namespace Fanasa.SSO.Core
{
    internal static class JwtDecoder
    {
        public static SsoUser DecodeUser(string idToken)
        {
            var claims = DecodePayload(idToken);
            var user   = new SsoUser { Raw = claims };

            user.Name     = GetString(claims, "name");
            user.Email    = GetString(claims, "preferred_username");
            if (string.IsNullOrEmpty(user.Email))
                user.Email = GetString(claims, "email");
            user.ObjectId = GetString(claims, "oid");
            user.TenantId = GetString(claims, "tid");

            object rolesObj;
            if (claims.TryGetValue("roles", out rolesObj) && rolesObj != null)
            {
                var arr = rolesObj as object[];
                if (arr != null)
                    foreach (var r in arr)
                        user.Roles.Add(r.ToString());
            }

            return user;
        }

        public static IDictionary<string, object> DecodePayload(string jwt)
        {
            var parts = jwt.Split('.');
            if (parts.Length < 2)
                throw new ArgumentException("Token JWT inválido.");

            var base64 = parts[1]
                .Replace('-', '+')
                .Replace('_', '/');

            while (base64.Length % 4 != 0)
                base64 += "=";

            var json = Encoding.UTF8.GetString(Convert.FromBase64String(base64));

#if NET40 || NET45
            var serializer = new JavaScriptSerializer();
            return serializer.Deserialize<Dictionary<string, object>>(json);
#else
            var doc    = JsonDocument.Parse(json);
            var result = new Dictionary<string, object>();
            foreach (var prop in doc.RootElement.EnumerateObject())
                result[prop.Name] = prop.Value.ValueKind == JsonValueKind.Array
                    ? (object)ParseArray(prop.Value)
                    : prop.Value.ToString();
            return result;
#endif
        }

#if !NET40 && !NET45
        private static object[] ParseArray(JsonElement element)
        {
            var list = new List<object>();
            foreach (var item in element.EnumerateArray())
                list.Add(item.ToString());
            return list.ToArray();
        }
#endif

        private static string GetString(IDictionary<string, object> d, string key)
        {
            object val;
            return (d.TryGetValue(key, out val) && val != null) ? val.ToString() : string.Empty;
        }
    }
}
