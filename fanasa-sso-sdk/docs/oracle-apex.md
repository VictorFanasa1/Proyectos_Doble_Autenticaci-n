# @fanasa/sso — Guía de integración Oracle APEX

Oracle APEX es una plataforma web, por lo que la integración usa el mismo enfoque de JavaScript que cualquier app web. No se necesita npm.

---

## Opción A — Popup (recomendada)

El SSO se abre en un popup. Al autenticarse, el token llega via `postMessage`.

### 1. Crear una región de tipo "Static Content" en tu página APEX

Agrega este código HTML:

```html
<div id="sso-container">
  <button id="btn-login" class="t-Button t-Button--primary">
    Iniciar sesión con cuenta corporativa
  </button>
  <div id="sso-user-info" style="display:none">
    <span id="sso-nombre"></span>
    <span id="sso-email"></span>
    <button id="btn-logout" class="t-Button">Cerrar sesión</button>
  </div>
</div>
```

### 2. Agregar JavaScript en "Page → JavaScript → Function and Global Variable Declaration"

```javascript
var FanasaSSO = (function () {
  var SSO_URL    = 'https://aplicacion.fanasa.com/SSO';
  var SSO_ORIGIN = 'https://aplicacion.fanasa.com';
  var TOKEN_KEY  = 'fanasa_id_token';

  function buildLoginUrl() {
    var params = new URLSearchParams({
      redirect_uri: window.location.href.split('#')[0],
      client_name:  'Oracle APEX - ' + $v('APP_NAME'),
    });
    return SSO_URL + '/login?' + params.toString();
  }

  function decodeJwt(token) {
    var base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  }

  function getToken()  { return sessionStorage.getItem(TOKEN_KEY); }
  function saveToken(t){ sessionStorage.setItem(TOKEN_KEY, t); }
  function clearToken(){ sessionStorage.removeItem(TOKEN_KEY); }

  function isAuthenticated() {
    var t = getToken();
    if (!t) return false;
    try {
      var claims = decodeJwt(t);
      return Date.now() < claims.exp * 1000;
    } catch (e) { return false; }
  }

  function getUser() {
    var t = getToken();
    if (!t) return null;
    try {
      var c = decodeJwt(t);
      return { name: c.name, email: c.preferred_username, oid: c.oid };
    } catch (e) { return null; }
  }

  function login() {
    var w = 480, h = 620;
    var left = Math.round(window.screenX + (window.outerWidth  - w) / 2);
    var top  = Math.round(window.screenY + (window.outerHeight - h) / 2);
    window.open(
      buildLoginUrl(),
      'fanasa-sso',
      'width=' + w + ',height=' + h + ',left=' + left + ',top=' + top
    );
  }

  function logout() {
    clearToken();
    renderUI();
  }

  function renderUI() {
    var user = getUser();
    if (user && isAuthenticated()) {
      $('#sso-container #btn-login').hide();
      $('#sso-user-info').show();
      $('#sso-nombre').text(user.name);
      $('#sso-email').text(user.email);

      // Guardar en items de APEX para usarlos en procesos del servidor
      $s('P1_SSO_NOMBRE', user.name);
      $s('P1_SSO_EMAIL',  user.email);
      $s('P1_SSO_OID',    user.oid);
      $s('P1_ID_TOKEN',   getToken());
    } else {
      $('#sso-container #btn-login').show();
      $('#sso-user-info').hide();
    }
  }

  // Escuchar el token del popup
  window.addEventListener('message', function (event) {
    if (event.origin !== SSO_ORIGIN) return;
    if (!event.data || event.data.type !== 'FANASA_SSO_TOKEN') return;

    saveToken(event.data.payload.id_token);
    renderUI();

    // Disparar evento APEX para que puedas usarlo en Dynamic Actions
    apex.event.trigger(document, 'fanasa-sso-login', getUser());
  });

  return { login: login, logout: logout, isAuthenticated: isAuthenticated, getUser: getUser, getToken: getToken };
})();
```

### 3. Agregar en "Page → JavaScript → Execute when Page Loads"

```javascript
// Inicializar UI al cargar la página
FanasaSSO; // inicializa el listener de postMessage

document.getElementById('btn-login').addEventListener('click', function () {
  FanasaSSO.login();
});

document.getElementById('btn-logout').addEventListener('click', function () {
  FanasaSSO.logout();
});
```

### 4. Usar el token en procesos del servidor (PL/SQL)

Crea items de página ocultos en APEX: `P1_ID_TOKEN`, `P1_SSO_EMAIL`, `P1_SSO_NOMBRE`.

El JavaScript los llena automáticamente. Luego en un proceso PL/SQL puedes usarlos:

```sql
-- Proceso PL/SQL en APEX
DECLARE
  v_email   VARCHAR2(200) := :P1_SSO_EMAIL;
  v_nombre  VARCHAR2(200) := :P1_SSO_NOMBRE;
  v_oid     VARCHAR2(200) := :P1_SSO_OID;
BEGIN
  -- Buscar o crear el usuario en tu tabla
  MERGE INTO usuarios u
  USING DUAL
  ON (u.email = v_email)
  WHEN NOT MATCHED THEN
    INSERT (email, nombre, azure_oid, fecha_alta)
    VALUES (v_email, v_nombre, v_oid, SYSDATE);

  COMMIT;
END;
```

### 5. Dynamic Action al completar el login

En APEX puedes crear un **Dynamic Action** que se dispara cuando el SSO termina:

- **Event:** Custom
- **Custom Event:** `fanasa-sso-login`
- **Selection Type:** JavaScript Expression → `document`
- **True Action:** Submit Page / Refresh Region / lo que necesites

---

## Opción B — Redirect (sin popup)

Si necesitas redirigir la página completa al SSO en lugar de popup:

```javascript
// En lugar de FanasaSSO.login(), usar:
var params = new URLSearchParams({
  redirect_uri: window.location.href,
  client_name:  'Oracle APEX',
});
window.location.href = 'https://aplicacion.fanasa.com/SSO/login?' + params;
```

Al regresar, el token viene en el hash (`#id_token=xxx`). Leerlo al cargar la página:

```javascript
// En "Execute when Page Loads"
(function () {
  var hash   = window.location.hash.substring(1);
  if (!hash) return;
  var params = new URLSearchParams(hash);
  var token  = params.get('id_token');
  if (!token) return;

  sessionStorage.setItem('fanasa_id_token', token);
  history.replaceState(null, '', window.location.pathname + window.location.search);

  var claims = JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
  $s('P1_SSO_EMAIL',  claims.preferred_username);
  $s('P1_SSO_NOMBRE', claims.name);
  $s('P1_ID_TOKEN',   token);
})();
```
