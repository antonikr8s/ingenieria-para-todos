import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Auth } from '../../../../core/services/auth/auth';
import { passwordMatchValidator } from '../../../validators/password-match.validator';

@Component({
  selector: 'app-auth-action-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './auth-action-page.html',
})
export class AuthActionPage {
  private route = inject(ActivatedRoute);
  private auth = inject(Auth);
  private fb = inject(FormBuilder);

  mode = signal('');
  email = signal('');
  loading = signal(true);
  submitting = signal(false);
  completed = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);
  showConfirm = signal(false);
  passwordFocused = signal(false);

  form = this.fb.nonNullable.group({
    password: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).+$/),
    ]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordMatchValidator });

  constructor() {
    void this.processActionLink();
  }

  get passwordValue() {
    return this.form.controls.password.value;
  }

  get requirements() {
    const value = this.passwordValue;
    return [
      { label: '8 caracteres mínimo', met: value.length >= 8 },
      { label: 'Una mayúscula', met: /[A-Z]/.test(value) },
      { label: 'Una minúscula', met: /[a-z]/.test(value) },
      { label: 'Un número', met: /\d/.test(value) },
      { label: 'Un carácter especial', met: /[^A-Za-z0-9\s]/.test(value) },
    ];
  }

  blockClipboard(event: ClipboardEvent) {
    event.preventDefault();
  }

  async submitNewPassword() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) return;

    const code = this.route.snapshot.queryParamMap.get('oobCode');
    if (!code) {
      this.errorMessage.set('El enlace no es válido. Solicita uno nuevo desde Iniciar sesión.');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');
    try {
      await this.auth.confirmPasswordReset(code, this.form.controls.password.value);
      this.completed.set(true);
    } catch (error: any) {
      this.errorMessage.set(this.passwordActionError(error));
    } finally {
      this.submitting.set(false);
    }
  }

  private async processActionLink() {
    const mode = this.route.snapshot.queryParamMap.get('mode') ?? '';
    const code = this.route.snapshot.queryParamMap.get('oobCode');
    this.mode.set(mode);

    if (!code) {
      this.errorMessage.set('El enlace está incompleto. Solicita uno nuevo desde Ingeniería para Todos.');
      this.loading.set(false);
      return;
    }

    try {
      if (mode === 'resetPassword') {
        this.email.set(await this.auth.verifyPasswordResetCode(code));
      } else if (['verifyEmail', 'recoverEmail', 'verifyAndChangeEmail'].includes(mode)) {
        await this.auth.applyEmailActionCode(code);
        this.completed.set(true);
      } else {
        this.errorMessage.set('Este enlace no corresponde a una acción disponible.');
      }
    } catch (error: any) {
      this.errorMessage.set(this.passwordActionError(error));
    } finally {
      this.loading.set(false);
    }
  }

  private passwordActionError(error: any) {
    const code = error?.code;
    if (code === 'auth/expired-action-code' || code === 'auth/invalid-action-code') {
      return 'Este enlace venció o ya fue utilizado. Solicita uno nuevo desde Ingeniería para Todos.';
    }
    if (code === 'auth/weak-password') {
      return 'La contraseña no cumple los requisitos indicados.';
    }
    return 'No se pudo completar la solicitud. Revisa el enlace e inténtalo de nuevo.';
  }
}
