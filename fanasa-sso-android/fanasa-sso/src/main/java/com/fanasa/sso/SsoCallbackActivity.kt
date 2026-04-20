package com.fanasa.sso

import android.app.Activity
import android.content.Intent
import android.os.Bundle

/**
 * Activity que captura el deep link del SSO y entrega el token
 * a la Activity que inició el login.
 *
 * Agrega esto en tu AndroidManifest.xml:
 *
 * <activity
 *     android:name="com.fanasa.sso.SsoCallbackActivity"
 *     android:exported="true">
 *   <intent-filter android:autoVerify="true">
 *     <action android:name="android.intent.action.VIEW" />
 *     <category android:name="android.intent.category.DEFAULT" />
 *     <category android:name="android.intent.category.BROWSABLE" />
 *     <data
 *         android:scheme="https"
 *         android:host="TU_DOMINIO"
 *         android:path="/sso/callback" />
 *   </intent-filter>
 * </activity>
 */
class SsoCallbackActivity : Activity() {

    companion object {
        const val EXTRA_ID_TOKEN = "fanasa_sso_id_token"
        const val EXTRA_ERROR    = "fanasa_sso_error"
        const val RESULT_SSO_OK  = RESULT_FIRST_USER + 1
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val fragment = intent.data?.fragment
        val token    = fragment
            ?.split("&")
            ?.map { it.split("=", limit = 2) }
            ?.firstOrNull { it.size == 2 && it[0] == "id_token" }
            ?.get(1)

        if (token != null) {
            // Enviar el token de vuelta a la Activity que llamó al SSO
            setResult(RESULT_SSO_OK, Intent().putExtra(EXTRA_ID_TOKEN, token))
        } else {
            setResult(RESULT_CANCELED, Intent().putExtra(EXTRA_ERROR, "No se recibió token"))
        }

        finish()
    }
}
