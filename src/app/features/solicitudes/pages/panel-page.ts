import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SolicitudesService, Solicitud } from '../../../core/services/solicitudes/solicitudes.service';
import { CloudinaryService } from '../../../core/services/cloudinary/cloudinary.service';

type Filtro = 'Todas' | 'Pendiente' | 'Respondida';

@Component({
  selector: 'app-panel-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './panel-page.html',
})
export class PanelPage implements OnInit {

  private solicitudesService = inject(SolicitudesService);
  private cloudinaryService = inject(CloudinaryService);

  cargando = signal(true);
  solicitudes = signal<Solicitud[]>([]);
  filtroActivo = signal<Filtro>('Todas');
  enviandoRespuesta = signal<string | null>(null);

  // Texto de respuesta que está escribiendo el admin, por solicitud (id -> texto)
  respuestasEnEdicion = signal<Record<string, string | undefined>>({});

  // Archivo de imagen seleccionado para la respuesta, por solicitud (id -> File)
  archivosRespuesta = signal<Record<string, File | undefined>>({});
  nombresArchivosRespuesta = signal<Record<string, string | undefined>>({});

  private nombresCapitulos: Record<string, string> = {
    '1': 'Capítulo 1: Ecuaciones Lineales',
    '2': 'Capítulo 2: Álgebra de Matrices',
    '3': 'Capítulo 3: Determinantes',
    '4': 'Capítulo 4: Espacios Vectoriales',
  };

  nombreCapitulo(capitulo: string): string {
    return this.nombresCapitulos[capitulo] ?? `Capítulo ${capitulo}`;
  }

  total = computed(() => this.solicitudes().length);
  totalPendientes = computed(() => this.solicitudes().filter(s => s.estado === 'Pendiente').length);
  totalRespondidas = computed(() => this.solicitudes().filter(s => s.estado === 'Respondida').length);

  solicitudesFiltradas = computed(() => {
    const filtro = this.filtroActivo();
    if (filtro === 'Todas') return this.solicitudes();
    return this.solicitudes().filter(s => s.estado === filtro);
  });

  async ngOnInit() {
    await this.cargarSolicitudes();
  }

  async cargarSolicitudes() {
    this.cargando.set(true);
    try {
      const todas = await this.solicitudesService.obtenerTodasLasSolicitudes();
      this.solicitudes.set(todas);
    } catch (error) {
      console.error('Error al cargar las solicitudes:', error);
    }
    this.cargando.set(false);
  }

  cambiarFiltro(filtro: Filtro) {
    this.filtroActivo.set(filtro);
  }

  actualizarTextoRespuesta(id: string, texto: string) {
    this.respuestasEnEdicion.update(actual => ({ ...actual, [id]: texto }));
  }

  onArchivoSeleccionado(id: string, event: any) {
    const file: File = event.target.files[0];

    if (!file) {
      this.archivosRespuesta.update(actual => ({ ...actual, [id]: undefined }));
      this.nombresArchivosRespuesta.update(actual => ({ ...actual, [id]: undefined }));
      return;
    }

    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 10 * 1024 * 1024; // 10 MB

    if (!tiposPermitidos.includes(file.type)) {
      alert('Solo se permiten imágenes JPG o PNG.');
      event.target.value = '';
      return;
    }

    if (file.size > maxSize) {
      alert('La imagen supera el límite de 10 MB.');
      event.target.value = '';
      return;
    }

    this.archivosRespuesta.update(actual => ({ ...actual, [id]: file }));
    this.nombresArchivosRespuesta.update(actual => ({ ...actual, [id]: file.name }));
  }

  async enviarRespuesta(id: string) {
    const texto = this.respuestasEnEdicion()[id]?.trim();
    const archivo = this.archivosRespuesta()[id];

    if (!texto) {
      alert('Debes escribir una respuesta.');
      return;
    }

    if (!archivo) {
      alert('Debes adjuntar una imagen con la resolución del ejercicio.');
      return;
    }

    this.enviandoRespuesta.set(id);

    try {
      const urlSubida = await this.cloudinaryService.subirImagen(archivo);
      const respuestaImagenUrl = urlSubida ?? undefined;

      await this.solicitudesService.responderSolicitud(id, texto, respuestaImagenUrl);
      await this.cargarSolicitudes();
    } catch (error) {
      console.error('Error al enviar la respuesta:', error);
      alert('No se pudo enviar la respuesta. Inténtalo de nuevo.');
    } finally {
      this.enviandoRespuesta.set(null);
    }
  }
}