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

  loginWithEmail(email: string, password: string) {
    return signInWithEmailAndPassword(this.firebaseAuth, email, password);
  }

  async registerStudent(name: string, email: string, password: string) {
    const credential = await createUserWithEmailAndPassword(this.firebaseAuth, email, password);
    await updateProfile(credential.user, { displayName: name });
    await sendEmailVerification(credential.user);
    return credential.user;
  }

  resendVerification() {
    const user = this.firebaseAuth.currentUser;
    if (!user) throw new Error('No hay una sesión activa.');
    return sendEmailVerification(user);
  }

  async refreshVerification(): Promise<boolean> {
    const user = this.firebaseAuth.currentUser;
    if (!user) return false;
    await user.reload();
    if (user.emailVerified) await user.getIdToken(true);
    return user.emailVerified;
  }

  resetPassword(email: string) {
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
