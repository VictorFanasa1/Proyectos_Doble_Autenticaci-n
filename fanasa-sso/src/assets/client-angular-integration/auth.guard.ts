import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }
    // No autenticado → mandar al SSO.
    // El SSO regresará a esta misma URL con el token en el hash.
    this.authService.redirectToLogin('Farmacias Especializadas');
    return false;
  }
}
