# fanasa-sso-android

SDK Android para autenticación con el SSO Fanasa. Compatible con **Kotlin y Java**.

## Instalación

### 1. Agregar el repositorio en `settings.gradle`

```gradle
dependencyResolutionManagement {
    repositories {
        maven {
            url = uri("https://maven.pkg.github.com/TU-ORG/fanasa-sso-android")
            credentials {
                username = providers.gradleProperty("gpr.user").orNull
                password = providers.gradleProperty("gpr.token").orNull
            }
        }
    }
}
```

### 2. Agregar la dependencia en `build.gradle` del módulo

```gradle
dependencies {
    implementation 'com.fanasa:sso-android:1.0.0'
}
```

## Configuración del AndroidManifest

```xml
<!-- Tu activity que recibe el callback del SSO -->
<activity
    android:name="com.fanasa.sso.SsoCallbackActivity"
    android:exported="true">
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data
            android:scheme="https"
            android:host="mi-app.fanasa.com"
            android:path="/sso/callback" />
    </intent-filter>
</activity>
```

## Uso en Kotlin

```kotlin
class LoginActivity : AppCompatActivity() {

    private val sso = FanasaSSO(
        context = this,
        config  = SsoConfig(
            ssoUrl     = "https://aplicacion.fanasa.com/SSO",
            clientName = "Mi App Android",
        )
    )

    private val ssoLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == SsoCallbackActivity.RESULT_SSO_OK) {
            val token = result.data?.getStringExtra(SsoCallbackActivity.EXTRA_ID_TOKEN)
            val user  = sso.getUser()
            Log.d("SSO", "Usuario: ${user?.name} — ${user?.email}")
            navigateToDashboard()
        }
    }

    fun login() {
        sso.login(this, redirectUri = "https://mi-app.fanasa.com/sso/callback")
    }
}
```

## Uso en Java

```java
public class LoginActivity extends AppCompatActivity {

    private FanasaSSO sso;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        sso = new FanasaSSO(this, new SsoConfig(
            "https://aplicacion.fanasa.com/SSO",
            "Mi App Android Java"
        ));

        findViewById(R.id.btnLogin).setOnClickListener(v ->
            sso.login(this, "https://mi-app.fanasa.com/sso/callback")
        );
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (sso.handleCallback(intent)) {
            SsoUser user = sso.getUser();
            Log.d("SSO", "Usuario: " + user.getName());
            startActivity(new Intent(this, MainActivity.class));
        }
    }
}
```

## Publicar el AAR

```bash
./gradlew :fanasa-sso:publishReleasePublicationToGitHubPackagesRepository
```
