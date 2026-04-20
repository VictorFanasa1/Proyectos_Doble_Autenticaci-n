// ─────────────────────────────────────────────────────────────────────────────
//  FANASA SSO — Validación de token en el proyecto cliente
//  Copia este archivo a tu proyecto. No requiere librerías externas.
// ─────────────────────────────────────────────────────────────────────────────

export interface TokenClaims {
  name:               string;
  email:              string;
  objectId:           string;   // oid
  tenantId:           string;   // tid
  roles:              string[]; // roles asignados en Azure AD (si aplica)
  expiresAt:          Date;
  raw:                Record<string, any>;
}

export interface ValidationResult {
  valid:   boolean;
  claims:  TokenClaims | null;
  error:   string | null;
}

// ─── Configuración esperada ────────────────────────────────────────────────

const EXPECTED_TENANT_ID = 'TU_TENANT_ID'; // mismo que en el SSO
const EXPECTED_CLIENT_ID = 'TU_CLIENT_ID'; // mismo que en el SSO (= aud del token)

// ─── Validación CLIENT-SIDE ────────────────────────────────────────────────
//
//  Qué valida:  ✅ expiración  ✅ issuer de Microsoft  ✅ tenant  ✅ audience
//  Qué NO valida: ❌ firma criptográfica (eso es del backend)
//
//  Úsalo para decidir si muestras la UI autenticada o rediriges al login.
//  NO lo uses como única validación en llamadas a APIs sensibles.

export function validateTokenClientSide(idToken: string): ValidationResult {
  try {
    const claims = decodeJwt(idToken);

    // 1. Expiración
    const expiresAt = new Date(claims['exp'] * 1000);
    if (Date.now() >= expiresAt.getTime()) {
      return fail('Token expirado. El usuario debe autenticarse de nuevo.');
    }

    // 2. Issuer — debe ser Microsoft con tu tenant
    const validIssuers = [
      `https://login.microsoftonline.com/${EXPECTED_TENANT_ID}/v2.0`,
      `https://sts.windows.net/${EXPECTED_TENANT_ID}/`,
    ];
    if (!validIssuers.includes(claims['iss'])) {
      return fail(`Issuer inválido: ${claims['iss']}`);
    }

    // 3. Audience — debe ser el client_id de tu app
    if (claims['aud'] !== EXPECTED_CLIENT_ID) {
      return fail(`Audience inválida: ${claims['aud']}`);
    }

    // 4. Tenant
    if (claims['tid'] !== EXPECTED_TENANT_ID) {
      return fail(`Tenant no autorizado: ${claims['tid']}`);
    }

    return {
      valid:  true,
      error:  null,
      claims: {
        name:      claims['name']               ?? '',
        email:     claims['preferred_username'] ?? claims['email'] ?? '',
        objectId:  claims['oid']  ?? '',
        tenantId:  claims['tid']  ?? '',
        roles:     claims['roles'] ?? [],
        expiresAt,
        raw: claims,
      },
    };

  } catch (e: any) {
    return fail(`Token malformado: ${e.message}`);
  }
}

function decodeJwt(token: string): Record<string, any> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('El token no tiene el formato JWT (header.payload.signature)');
  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64));
}

function fail(error: string): ValidationResult {
  return { valid: false, claims: null, error };
}


// ─── Cómo usarlo tras recibir el token del SSO popup ──────────────────────
//
//  window.addEventListener('message', (event) => {
//    if (event.origin !== 'https://sso.fanasa.com') return;
//    if (event.data?.type !== 'FANASA_SSO_TOKEN') return;
//
//    const { id_token } = event.data.payload;
//
//    const result = validateTokenClientSide(id_token);
//
//    if (!result.valid) {
//      console.error('Token inválido:', result.error);
//      mostrarError(result.error);
//      return;
//    }
//
//    // Token válido — guardar y continuar
//    sessionStorage.setItem('id_token', id_token);
//    console.log('Usuario:', result.claims.name, result.claims.email);
//
//    // Continuar con el flujo de tu app
//    router.navigate(['/dashboard']);
//  });
