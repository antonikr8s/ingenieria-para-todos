import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../../core/services/auth/auth';
import { passwordMatchValidator } from '../../../validators/password-match.validator';

const NAME_PARTICLES = new Set(['de', 'del', 'la', 'las', 'los', 'y']);

function validateStudentName(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  if (!value) return { required: true };
  if (/[^\p{L}\s]/u.test(value)) return { nameCharacters: true };

  const words = value.split(/\s+/);
  if (words.length < 2) return { nameParts: true };
  if (words.length > 4) return { tooManyNameParts: true };

  const nameWords = words.filter(word => !NAME_PARTICLES.has(word.toLocaleLowerCase('es')));
  if (nameWords.length < 2) return { nameParts: true };
  if (nameWords.some(word => [...word].length < 4)) return { shortNamePart: true };
  return null;
}

function formatName(value: string): string {
  return value
    .replace(/[^\p{L}\s]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .split(' ')
    .map(word => word
      ? word.charAt(0).toLocaleUpperCase('es') + word.slice(1).toLocaleLowerCase('es')
      : '')
    .join(' ');
}

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
    name: ['', [validateStudentName]],
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

  formatNameInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const cursor = input.selectionStart ?? input.value.length;
    const formattedPrefix = formatName(input.value.slice(0, cursor));
    const formattedValue = formatName(input.value);
    input.value = formattedValue;
    this.form.controls.name.setValue(formattedValue);
    input.setSelectionRange(formattedPrefix.length, formattedPrefix.length);
  }

  nameError(): string {
    const errors = this.form.controls.name.errors;
    if (!errors) return '';
    if (errors['required']) return 'Escribe tu nombre y al menos un apellido.';
    if (errors['nameCharacters']) return 'Usa solo letras y espacios; no se permiten números ni signos.';
    if (errors['tooManyNameParts']) return 'Escribe como máximo cuatro palabras.';
    if (errors['shortNamePart']) return 'Cada nombre o apellido debe tener al menos cuatro letras.';
    return 'Escribe al menos un nombre y un apellido.';
  }

  async submit() {
    this.submitted.set(true);
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.errorMessage.set('');
    const { name, email, password } = this.form.getRawValue();
    try {
      await this.auth.registerStudent(formatName(name).trim(), email.trim(), password);
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
