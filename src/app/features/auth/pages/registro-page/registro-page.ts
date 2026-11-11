import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../../core/services/auth/auth';
import { passwordMatchValidator } from '../../../validators/password-match.validator';

@Component({
  selector: 'app-registro-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro-page.html',
})
export class RegistroPage {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);
  loading = signal(false);
  submitted = signal(false);
  showPassword = signal(false);
  showConfirm = signal(false);
  passwordFocused = signal(false);
  errorMessage = signal('');

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).+$/)]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordMatchValidator });

  get passwordValue() { return this.form.controls.password.value; }
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

  blockClipboard(event: ClipboardEvent) { event.preventDefault(); }

  async submit() {
    this.submitted.set(true);
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.errorMessage.set('');
    const { name, email, password } = this.form.getRawValue();
    try {
      await this.auth.registerStudent(name.trim(), email.trim(), password);
      await this.router.navigate(['/verificar-correo']);
    } catch (error: any) {
      this.errorMessage.set(error?.code === 'auth/email-already-in-use'
        ? 'Este correo ya está registrado. Inicia sesión o recupera tu contraseña.'
        : 'No se pudo crear la cuenta o enviar el correo. Inténtalo de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }
}
