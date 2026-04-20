import { Injectable } from '@angular/core';
import { TokenPayload, DeliveryMode } from '../models/sso-config.model';

@Injectable({ providedIn: 'root' })
export class TokenDeliveryService {

  deliver(
    redirectUri: string,
    payload: TokenPayload,
    mode: DeliveryMode,
    allowedOrigin?: string
  ): void {
    switch (mode) {
      case 'popup':       return this.deliverViaPopup(payload, allowedOrigin);
      case 'postmessage': return this.deliverViaPostMessage(payload, allowedOrigin);
      default:            return this.deliverViaRedirect(redirectUri, payload);
    }
  }

  /**
   * Popup: envía el token a la ventana que abrió este popup (window.opener)
   * y luego cierra el popup automáticamente.
   * El cliente escucha window.addEventListener('message', handler).
   */
  private deliverViaPopup(payload: TokenPayload, allowedOrigin?: string): void {
    const origin = allowedOrigin || '*';
    window.opener.postMessage({ type: 'FANASA_SSO_TOKEN', payload }, origin);
    window.close();
  }

  /**
   * Iframe: envía el token al frame padre.
   */
  private deliverViaPostMessage(payload: TokenPayload, allowedOrigin?: string): void {
    const origin = allowedOrigin || '*';
    window.parent.postMessage({ type: 'FANASA_SSO_TOKEN', payload }, origin);
  }

  /**
   * Redirect normal: manda al cliente con el token en el hash (#).
   * El hash no se envía al servidor, queda solo en el browser.
   */
  private deliverViaRedirect(redirectUri: string, payload: TokenPayload): void {
    const params = new URLSearchParams({
      id_token:   payload.id_token,
      token_type: payload.token_type,
      expires_in: String(payload.expires_in),
      scope:      payload.scope,
    });
    if (payload.access_token) {
      params.set('access_token', payload.access_token);
    }
    window.location.href = `${redirectUri}#${params.toString()}`;
  }
}
