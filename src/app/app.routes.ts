import { Routes } from '@angular/router';
import { Home } from './features/home/pages/home-page/home-page';
import { LoginPage } from './features/auth/pages/login-page/login-page';
import { CrearCuentaPage } from './features/auth/pages/crear-cuenta-page/crear-cuenta-page';
import { IniciarCuentaPage } from './features/auth/pages/iniciar-cuenta-page/iniciar-cuenta-page';
import { CapituloPage } from './features/home/pages/capitulo-page/capitulo-page';
import { SugerirEjercicioPage } from './features/solicitudes/pages/sugerir-ejercicio-page';
import { MisSolicitudesPage } from './features/solicitudes/pages/mis-solicitudes-page';
import { PanelPage } from './features/solicitudes/pages/panel-page';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    title: 'Ingeniería para Todos - Inicio'
  },
  {
    path: 'sugerir-ejercicio',
    component: SugerirEjercicioPage,
    canActivate: [authGuard],
    title: 'Sugerir Ejercicio | Ingeniería para Todos'
  },
  {
    path: 'mis-solicitudes',
    component: MisSolicitudesPage,
    canActivate: [authGuard],
    title: 'Mis Solicitudes | Ingeniería para Todos'
  },
  {
    path: 'panel',
    component: PanelPage,
    canActivate: [adminGuard],
    title: 'Panel de Administración | Ingeniería para Todos'
  },
  {
    path: 'login',
    component: LoginPage,
    canActivate: [guestGuard],
    title: 'Iniciar Sesión | Ingeniería para Todos'
  },
  {
    path: 'crear-cuenta',
    component: CrearCuentaPage,
    title: 'Ingeniería para Todos'
  },
  {
    path: 'iniciar-cuenta',
    component: IniciarCuentaPage,
    title: 'Ingeniería para Todos'
  },
  {
    path: 'registro',
    redirectTo: 'login'
  },
  {
    path: 'capitulo/:id',
    component: CapituloPage,
    title: 'Capítulo de Estudio | Ingeniería para Todos'
  },
  {
    path: '**',
    redirectTo: ''
  }
];