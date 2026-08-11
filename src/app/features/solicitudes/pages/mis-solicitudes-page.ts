import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { Auth } from '../../../core/services/auth/auth';
import { SolicitudesService, Solicitud } from '../../../core/services/solicitudes/solicitudes.service';

@Component({
  selector: 'app-mis-solicitudes-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mis-solicitudes-page.html',
})
export class MisSolicitudesPage implements OnInit {

  private authService = inject(Auth);
  private solicitudesService = inject(SolicitudesService);

  cargando = signal(true);
  solicitudes = signal<Solicitud[]>([]);

  private nombresCapitulos: Record<string, string> = {
    '1': 'Capítulo 1: Ecuaciones Lineales',
    '2': 'Capítulo 2: Álgebra de Matrices',
    '3': 'Capítulo 3: Determinantes',
    '4': 'Capítulo 4: Espacios Vectoriales',
  };

  nombreCapitulo(capitulo: string): string {
    return this.nombresCapitulos[capitulo] ?? `Capítulo ${capitulo}`;
  }

  async ngOnInit() {
    const user = this.authService.currentUser();

    if (user?.uid) {
      try {
        const misSolicitudes = await this.solicitudesService.obtenerMisSolicitudes(user.uid);
        this.solicitudes.set(misSolicitudes);

        // Marcar como vistas las que fueron respondidas y aún no se habían visto
        const noVistas = misSolicitudes.filter(s => s.estado === 'Respondida' && s.vistoPorEstudiante === false);
        for (const solicitud of noVistas) {
          if (solicitud.id) {
            await this.solicitudesService.marcarComoVisto(solicitud.id);
          }
        }
      } catch (error) {
        console.error('Error al cargar tus solicitudes:', error);
      }
    }

    this.cargando.set(false);
  }
}