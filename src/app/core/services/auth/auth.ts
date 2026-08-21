import { Injectable, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  Auth as FirebaseAuth,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signOut,
  authState,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from '@angular/fire/auth';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private router = inject(Router);
  private firebaseAuth = inject(FirebaseAuth);

  private adminEmails = [
    'antoniogordillo.1808@gmail.com',
    'admin.test@ucuenca.edu.ec'
  ];

  currentUser = toSignal<User | null | undefined>(authState(this.firebaseAuth), {
    initialValue: undefined,
  });

  isLoggedIn = computed(() => {
    const user = this.currentUser();
    return user !== null && user !== undefined;
  });

  isAdmin = computed(() => {
    const user = this.currentUser();
    if (!user || !user.email) return false;
    return this.adminEmails.includes(user.email);
  });

  logout() {
    signOut(this.firebaseAuth).then(() => {
      this.router.navigate(['/']);
    });
  }

  loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return signInWithPopup(this.firebaseAuth, provider);
  }

  loginWithMicrosoft() {
    const provider = new OAuthProvider('microsoft.com');
    provider.setCustomParameters({ prompt: 'select_account' });
    return signInWithPopup(this.firebaseAuth, provider);
  }

  // Solo para la ruta oculta /crear-cuenta (cuentas de prueba internas)
  registerWithEmail(email: string, password: string) {
    return createUserWithEmailAndPassword(this.firebaseAuth, email, password);
  }

  loginWithEmail(email: string, password: string) {
    return signInWithEmailAndPassword(this.firebaseAuth, email, password);
  }
}