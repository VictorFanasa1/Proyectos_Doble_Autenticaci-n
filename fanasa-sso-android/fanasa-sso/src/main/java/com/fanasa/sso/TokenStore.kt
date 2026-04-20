package com.fanasa.sso

import android.content.Context
import android.content.SharedPreferences
import android.util.Base64
import org.json.JSONObject

private const val PREFS_NAME = "fanasa_sso_prefs"
private const val KEY_TOKEN  = "id_token"
private const val KEY_EXP    = "token_exp"

/**
 * Almacena el token de forma segura en SharedPreferences.
 * En producción considera usar EncryptedSharedPreferences de Jetpack Security.
 */
internal class TokenStore(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun saveToken(idToken: String) {
        val exp = extractExp(idToken)
        prefs.edit()
            .putString(KEY_TOKEN, idToken)
            .putLong(KEY_EXP, exp)
            .apply()
    }

    fun getIdToken(): String? = prefs.getString(KEY_TOKEN, null)

    fun isValid(): Boolean {
        val token = getIdToken() ?: return false
        val exp   = prefs.getLong(KEY_EXP, 0L)
        return exp > System.currentTimeMillis()
    }

    fun clear() = prefs.edit().remove(KEY_TOKEN).remove(KEY_EXP).apply()

    private fun extractExp(token: String): Long = runCatching {
        val payload = token.split(".")[1]
            .replace("-", "+").replace("_", "/")
            .let { Base64.decode(it, Base64.DEFAULT) }
            .let { String(it) }
        JSONObject(payload).optLong("exp") * 1000L
    }.getOrDefault(0L)
}
