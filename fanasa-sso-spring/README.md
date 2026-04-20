# fanasa-sso-spring-boot-starter

Auto-configuración SSO Fanasa para Spring Boot. Agrega la dependencia y configura dos propiedades — listo.

## Instalación (`pom.xml`)

```xml
<dependency>
    <groupId>com.fanasa</groupId>
    <artifactId>fanasa-sso-spring-boot-starter</artifactId>
    <version>1.0.0</version>
</dependency>
```

### Repositorio GitHub Packages (`~/.m2/settings.xml`)

```xml
<servers>
  <server>
    <id>github</id>
    <username>TU_USUARIO_GITHUB</username>
    <password>TU_TOKEN_GITHUB</password>
  </server>
</servers>
```

```xml
<repositories>
  <repository>
    <id>github</id>
    <url>https://maven.pkg.github.com/TU-ORG/fanasa-sso-spring</url>
  </repository>
</repositories>
```

## Configuración (`application.yml`)

```yaml
fanasa:
  sso:
    client-id: TU_CLIENT_ID
    tenant-id: TU_TENANT_ID
```

## Uso — proteger endpoints

```java
// No necesitas nada más. Spring Security ya está configurado.
// Solo agrega @PreAuthorize o deja que el filtro bloquee automáticamente.

@RestController
@RequestMapping("/api/productos")
public class ProductosController {

    @Autowired
    SsoTokenExtractor sso;  // inyectado automáticamente por el starter

    @GetMapping
    public ResponseEntity<?> getProductos() {
        SsoUser user = sso.getCurrentUser();
        return ResponseEntity.ok(Map.of(
            "usuario", user.name(),
            "email",   user.email(),
            "roles",   user.roles()
        ));
    }
}
```

## Rutas públicas

Para excluir rutas de la autenticación, sobrescribe el `SecurityFilterChain`:

```java
@Bean
@Primary
public SecurityFilterChain miFilterChain(HttpSecurity http) throws Exception {
    http
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/public/**", "/health").permitAll()
            .anyRequest().authenticated()
        )
        .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));
    return http.build();
}
```

## Publicar

```bash
mvn deploy -s ~/.m2/settings.xml
```
