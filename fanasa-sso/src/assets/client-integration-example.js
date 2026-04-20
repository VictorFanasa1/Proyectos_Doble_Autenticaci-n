/**
 * ============================================================
 *  FANASA SSO — Integración para proyectos cliente
 * ============================================================
 *
 *  Solo necesitas estas líneas en tu proyecto. Sin instalar nada.
 *
 * ── OPCIÓN 1: POPUP (recomendada) ───────────────────────────
 *
 *  El login abre en una ventana pequeña. Cuando el usuario
 *  termina, el popup se cierra solo y tú recibes el token.
 *
 *  // 1. Abrir el SSO
 *  const SSO = 'https://sso.fanasa.com';
 *  const redirectUri = encodeURIComponent(window.location.href);
 *
 *  window.open(
 *    `${SSO}/login?redirect_uri=${redirectUri}&client_name=Mi App`,
 *    'fanasa-sso',
 *    'width=480,height=620,left=200,top=100'
 *  );
 *
 *  // 2. Escuchar el token
 *  window.addEventListener('message', (event) => {
 *    if (event.origin !== 'https://sso.fanasa.com') return;
 *    if (event.data?.type !== 'FANASA_SSO_TOKEN') return;
 *
 *    const { id_token, access_token, expires_in } = event.data.payload;
 *
 *    sessionStorage.setItem('id_token', id_token);
 *    // Ya autenticado — continuar con tu app
 *  });
 *
 *
 * ── OPCIÓN 2: REDIRECT (página completa) ────────────────────
 *
 *  El browser navega al SSO. Al terminar regresa a redirect_uri
 *  con el token en el hash (#id_token=xxx).
 *
 *  // Redirigir al SSO
 *  const params = new URLSearchParams({
 *    redirect_uri: 'https://aplicacion.farmaciasespecializadas.com/FrenteTest',
 *    client_name: 'Farmacias Especializadas',
 *  });
 *  window.location.href = `https://sso.fanasa.com/login?${params}`;
 *
 *  // En la página de regreso, leer el token del hash
 *  const hash = new URLSearchParams(window.location.hash.substring(1));
 *  const idToken = hash.get('id_token');
 *  if (idToken) {
 *    sessionStorage.setItem('id_token', idToken);
 *    history.replaceState(null, '', window.location.pathname); // limpiar hash
 *  }
 *
 *
 * ── DECODIFICAR EL TOKEN (nombre, email del usuario) ────────
 *
 *  function getUser(token) {
 *    const base64 = token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
 *    return JSON.parse(atob(base64));
 *  }
 *
 *  const user = getUser(sessionStorage.getItem('id_token'));
 *  console.log(user.name, user.preferred_username); // nombre y email
 *
 *
 * ── REGISTRO EN AZURE AD ────────────────────────────────────
 *
 *  Por cada proyecto nuevo, agregar su URL en:
 *  Azure Portal → Entra ID → App registrations → Fanasa SSO
 *  → Authentication → Redirect URIs
 */
