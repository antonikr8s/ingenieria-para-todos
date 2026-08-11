import { Injectable, inject, signal } from '@angular/core';
import { Firestore, collection, query, where, onSnapshot } from '@angular/fire/firestore';
import { Auth as FirebaseAuth, authState } from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private firestore = inject(Firestore);
  private firebaseAuth = inject(FirebaseAuth);

  private readonly ADMIN_EMAILS = [
    'antoniogordillo.1808@gmail.com',
    'admin.test@ucuenca.edu.ec'
  ];
  // Cuántas solicitudes están Pendientes (para el admin)
  pendientesAdmin = signal(0);

  // Cuántas solicitudes del estudiante fueron respondidas y aún no vistas
  respondidasNoVistas = signal(0);

  constructor() {
    authState(this.firebaseAuth).subscribe(user => {
      if (!user) {
        this.pendientesAdmin.set(0);
        this.respondidasNoVistas.set(0);
        return;
      }

      if (this.ADMIN_EMAILS.includes(user.email ?? '')) {
        this.escucharPendientesAdmin();
      } else {
        this.escucharRespondidasEstudiante(user.uid);
      }
    });
  }

  private escucharPendientesAdmin() {
    const peticionesRef = collection(this.firestore, 'peticiones');
    const q = query(peticionesRef, where('estado', '==', 'Pendiente'));

    onSnapshot(q, snapshot => {
      this.pendientesAdmin.set(snapshot.size);
    });
  }

  private escucharRespondidasEstudiante(uid: string) {
    const peticionesRef = collection(this.firestore, 'peticiones');
    const q = query(
      peticionesRef,
      where('uid_estudiante', '==', uid),
      where('estado', '==', 'Respondida'),
      where('vistoPorEstudiante', '==', false)
    );

    onSnapshot(q, snapshot => {
      this.respondidasNoVistas.set(snapshot.size);
    });
  }
}