import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { CapitulosService, Capitulo } from '../../../../core/services/capitulos/capitulos.service';
import { MathRenderPipe } from '../../../../shared/pipes/math-render.pipe';

@Component({
  selector: 'app-capitulo-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MathRenderPipe],
  templateUrl: './capitulo-page.html',
})
export class CapituloPage implements OnInit {
  private route = inject(ActivatedRoute);
  private capitulosService = inject(CapitulosService);

  // Leemos el parámetro 'id' de la URL
  capituloId = toSignal(
    this.route.paramMap.pipe(map(params => params.get('id') ?? '1')),
    { initialValue: '1' }
  );

  cargando = signal(true);
  capitulo = signal<Capitulo | null>(null);

  async ngOnInit() {
    await this.cargarCapitulo();
  }

  async cargarCapitulo() {
    this.cargando.set(true);
    const id = this.capituloId();

    try {
      const data = await this.capitulosService.obtenerCapitulo(id);
      this.capitulo.set(data);
    } catch (error) {
      console.error('Error al cargar el capítulo:', error);
      this.capitulo.set(null);
    }

    this.cargando.set(false);
  }

  // Navegación tipo "scroll to section" al hacer clic en la tabla de contenido
  irASubtema(numero: string) {
    const idElemento = 'subtema-' + numero.replace('.', '-');
    const elemento = document.getElementById(idElemento);

    if (elemento) {
      elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}