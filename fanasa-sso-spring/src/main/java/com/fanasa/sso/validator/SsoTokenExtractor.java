package com.fanasa.sso.validator;

import com.fanasa.sso.model.SsoUser;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Extrae el SsoUser del SecurityContext.
 * Inyéctalo en cualquier servicio o controller para obtener el usuario autenticado.
 */
@Component
public class SsoTokenExtractor {

    /**
     * Devuelve el usuario autenticado actual o null si no hay sesión.
     *
     * Uso en un servicio:
     *   @Autowired SsoTokenExtractor sso;
     *   SsoUser user = sso.getCurrentUser();
     */
    public SsoUser getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        if (!(auth.getPrincipal() instanceof Jwt jwt)) return null;

        List<String> roles = auth.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .filter(a -> a.startsWith("ROLE_"))
            .map(a -> a.substring(5))
            .toList();

        return new SsoUser(
            jwt.getClaimAsString("name"),
            jwt.getClaimAsString("preferred_username"),
            jwt.getClaimAsString("oid"),
            jwt.getClaimAsString("tid"),
            roles
        );
    }

    public String getCurrentUserEmail() {
        var user = getCurrentUser();
        return user != null ? user.email() : null;
    }
}
