import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

export interface Subtema {
  numero: string;
  titulo: string;
  ejemplosTexto: string;
  youtubeUrl: string;
  pdfUrl: string;
}

export interface Capitulo {
  id?: string;
  titulo: string;
  descripcion: string;
  subtemas: Subtema[];
}

@Injectable({
  providedIn: 'root',
})
export class CapitulosService {
  private firestore = inject(Firestore);

  async obtenerCapitulo(id: string): Promise<Capitulo | null> {
    const capituloRef = doc(this.firestore, 'capitulos', id);
    const snapshot = await getDoc(capituloRef);

    if (!snapshot.exists()) {
      return null;
    }

    return { id: snapshot.id, ...snapshot.data() } as Capitulo;
  }
}