import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from '../../../../core/services/auth/auth';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private auth = inject(Auth);
  private fb = inject(FormBuilder);
  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  recoveryForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });
  showPassword = signal(false);
  passwordUpdated = signal(false);
  recoveryOpen = signal(false);
  recoverySent = signal(false);
  recoveryLoading = signal(false);
  recoveryError = signal<string | null>(null);
  rememberMe = signal(false);

  constructor() {
    this.passwordUpdated.set(this.route.snapshot.queryParamMap.get('passwordReset') === 'success');
    if (typeof window !== 'undefined') {
      this.rememberMe.set(window.localStorage.getItem('ipt-remember-me') === 'true');
    }
  }

  cargando = signal(false);
  errorMessage = signal<string | null>(null);

  ingresarConGoogle() {
    this.iniciarSesion(() => this.auth.loginWithGoogle());
  }


  ingresarConMicrosoft() {
    this.iniciarSesion(() => this.auth.loginWithMicrosoft());
  }

  async ingresarConCorreo() {
    if (this.form.invalid || this.cargando()) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.errorMessage.set(null);
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.setRememberMe(this.rememberMe());
      const credential = await this.auth.loginWithEmail(email.trim(), password);
      await this.router.navigate([credential.user.emailVerified ? '/' : '/verificar-correo']);
    } catch {
      this.errorMessage.set('No se pudo iniciar sesión. Revisa el correo y la contraseña.');
    } finally { this.cargando.set(false); }
  }

  abrirRecuperacion() {
    this.recoveryForm.reset({ email: this.form.controls.email.value.trim() });
    this.recoverySent.set(false);
    this.recoveryError.set(null);
    this.recoveryOpen.set(true);
  }

  cerrarRecuperacion() {
    if (this.recoveryLoading()) return;
    this.recoveryOpen.set(false);
    this.recoveryError.set(null);
  }

  async enviarEnlaceRecuperacion() {
    if (this.recoveryForm.invalid || this.recoveryLoading()) {
      this.recoveryForm.markAllAsTouched();
      return;
    }

    this.recoveryLoading.set(true);
    this.recoveryError.set(null);
    try {
      await this.auth.resetPassword(this.recoveryForm.controls.email.value.trim());
      this.recoverySent.set(true);
    } catch (error: any) {
      console.error('Error enviando recuperación de contraseña:', error);
      this.recoveryError.set(error?.code === 'auth/unauthorized-continue-uri' || error?.code === 'auth/invalid-continue-uri'
        ? 'No se pudo completar la recuperación desde este dominio. Inténtalo más tarde.'
        : 'No se pudo enviar el enlace. Revisa el correo e inténtalo de nuevo más tarde.');
    } finally {
      this.recoveryLoading.set(false);
    }
  }

  blockClipboard(event: ClipboardEvent) { event.preventDefault(); }

  toggleRememberMe(event: Event) {
    const remember = (event.target as HTMLInputElement).checked;
    this.rememberMe.set(remember);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('ipt-remember-me', String(remember));
    }
  }

  private async iniciarSesion(metodo: () => Promise<any>) {
    this.errorMessage.set(null);
    this.cargando.set(true);

    try {
      await this.auth.setRememberMe(this.rememberMe());
      await metodo();
      await this.router.navigate(['/']);
    } catch (error) {
      console.error('Error de autenticación:', error);
      this.errorMessage.set('No se pudo iniciar sesión. Inténtalo de nuevo.');
    } finally {
      this.cargando.set(false);
    }
  }
}
