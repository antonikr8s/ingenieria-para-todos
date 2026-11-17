import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../../core/services/auth/auth';
import { NotificacionesService } from '../../core/services/notificaciones/notificaciones.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  // El host es el elemento fijo: así el header sigue pegado arriba al hacer
  // scroll y el menú móvil se posiciona justo debajo de la barra.
  host: { class: 'block sticky top-0 z-50' },
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