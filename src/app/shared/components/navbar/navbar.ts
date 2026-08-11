import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
})
export class NavbarComponent {
  // Signal para controlar si el menú móvil está abierto o cerrado
  isMobileMenuOpen = signal(false);

  toggleMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }

  // Cierra el menú automáticamente cuando el usuario hace clic en un enlace
  closeMenu() {
    this.isMobileMenuOpen.set(false);
  }
}