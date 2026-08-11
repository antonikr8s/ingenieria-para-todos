import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CloudinaryService {
  private http = inject(HttpClient);

  // Configuración de tu cuenta de Cloudinary
  private readonly CLOUD_NAME = 'aanwag7p';
  private readonly UPLOAD_PRESET = 'ingenieria_peticion_ejercicios';
  private readonly UPLOAD_URL = `https://api.cloudinary.com/v1_1/${this.CLOUD_NAME}/image/upload`;

  /**
   * Sube una imagen a Cloudinary y devuelve la URL segura (https).
   * Si la subida falla, devuelve null en lugar de lanzar el error,
   * para que el componente decida qué hacer (guardar la petición sin foto).
   */
  async subirImagen(file: File): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.UPLOAD_PRESET);

      const respuesta: any = await firstValueFrom(
        this.http.post(this.UPLOAD_URL, formData)
      );

      return respuesta.secure_url ?? null;
    } catch (error) {
      console.error('⚠️ No se pudo subir la imagen a Cloudinary:', error);
      return null;
    }
  }
}