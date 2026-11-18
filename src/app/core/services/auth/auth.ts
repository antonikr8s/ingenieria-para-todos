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
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  applyActionCode as applyFirebaseActionCode,
  confirmPasswordReset as confirmFirebasePasswordReset,
  verifyPasswordResetCode as verifyFirebasePasswordResetCode
} from '@angular/fire/auth';
import { toSignal } from '@angular/core/rxjs-interop';
import { isAdminUser } from '../../auth/admin-access';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private router = inject(Router);
  private firebaseAuth = inject(FirebaseAuth);

  currentUser = toSignal<User | null | undefined>(authState(this.firebaseAuth), {
    initialValue: undefined,
  });

  isLoggedIn = computed(() => {
    const user = this.currentUser();
    return user !== null && user !== undefined;
  });

  isAdmin = computed(() => isAdminUser(this.currentUser()));

  setRememberMe(remember: boolean) {
    return setPersistence(
      this.firebaseAuth,
      remember ? browserLocalPersistence : browserSessionPersistence,
    );
  }

  async logout() {
    await signOut(this.firebaseAuth);
    await this.router.navigate(['/login']);
  }

  async logoutToLogin() {
    return this.logout();
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

  loginWithEmail(email: string, password: string) {
    return signInWithEmailAndPassword(this.firebaseAuth, email, password);
  }

  async registerStudent(name: string, email: string, password: string) {
    const credential = await createUserWithEmailAndPassword(this.firebaseAuth, email, password);
    await updateProfile(credential.user, { displayName: name });
    await this.sendVerification(credential.user);
    return credential.user;
  }

  async resendVerification() {
    const user = this.firebaseAuth.currentUser;
    if (!user) throw new Error('No hay una sesión activa.');
    await this.sendVerification(user);
  }

  /** Correo con diseño de IPT (/api/auth-email); si falla, el estándar de Firebase. */
  private async sendVerification(user: User) {
    const token = await user.getIdToken();
    if (await this.sendBrandedEmail({ type: 'verify' }, token)) return;
    this.firebaseAuth.languageCode = 'es';
    await sendEmailVerification(user);
  }

  /**
   * Llama a la función de Vercel. Devuelve true si el correo con diseño salió.
   * Lanza solo los errores que el usuario debe ver (esperar un minuto, correo inválido);
   * cualquier otro fallo devuelve false para usar el correo de Firebase.
   */
  private async sendBrandedEmail(body: object, idToken?: string): Promise<boolean> {
    try {
      const response = await fetch('/api/auth-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });
      if (response.status === 429) {
        throw Object.assign(new Error('Espera un minuto antes de pedir otro correo.'), { code: 'auth/too-many-requests' });
      }
      if (response.status === 400) {
        throw Object.assign(new Error('Escribe un correo válido.'), { code: 'auth/invalid-email' });
      }
      if (!response.ok) return false;
      const data = await response.json().catch(() => null);
      return data?.sent === true || data?.alreadyVerified === true;
    } catch (error: any) {
      if (error?.code) throw error;
      console.warn('Correo con diseño no disponible; se usa el de Firebase.', error);
      return false;
    }
  }

  async refreshVerification(): Promise<boolean> {
    const user = this.firebaseAuth.currentUser;
    if (!user) return false;
    await user.reload();
    if (user.emailVerified) await user.getIdToken(true);
    return user.emailVerified;
  }

  async resetPassword(email: string) {
    if (await this.sendBrandedEmail({ type: 'reset', email })) return;
    this.firebaseAuth.languageCode = 'es';
    return sendPasswordResetEmail(this.firebaseAuth, email, {
      url: `${window.location.origin}/login?passwordReset=success`,
      handleCodeInApp: false,
    });
  }

  verifyPasswordResetCode(code: string) {
    return verifyFirebasePasswordResetCode(this.firebaseAuth, code);
  }

  confirmPasswordReset(code: string, newPassword: string) {
    return confirmFirebasePasswordReset(this.firebaseAuth, code, newPassword);
  }

  applyEmailActionCode(code: string) {
    return applyFirebaseActionCode(this.firebaseAuth, code);
  }
}
