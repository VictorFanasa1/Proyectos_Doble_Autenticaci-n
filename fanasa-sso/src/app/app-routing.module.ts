import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './components/login/login.component';
import { AuthCallbackComponent } from './components/auth-callback/auth-callback.component';

const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    // Microsoft redirige aquí tras autenticar.
    // MSAL procesa el hash/code y luego TokenDeliveryService
    // redirige al proyecto cliente.
    path: 'auth/callback',
    component: AuthCallbackComponent,
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: false })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
