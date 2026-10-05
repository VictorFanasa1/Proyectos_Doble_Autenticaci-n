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
    if (payload.access_token)    params.set('access_token',    payload.access_token);
    if (payload.employee_number) params.set('employee_number', payload.employee_number);
    if (payload.area)            params.set('area',            payload.area);
    if (payload.manager)         params.set('manager',         payload.manager);
    if (payload.job_title)       params.set('job_title',       payload.job_title);
    if (payload.display_name)    params.set('display_name',    payload.display_name);
    if (payload.given_name)      params.set('given_name',      payload.given_name);
    if (payload.family_name)     params.set('family_name',     payload.family_name);
    if (payload.mail)            params.set('mail',            payload.mail);
    if (payload.department)      params.set('department',      payload.department);
    if (payload.mobile_phone)    params.set('mobile_phone',    payload.mobile_phone);
    if (payload.office_location) params.set('office_location', payload.office_location);
    window.location.href = `${redirectUri}#${params.toString()}`;
  }
}
