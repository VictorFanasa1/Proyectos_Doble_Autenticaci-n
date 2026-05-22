/**
 * @fanasa/sso — Script standalone para proyectos .NET (Razor, Web Forms, Blazor)
 * Compatible con IE9+ y todos los navegadores modernos (ES5).
 *
 * Uso básico:
 *   <script src="/fanasa-sso/script"></script>
 *   <script>
 *     var sso = new FanasaSSO({
 *       ssoUrl:      'https://aplicacion.fanasa.com/SSO',
 *       redirectUri: 'https://mi-proyecto.fanasa.com'
 *     });
 *     sso.loginPopup().then(function(token) { location.reload(); });
 *   </script>
 */
(function (global) {
  'use strict';

  var TOKEN_KEY = 'fanasa_sso_token';

  // ─── Constructor ────────────────────────────────────────────────────────────

  function FanasaSSO(config) {
    if (!config)             throw new Error('FanasaSSO: config es requerido.');
    if (!config.ssoUrl)      throw new Error('FanasaSSO: ssoUrl es requerido.');
    if (!config.redirectUri) throw new Error('FanasaSSO: redirectUri es requerido.');

    this._config = {
      ssoUrl:      config.ssoUrl.replace(/\/$/, ''),
      redirectUri: config.redirectUri,
      clientName:  config.clientName  || '',
      popupWidth:  (config.popup && config.popup.width)  || 480,
      popupHeight: (config.popup && config.popup.height) || 620
    };
  }

  // ─── Login Popup ─────────────────────────────────────────────────────────────

  FanasaSSO.prototype.loginPopup = function (redirectUri) {
    var self     = this;
    var uri      = redirectUri || this._config.redirectUri;
    var loginUrl = this._buildLoginUrl(uri);

    return new Promise(function (resolve, reject) {
      var popup = self._openPopup(loginUrl);

      if (!popup) {
        reject(new Error('No se pudo abrir el popup. Verifica que no esté bloqueado por el navegador.'));
        return;
      }

      var ssoOrigin = self._getOrigin(self._config.ssoUrl);

      function onMessage(event) {
        if (event.origin !== ssoOrigin)              return;
        if (!event.data)                             return;
        if (event.data.type !== 'FANASA_SSO_TOKEN') return;

        window.removeEventListener('message', onMessage);
        clearInterval(closedChecker);

        var token = self._buildToken(event.data.payload);
        self._saveToken(token);
        resolve(token);
      }

      var closedChecker = setInterval(function () {
        if (popup.closed) {
          clearInterval(closedChecker);
          window.removeEventListener('message', onMessage);
          reject(new Error('El usuario cerró el popup sin autenticarse.'));
        }
      }, 500);

      window.addEventListener('message', onMessage, false);
    });
  };

  // ─── Login Redirect ──────────────────────────────────────────────────────────

  FanasaSSO.prototype.loginRedirect = function (redirectUri) {
    var uri = redirectUri || this._config.redirectUri;
    window.location.href = this._buildLoginUrl(uri);
  };

  // ─── Callback (para cuando el SSO regresa via redirect) ──────────────────────

  FanasaSSO.prototype.handleRedirectCallback = function () {
    var hash = window.location.hash.substring(1);
    if (!hash) return null;

    var params  = this._parseQuery(hash);
    var idToken = params['id_token'];
    if (!idToken) return null;

    var token = this._buildToken({
      id_token:     idToken,
      access_token: params['access_token'] || null,
      token_type:   params['token_type']   || 'Bearer',
      expires_in:   parseInt(params['expires_in'] || '3600', 10),
      scope:        params['scope']        || 'openid profile'
    });

    this._saveToken(token);

    // Limpiar hash del browser para que el token no quede visible
    if (history && history.replaceState) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    return token;
  };

  // ─── Estado ─────────────────────────────────────────────────────────────────

  FanasaSSO.prototype.getToken = function () {
    try {
      var raw = sessionStorage.getItem(TOKEN_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  };

  FanasaSSO.prototype.isAuthenticated = function () {
    var token = this.getToken();
    return !!(token && Date.now() < token.expiresAt);
  };

  FanasaSSO.prototype.getUser = function () {
    var token = this.getToken();
    if (!token) return null;
    try {
      var raw = this._decodeJwt(token.idToken);
      return {
        name:     raw['name']               || '',
        email:    raw['preferred_username'] || raw['email'] || '',
        objectId: raw['oid']                || '',
        tenantId: raw['tid']                || '',
        roles:    raw['roles']              || [],
        raw:      raw
      };
    } catch (e) { return null; }
  };

  FanasaSSO.prototype.getIdToken = function () {
    var token = this.getToken();
    return token ? token.idToken : null;
  };

  FanasaSSO.prototype.logout = function () {
    sessionStorage.removeItem(TOKEN_KEY);
  };

  // ─── Privados ────────────────────────────────────────────────────────────────

  FanasaSSO.prototype._buildLoginUrl = function (redirectUri) {
    var url = this._config.ssoUrl + '/login?redirect_uri=' + encodeURIComponent(redirectUri);
    if (this._config.clientName) {
      url += '&client_name=' + encodeURIComponent(this._config.clientName);
    }
    return url;
  };

  FanasaSSO.prototype._openPopup = function (url) {
    var w    = this._config.popupWidth;
    var h    = this._config.popupHeight;
    var left = Math.round(window.screenX + (window.outerWidth  - w) / 2);
    var top  = Math.round(window.screenY + (window.outerHeight - h) / 2);
    return window.open(
      url,
      'FanasaSSO',
      'width=' + w + ',height=' + h + ',left=' + left + ',top=' + top + ',toolbar=no,menubar=no,scrollbars=yes'
    );
  };

  FanasaSSO.prototype._buildToken = function (payload) {
    return {
      idToken:     payload.id_token,
      accessToken: payload.access_token || null,
      tokenType:   payload.token_type   || 'Bearer',
      expiresAt:   Date.now() + (payload.expires_in || 3600) * 1000,
      scope:       payload.scope        || 'openid profile'
    };
  };

  FanasaSSO.prototype._saveToken = function (token) {
    sessionStorage.setItem(TOKEN_KEY, JSON.stringify(token));
  };

  FanasaSSO.prototype._decodeJwt = function (jwt) {
    var part   = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    while (part.length % 4) part += '=';
    return JSON.parse(atob(part));
  };

  FanasaSSO.prototype._getOrigin = function (url) {
    var a = document.createElement('a');
    a.href = url;
    return a.protocol + '//' + a.host;
  };

  FanasaSSO.prototype._parseQuery = function (str) {
    var result = {};
    var pairs  = str.split('&');
    for (var i = 0; i < pairs.length; i++) {
      var kv  = pairs[i].split('=');
      var key = decodeURIComponent(kv[0] || '');
      var val = decodeURIComponent(kv[1] || '');
      if (key) result[key] = val;
    }
    return result;
  };

  // ─── Export ──────────────────────────────────────────────────────────────────

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = FanasaSSO;
  } else {
    global.FanasaSSO = FanasaSSO;
  }

}(typeof window !== 'undefined' ? window : this));
