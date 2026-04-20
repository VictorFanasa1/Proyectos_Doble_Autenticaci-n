import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';

// Ejemplo de rutas en el proyecto cliente (Farmacias Especializadas)
const routes: Routes = [
  {
    // Ruta pública: aquí llega el token en el hash (#id_token=xxx)
    // AppComponent.ngOnInit lo procesa automáticamente
    path: 'FrenteTest',
    loadChildren: () => import('./frente/frente.module').then(m => m.FrenteModule),
    canActivate: [AuthGuard],   // protegida: si no hay token → va al SSO
  },
  {
    path: '',
    redirectTo: 'FrenteTest',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: false })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
