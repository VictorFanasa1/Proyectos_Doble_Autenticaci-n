package com.fanasa.sso

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.util.Base64
import androidx.browser.customtabs.CustomTabsIntent
import org.json.JSONObject

/**
 * Cliente principal del SSO Fanasa para Android.
 *
 * Uso básico:
 *   val sso = FanasaSSO(context, SsoConfig(ssoUrl = "https://aplicacion.fanasa.com/SSO"))
 *   sso.login(activity, redirectUri = "https://mi-app.fanasa.com/callback")
 */
class FanasaSSO(private val context: Context, private val config: SsoConfig) {

    private val store = TokenStore(context)

    // ─── Login ──────────────────────────────────────────────────────────────

    /**
     * Abre el SSO en Chrome Custom Tab.
     * El token llega a través del deep link registrado en SsoCallbackActivity.
     *
     * @param redirectUri URL registrada en Azure AD para tu app.
     *                    Debe coincidir con el intent-filter del AndroidManifest.
     */
    fun login(context: Context, redirectUri: String) {
        val url = Uri.parse("${config.ssoUrl}/login")
            .buildUpon()
            .appendQueryParameter("redirect_uri", redirectUri)
            .apply { config.clientName?.let { appendQueryParameter("client_name", it) } }
            .build()

        CustomTabsIntent.Builder()
            .setShowTitle(true)
            .build()
            .launchUrl(context, url)
    }

    // ─── Token ──────────────────────────────────────────────────────────────

    /**
     * Procesa el Intent del deep link y guarda el token.
     * Llama esto en SsoCallbackActivity.onCreate(intent).
     * Devuelve true si se recibió un token válido.
     */
    fun handleCallback(intent: Intent): Boolean {
        val token = extractTokenFromIntent(intent) ?: return false
        store.saveToken(token)
        return true
    }

    fun isAuthenticated(): Boolean = store.isValid()

    fun getToken(): String?   = store.getIdToken()

    fun getUser(): SsoUser? {
        val token = store.getIdToken() ?: return null
        return decodeUser(token)
    }

    fun logout() = store.clear()

    // ─── Privados ────────────────────────────────────────────────────────────

    private fun extractTokenFromIntent(intent: Intent): String? {
        val fragment = intent.data?.fragment ?: return null
        return fragment.split("&")
            .map { it.split("=", limit = 2) }
            .firstOrNull { it.size == 2 && it[0] == "id_token" }
            ?.get(1)
    }

    internal fun decodeUser(idToken: String): SsoUser? = runCatching {
        val payload = idToken.split(".")[1]
            .replace("-", "+")
            .replace("_", "/")
            .let { Base64.decode(it, Base64.DEFAULT) }
            .let { String(it) }

        val c = JSONObject(payload)
        SsoUser(
            name      = c.optString("name"),
            email     = c.optString("preferred_username").ifEmpty { c.optString("email") },
            objectId  = c.optString("oid"),
            tenantId  = c.optString("tid"),
            expiresAt = c.optLong("exp") * 1000L,
        )
    }.getOrNull()
}
