package com.fanasa.sso

data class SsoConfig(
    /** URL base del SSO. Ej: "https://aplicacion.fanasa.com/SSO" */
    val ssoUrl: String,
    /** Nombre de la app que aparece en la pantalla de login (opcional) */
    val clientName: String? = null,
)

data class SsoUser(
    val name:      String,
    val email:     String,
    val objectId:  String,
    val tenantId:  String,
    val expiresAt: Long,          // timestamp en ms
) {
    val isExpired: Boolean get() = System.currentTimeMillis() >= expiresAt
}
