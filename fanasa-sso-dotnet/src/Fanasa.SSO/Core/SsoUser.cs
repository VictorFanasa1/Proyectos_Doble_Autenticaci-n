using System.Collections.Generic;

namespace Fanasa.SSO.Core
{
    public class SsoUser
    {
        public string Name     { get; set; }
        public string Email    { get; set; }
        public string ObjectId { get; set; }
        public string TenantId { get; set; }

        /// <summary>Roles asignados en Azure AD (App Roles)</summary>
        public IList<string> Roles { get; set; }

        /// <summary>Todos los claims del JWT, por si necesitas algo extra</summary>
        public IDictionary<string, object> Raw { get; set; }

        public SsoUser()
        {
            Name     = string.Empty;
            Email    = string.Empty;
            ObjectId = string.Empty;
            TenantId = string.Empty;
            Roles    = new List<string>();
            Raw      = new Dictionary<string, object>();
        }
    }
}
