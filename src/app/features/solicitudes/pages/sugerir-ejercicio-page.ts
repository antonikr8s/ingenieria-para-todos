import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { Auth } from '../../../core/services/auth/auth';
import { SolicitudesService } from '../../../core/services/solicitudes/solicitudes.service';
import { CloudinaryService } from '../../../core/services/cloudinary/cloudinary.service';

@Component({
  selector: 'app-sugerir-ejercicio-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sugerir-ejercicio-page.html',
})
export class SugerirEjercicioPage implements OnInit {

  private fb = inject(FormBuilder);
  private authService = inject(Auth);
  private solicitudesService = inject(SolicitudesService);
  private cloudinaryService = inject(CloudinaryService);

  // Estados de la interfaz
  enviando = signal(false);
  mensajeExito = signal(false);
  errorFoto = signal(false);

  // Estados para validación de días
  verificandoDisponibilidad = signal(true);
  puedeSugerir = signal(false);
  errorDisponibilidad = signal(false);
  errorEnvio = signal('');
  diasRestantes = signal(0);
  fechaDisponible = signal<Date | null>(null);

  // Archivo adjunto
  archivoSeleccionado: File | null = null;


  // Definición del formulario con validaciones
  sugerenciaForm = this.fb.nonNullable.group({

    nombre: [
      '',
      [
        Validators.required,
        Validators.minLength(3)
      ]
    ],

    correo: [
      '',
      [
        Validators.required,
        Validators.email
      ]
    ],

    capitulo: [
      '1',
      Validators.required
    ],

    descripcion: [
      '',
      [
        Validators.required,
        Validators.minLength(10)
      ]
    ]

  });

  // Referencias para usar los campos directamente en el HTML
  get nombre() {
    return this.sugerenciaForm.controls.nombre;
  }

  get correo() {
    return this.sugerenciaForm.controls.correo;
  }

  get descripcion() {
    return this.sugerenciaForm.controls.descripcion;
  }


  // Nombre del archivo seleccionado
  imagenNombre = signal('');


  async ngOnInit() {
    try {
      const user = this.authService.currentUser();

      if (user?.uid) {
        if (user.email) {
          this.sugerenciaForm.patchValue({ correo: user.email });
        }

        const disponibilidad = await this.solicitudesService.verificarDisponibilidad(user.uid);
        this.puedeSugerir.set(disponibilidad.puede);
        this.diasRestantes.set(disponibilidad.diasRestantes);
        this.fechaDisponible.set(disponibilidad.fechaDisponible ?? null);
      }
    } catch (error) {
      console.error('🔥 Error de Firestore (probablemente falta un Índice):', error);
      this.errorDisponibilidad.set(true);
      this.puedeSugerir.set(false);
    } finally {
      this.verificandoDisponibilidad.set(false);
    }
  }


  // Captura la imagen seleccionada
  onFileSelected(event: any) {
    const file: File = event.target.files[0];

    if (!file) {
      this.archivoSeleccionado = null;
      this.imagenNombre.set('');
      return;
    }

    const tiposPermitidos = [
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];

    const maxSize = 10 * 1024 * 1024; // 10 MB


    if (!tiposPermitidos.includes(file.type)) {
      alert('Solo se permiten imágenes JPG o PNG.');
      this.archivoSeleccionado = null;
      this.imagenNombre.set('');
      event.target.value = '';
      return;
    }


    if (file.size > maxSize) {
      alert('La imagen supera el límite de 10 MB.');
      this.archivoSeleccionado = null;
      this.imagenNombre.set('');
      event.target.value = '';
      return;
    }


    this.archivoSeleccionado = file;
    this.imagenNombre.set(file.name);
    this.errorFoto.set(false);
  }


  async enviarSugerencia() {

    // Validar formulario


    if (this.sugerenciaForm.invalid) {
      this.sugerenciaForm.markAllAsTouched();
      return;
    }

    if (!this.archivoSeleccionado) {
      this.errorFoto.set(true);
      return;
    }

    this.errorFoto.set(false);

    const user = this.authService.currentUser();
    if (!user) return;

    this.enviando.set(true);
    this.errorEnvio.set('');

    try {

      // Si el usuario adjuntó una imagen, la subimos a Cloudinary.
      // Si falla o no adjuntó nada, guardamos la petición igual, sin foto.
      let imagenUrl = '';

      if (this.archivoSeleccionado) {
        const urlSubida = await this.cloudinaryService.subirImagen(this.archivoSeleccionado);
        if (!urlSubida) {
          throw new Error('No se pudo cargar la imagen.');
        }
        imagenUrl = urlSubida;
      }

      const datosSolicitud = {
        uid_estudiante: user.uid,
        correo_estudiante: user.email || this.sugerenciaForm.value.correo!,
        nombre_estudiante: this.sugerenciaForm.value.nombre!,
        capitulo: this.sugerenciaForm.value.capitulo!,
        descripcion: this.sugerenciaForm.value.descripcion!,
        imagen_url: imagenUrl
      };

      await this.solicitudesService.crearSolicitud(datosSolicitud);

      // Cambiamos los estados para bloquear nuevas sugerencias
      this.puedeSugerir.set(false);
      this.diasRestantes.set(14);

      // NUEVO: Calculamos y guardamos la fecha exacta a 14 días desde este momento
      const proximaFecha = new Date();
      proximaFecha.setDate(proximaFecha.getDate() + 14);
      this.fechaDisponible.set(proximaFecha);

      this.enviando.set(false);
      this.mensajeExito.set(true);

      // Limpieza del formulario
      this.sugerenciaForm.reset({
        capitulo: '1',
        correo: user.email || ''
      });

      this.archivoSeleccionado = null;
      this.imagenNombre.set('');

      // Ocultar mensaje después de 4 segundos
      setTimeout(() => {
        this.mensajeExito.set(false);
      }, 4000);

    } catch (error) {
      console.error('Error al enviar la sugerencia:', error);
      if (error instanceof Error && error.message === 'REQUEST_COOLDOWN') {
        const fecha = (error as Error & { fechaDisponible?: Date }).fechaDisponible;
        this.puedeSugerir.set(false);
        this.fechaDisponible.set(fecha ?? null);
        this.errorEnvio.set('Ya enviaste una solicitud recientemente. Revisa la fecha en que podrás enviar la siguiente.');
      } else {
        this.errorEnvio.set(error instanceof Error && error.message === 'No se pudo cargar la imagen.'
          ? 'No se pudo cargar la foto. Revisa tu conexión e inténtalo de nuevo.'
          : 'No se pudo guardar tu solicitud. Inténtalo de nuevo.');
      }
      this.enviando.set(false);
    }

  }

}
