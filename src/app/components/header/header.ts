import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../../core/services/auth/auth';
import { NotificacionesService } from '../../core/services/notificaciones/notificaciones.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
})
export class Header {
  auth = inject(Auth);
  private notificacionesService = inject(NotificacionesService);

  mensajesNuevosCliente = this.notificacionesService.respondidasNoVistas;
  mensajesNuevosProgramador = this.notificacionesService.pendientesAdmin;

  isMobileMenuOpen = signal(false);
  // ... el resto igual


  toggleMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }

  // Cierra el menú automáticamente cuando el usuario hace clic en un enlace
  closeMenu() {
    this.isMobileMenuOpen.set(false);
  }
}