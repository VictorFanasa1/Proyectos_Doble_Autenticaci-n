# @fanasa/sso — Guía de integración Kotlin / Android

En Android no se usa npm. El SSO se abre con **Chrome Custom Tab** — una pestaña del navegador integrada en la app que se cierra automáticamente al terminar.

---

## 1. Dependencias en `build.gradle`

```gradle
dependencies {
    implementation "androidx.browser:browser:1.7.0"    // Chrome Custom Tab
    implementation "com.squareup.okhttp3:okhttp:4.12.0" // para llamadas a API (opcional)
}
```

## 2. Registrar el Deep Link en `AndroidManifest.xml`

El SSO redirigirá a tu app via deep link tras autenticar.

```xml
<activity android:name=".SsoCallbackActivity" android:exported="true">
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />

        <!-- Registra también esta URI en Azure AD -->
        <data
            android:scheme="https"
            android:host="mi-app.fanasa.com"
            android:path="/auth/callback" />
    </intent-filter>
</activity>
```

> Registra `https://mi-app.fanasa.com/auth/callback` en Azure AD → Redirect URIs.

## 3. Clase cliente del SSO

```kotlin
// FanasaSSOClient.kt
package com.fanasa.miapp.auth

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent

object FanasaSSOClient {

    private const val SSO_URL    = "https://aplicacion.fanasa.com/SSO"
    private const val CLIENT_NAME = "Mi App Android"

    /**
     * Abre el SSO en Chrome Custom Tab.
     * El resultado llega en SsoCallbackActivity via deep link.
     */
    fun login(context: Context, redirectUri: String) {
        val params = Uri.Builder()
            .encodedPath("$SSO_URL/login")
            .appendQueryParameter("redirect_uri",  redirectUri)
            .appendQueryParameter("client_name",   CLIENT_NAME)
            .build()

        val customTab = CustomTabsIntent.Builder()
            .setShowTitle(true)
            .build()

        customTab.launchUrl(context, params)
    }

    /**
     * Extrae el id_token del deep link de retorno.
     * Llama esto en SsoCallbackActivity.onCreate()
     *
     * El SSO regresa: https://mi-app.fanasa.com/auth/callback#id_token=xxx
     */
    fun extractToken(intent: Intent): String? {
        val uri      = intent.data ?: return null
        val fragment = uri.fragment ?: return null
        val params   = fragment.split("&").associate {
            val (k, v) = it.split("=", limit = 2)
            k to v
        }
        return params["id_token"]
    }

    /**
     * Decodifica el JWT y devuelve los claims del usuario.
     * No valida la firma — solo para UI.
     */
    fun decodeUser(idToken: String): Map<String, String> {
        val payload = idToken.split(".")[1]
            .replace("-", "+")
            .replace("_", "/")
            .let { android.util.Base64.decode(it, android.util.Base64.DEFAULT) }
            .let { String(it) }

        val jsonObject = org.json.JSONObject(payload)
        return mapOf(
            "name"      to (jsonObject.optString("name")),
            "email"     to (jsonObject.optString("preferred_username")),
            "objectId"  to (jsonObject.optString("oid")),
            "tenantId"  to (jsonObject.optString("tid")),
        )
    }
}
```

## 4. Activity que recibe el callback

```kotlin
// SsoCallbackActivity.kt
package com.fanasa.miapp.auth

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.fanasa.miapp.MainActivity

class SsoCallbackActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val idToken = FanasaSSOClient.extractToken(intent)

        if (idToken != null) {
            // Guardar el token de forma segura
            getSharedPreferences("fanasa_sso", MODE_PRIVATE)
                .edit()
                .putString("id_token", idToken)
                .apply()

            val user = FanasaSSOClient.decodeUser(idToken)

            // Ir a la pantalla principal con los datos del usuario
            val mainIntent = Intent(this, MainActivity::class.java).apply {
                putExtra("user_name",  user["name"])
                putExtra("user_email", user["email"])
                flags = Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            startActivity(mainIntent)
        } else {
            // Error — regresar al login
            finish()
        }
    }
}
```

## 5. Invocar el login desde cualquier Activity

```kotlin
// LoginActivity.kt
class LoginActivity : AppCompatActivity() {

    private val REDIRECT_URI = "https://mi-app.fanasa.com/auth/callback"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        findViewById<Button>(R.id.btnLogin).setOnClickListener {
            FanasaSSOClient.login(this, REDIRECT_URI)
        }
    }
}
```

## 6. Llamar a tu API con el token

```kotlin
// ApiClient.kt
import okhttp3.OkHttpClient
import okhttp3.Request

fun fetchProductos(context: Context): String {
    val idToken = context
        .getSharedPreferences("fanasa_sso", Context.MODE_PRIVATE)
        .getString("id_token", null) ?: return "No autenticado"

    val client  = OkHttpClient()
    val request = Request.Builder()
        .url("https://api.fanasa.com/productos")
        .addHeader("Authorization", "Bearer $idToken")
        .build()

    client.newCall(request).execute().use { response ->
        return response.body?.string() ?: "Error"
    }
}
```

## 7. Validación del token en el backend (Java / Kotlin Spring)

```kotlin
// SecurityConfig.kt — Spring Boot
@Configuration
@EnableWebSecurity
class SecurityConfig {

    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .authorizeHttpRequests { it.anyRequest().authenticated() }
            .oauth2ResourceServer { oauth2 ->
                oauth2.jwt { jwt ->
                    jwt.jwkSetUri(
                        "https://login.microsoftonline.com/TU_TENANT_ID/discovery/v2.0/keys"
                    )
                }
            }
        return http.build()
    }
}

// application.yml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://login.microsoftonline.com/TU_TENANT_ID/v2.0
          audiences: TU_CLIENT_ID
```
