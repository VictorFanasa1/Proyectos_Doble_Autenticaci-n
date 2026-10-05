export const environment = {
  production: true,
  baseHref: '/SSO/',
  redirectUri: 'https://aplicacion.fanasa.com/SSO/auth/callback',
  msal: {
    clientId: 'e9315c81-d3bb-43d0-bdeb-c5cbf3106b94',
    tenantId: '08a4f0b0-d4f1-4ca4-8234-366581f0ea09',
  },
  // Endpoint que devuelve datos de AD: GET ?email=usuario@dominio.com → { employee_number, area, manager }
  adEnrichmentUrl: 'https://aplicacion.fanasa.com/ADEndPoint/api/ad/user' as string | null,
};
