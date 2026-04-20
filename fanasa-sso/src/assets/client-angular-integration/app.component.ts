import { Component, OnInit } from '@angular/core';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  template: `<router-outlet></router-outlet>`,
})
export class AppComponent implements OnInit {

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Intercepta el retorno del SSO en cualquier página de la app.
    // Si la URL tiene #id_token=xxx lo guarda y limpia el hash.
    this.authService.handleCallback();
  }
}
