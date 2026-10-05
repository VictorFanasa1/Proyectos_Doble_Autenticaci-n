namespace FanasaAdApi.Models
{
    public class AdOptions
    {
        public string LdapPath        { get; set; } = string.Empty;
        public string ServiceAccount  { get; set; } = string.Empty;
        public string ServicePassword { get; set; } = string.Empty;
    }

    public class AdUserInfo
    {
        public string? EmployeeNumber { get; set; }
        public string? Name           { get; set; }
        public string? Email          { get; set; }
        public string? Area           { get; set; }
        public string? Manager        { get; set; }
        public string? JobTitle       { get; set; }  // ← nuevo campo
    }
}
