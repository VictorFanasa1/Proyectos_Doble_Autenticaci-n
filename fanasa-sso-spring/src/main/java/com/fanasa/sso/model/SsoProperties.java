package com.fanasa.sso.model;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Propiedades de configuración del SSO Fanasa.
 *
 * En application.yml:
 *   fanasa:
 *     sso:
 *       client-id: TU_CLIENT_ID
 *       tenant-id: TU_TENANT_ID
 */
@ConfigurationProperties(prefix = "fanasa.sso")
public class SsoProperties {

    /** Client ID del App Registration en Azure AD */
    private String clientId;

    /** Tenant ID de Azure AD */
    private String tenantId;

    /** Audiences adicionales válidas (por defecto = clientId) */
    private String[] validAudiences = new String[0];

    // getters y setters
    public String getClientId()                  { return clientId; }
    public void   setClientId(String clientId)   { this.clientId = clientId; }

    public String getTenantId()                  { return tenantId; }
    public void   setTenantId(String tenantId)   { this.tenantId = tenantId; }

    public String[] getValidAudiences()                       { return validAudiences; }
    public void     setValidAudiences(String[] validAudiences){ this.validAudiences = validAudiences; }

    public String getJwksUri() {
        return "https://login.microsoftonline.com/" + tenantId + "/discovery/v2.0/keys";
    }

    public String getIssuerUri() {
        return "https://login.microsoftonline.com/" + tenantId + "/v2.0";
    }
}
