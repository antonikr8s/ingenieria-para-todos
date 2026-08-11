import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  doc,
  updateDoc
} from '@angular/fire/firestore';

// Interfaz local para mantener el tipado fuerte
export interface Solicitud {
  id?: string;
  uid_estudiante: string;
  correo_estudiante: string;
  nombre_estudiante: string;
  capitulo: string;
  imagen_url: string;
  descripcion: string;
  fecha_creacion?: any;
  fecha_respuesta?: any;
  estado: 'Pendiente' | 'Respondida';
  respuesta?: string;
  respuestaImagenUrl?: string;
  vistoPorEstudiante?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SolicitudesService {
  private firestore = inject(Firestore);

  // Hacemos referencia a la colección 'peticiones' en Firestore
  private peticionesRef = collection(this.firestore, 'peticiones');

  /**
   * 1. Verifica si el estudiante puede enviar un nuevo ejercicio (Regla de 14 días)
   */
  async verificarDisponibilidad(uidEstudiante: string): Promise<{ puede: boolean, diasRestantes: number, fechaDisponible?: Date }> {
    const q = query(
      this.peticionesRef,
      where('uid_estudiante', '==', uidEstudiante),
      orderBy('fecha_creacion', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { puede: true, diasRestantes: 0 };
    }

    const ultimaPeticion = snapshot.docs[0].data();
    const fechaUltima = ultimaPeticion['fecha_creacion'].toDate();
    const fechaActual = new Date();

    const diferenciaMilisegundos = fechaActual.getTime() - fechaUltima.getTime();
    const diasTranscurridos = Math.floor(diferenciaMilisegundos / (1000 * 60 * 60 * 24));

    // Calculamos la fecha exacta en que se cumplen los 14 días desde la última petición
    const fechaDisponible = new Date(fechaUltima);
    fechaDisponible.setDate(fechaDisponible.getDate() + 14);

    if (diasTranscurridos < 14) {
      return { puede: false, diasRestantes: 14 - diasTranscurridos, fechaDisponible };
    }

    return { puede: true, diasRestantes: 0 };
  }


  /**
   * 2. Crea una nueva solicitud en Firestore
   */
  async crearSolicitud(solicitud: Partial<Solicitud>) {
    return addDoc(this.peticionesRef, {
      ...solicitud,
      fecha_creacion: Timestamp.fromDate(new Date()),
      estado: 'Pendiente',
      vistoPorEstudiante: true
    });
  }

  /**
   * 3. Obtiene todas las solicitudes de un estudiante, ordenadas de más reciente a más antigua
   */
  async obtenerMisSolicitudes(uidEstudiante: string): Promise<Solicitud[]> {
    const q = query(
      this.peticionesRef,
      where('uid_estudiante', '==', uidEstudiante),
      orderBy('fecha_creacion', 'desc')
    );

    const snapshot = await getDocs(q);

    const solicitudes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Solicitud));

    // Ordenamos por "última actividad": si tiene fecha_respuesta, usamos esa;
    // si no, usamos fecha_creacion. Así lo más recientemente respondido queda primero.
    return solicitudes.sort((a, b) => {
      const fechaA = a.fecha_respuesta?.toDate?.() ?? a.fecha_creacion?.toDate?.() ?? new Date(0);
      const fechaB = b.fecha_respuesta?.toDate?.() ?? b.fecha_creacion?.toDate?.() ?? new Date(0);
      return fechaB.getTime() - fechaA.getTime();
    });
  }

  /**
   * 4. Obtiene TODAS las solicitudes (solo para el admin), ordenadas de más reciente a más antigua
   */
  async obtenerTodasLasSolicitudes(): Promise<Solicitud[]> {
    const q = query(
      this.peticionesRef,
      orderBy('fecha_creacion', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Solicitud));
  }

  /**
   * 5. El admin responde una solicitud: guarda el texto y cambia el estado
   */
  async responderSolicitud(id: string, respuesta: string, respuestaImagenUrl?: string) {
    const solicitudRef = doc(this.firestore, 'peticiones', id);
    return updateDoc(solicitudRef, {
      respuesta: respuesta,
      respuestaImagenUrl: respuestaImagenUrl ?? '',
      estado: 'Respondida',
      vistoPorEstudiante: false,
      fecha_respuesta: Timestamp.fromDate(new Date())
    });
  }

  async marcarComoVisto(id: string) {
    const solicitudRef = doc(this.firestore, 'peticiones', id);
    return updateDoc(solicitudRef, {
      vistoPorEstudiante: true
    });
  }

}