package com.fanasa.sso.autoconfigure;

import com.fanasa.sso.model.SsoProperties;
import com.fanasa.sso.validator.SsoTokenExtractor;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtDecoders;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;

import java.util.Arrays;
import java.util.List;

@AutoConfiguration
@ConditionalOnWebApplication
@ConditionalOnClass(HttpSecurity.class)
@EnableConfigurationProperties(SsoProperties.class)
@EnableWebSecurity
public class FanasaSSOAutoConfiguration {

    private final SsoProperties props;

    public FanasaSSOAutoConfiguration(SsoProperties props) {
        this.props = props;
    }

    /**
     * Configura Spring Security para validar tokens JWT de Microsoft Entra ID.
     * Puedes sobrescribir este bean en tu app si necesitas personalización.
     */
    @Bean
    public SecurityFilterChain fanasaSsoFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health", "/public/**").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .decoder(fanasaSsoJwtDecoder())
                    .jwtAuthenticationConverter(fanasaSsoJwtConverter())
                )
            );

        return http.build();
    }

    @Bean
    public JwtDecoder fanasaSsoJwtDecoder() {
        NimbusJwtDecoder decoder = NimbusJwtDecoder
            .withJwkSetUri(props.getJwksUri())
            .build();

        // Validar audience
        List<String> audiences = props.getValidAudiences().length > 0
            ? Arrays.asList(props.getValidAudiences())
            : List.of(props.getClientId());

        decoder.setJwtValidator(
            org.springframework.security.oauth2.jwt.JwtValidators
                .createDefaultWithIssuer(props.getIssuerUri())
        );

        return decoder;
    }

    @Bean
    public JwtAuthenticationConverter fanasaSsoJwtConverter() {
        // Leer roles del claim "roles" de Azure AD
        var authoritiesConverter = new JwtGrantedAuthoritiesConverter();
        authoritiesConverter.setAuthoritiesClaimName("roles");
        authoritiesConverter.setAuthorityPrefix("ROLE_");

        var converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(authoritiesConverter);
        return converter;
    }

    @Bean
    public SsoTokenExtractor ssoTokenExtractor() {
        return new SsoTokenExtractor();
    }
}
