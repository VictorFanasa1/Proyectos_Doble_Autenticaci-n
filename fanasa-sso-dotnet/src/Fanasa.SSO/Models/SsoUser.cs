namespace Fanasa.SSO.Models;

public record SsoUser(
    string Name,
    string Email,
    string ObjectId,
    string TenantId,
    IReadOnlyList<string> Roles
);
