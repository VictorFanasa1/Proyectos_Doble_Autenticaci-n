# @fanasa/sso — Guía de integración Java

Dependiendo del tipo de proyecto Java, la integración varía:

| Tipo | Rol | Integración |
|---|---|---|
| **Spring Boot API REST** | Backend — valida tokens | Dependencia Spring Security + Azure AD |
| **Java Android** | Móvil — inicia el login | Chrome Custom Tab (igual que Kotlin) |
| **JSF / Thymeleaf** | Web con backend Java | JavaScript en la vista + validación Spring |

---

## Java Spring Boot — Validar token en API REST

### 1. Dependencia en `pom.xml`

```xml
<dependency>
    <groupId>com.azure.spring</groupId>
    <artifactId>spring-cloud-azure-starter-active-directory</artifactId>
    <version>5.10.0</version>
</dependency>
```

### 2. `application.yml`

```yaml
spring:
  cloud:
    azure:
      active-directory:
        enabled: true
        credential:
          client-id: TU_CLIENT_ID
        profile:
          tenant-id: TU_TENANT_ID
        app-id-uri: api://TU_CLIENT_ID
```

### 3. Configuración de seguridad

```java
// SecurityConfig.java
import com.azure.spring.cloud.autoconfigure.aad.AadResourceServerWebSecurityConfigurerAdapter;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;

@EnableWebSecurity
public class SecurityConfig extends AadResourceServerWebSecurityConfigurerAdapter {

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        super.configure(http);
        http.authorizeRequests()
            .antMatchers("/api/publico/**").permitAll()
            .anyRequest().authenticated();
    }
}
```

### 4. Usar claims en un controller

```java
// ProductosController.java
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/productos")
public class ProductosController {

    @GetMapping
    public ResponseEntity<?> getProductos(@AuthenticationPrincipal Jwt jwt) {
        String nombre   = jwt.getClaimAsString("name");
        String email    = jwt.getClaimAsString("preferred_username");
        String objectId = jwt.getClaimAsString("oid");

        // Tu lógica de negocio...
        return ResponseEntity.ok(Map.of("usuario", nombre, "email", email));
    }
}
```

### 5. El cliente envía el token en cada petición

```javascript
// Desde Angular, React u otra app web
const token = sso.getToken();

fetch('https://api.fanasa.com/api/productos', {
  headers: {
    'Authorization': `Bearer ${token.idToken}`,
  },
});
```

---

## Java Android — Iniciar el login (Chrome Custom Tab)

La implementación es idéntica a Kotlin. Aquí el equivalente en Java:

```java
// FanasaSSOClient.java
package com.fanasa.miapp.auth;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import androidx.browser.customtabs.CustomTabsIntent;
import android.util.Base64;
import org.json.JSONObject;
import java.util.HashMap;
import java.util.Map;

public class FanasaSSOClient {

    private static final String SSO_URL     = "https://aplicacion.fanasa.com/SSO";
    private static final String CLIENT_NAME = "Mi App Android Java";

    public static void login(Context context, String redirectUri) {
        Uri loginUri = Uri.parse(SSO_URL + "/login")
            .buildUpon()
            .appendQueryParameter("redirect_uri", redirectUri)
            .appendQueryParameter("client_name",  CLIENT_NAME)
            .build();

        new CustomTabsIntent.Builder()
            .setShowTitle(true)
            .build()
            .launchUrl(context, loginUri);
    }

    public static String extractToken(Intent intent) {
        Uri uri = intent.getData();
        if (uri == null) return null;

        String fragment = uri.getFragment();
        if (fragment == null) return null;

        for (String part : fragment.split("&")) {
            String[] kv = part.split("=", 2);
            if (kv.length == 2 && kv[0].equals("id_token")) {
                return kv[1];
            }
        }
        return null;
    }

    public static Map<String, String> decodeUser(String idToken) throws Exception {
        String payload = idToken.split("\\.")[1]
            .replace("-", "+")
            .replace("_", "/");

        String json = new String(Base64.decode(payload, Base64.DEFAULT));
        JSONObject claims = new JSONObject(json);

        Map<String, String> user = new HashMap<>();
        user.put("name",     claims.optString("name"));
        user.put("email",    claims.optString("preferred_username"));
        user.put("objectId", claims.optString("oid"));
        user.put("tenantId", claims.optString("tid"));
        return user;
    }
}
```

```java
// SsoCallbackActivity.java
public class SsoCallbackActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        String idToken = FanasaSSOClient.extractToken(getIntent());

        if (idToken != null) {
            getSharedPreferences("fanasa_sso", MODE_PRIVATE)
                .edit()
                .putString("id_token", idToken)
                .apply();

            startActivity(new Intent(this, MainActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP));
        }
        finish();
    }
}
```
