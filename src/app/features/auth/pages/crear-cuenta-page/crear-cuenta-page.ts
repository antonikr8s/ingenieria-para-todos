import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { passwordMatchValidator } from '../../../validators/password-match.validator';
import { emailUniqueValidator } from '../../../validators/email-unique.validator';import { Auth } from '../../../../core/services/auth/auth';

@Component({
  selector: 'app-crear-cuenta-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './crear-cuenta-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrearCuentaPage {

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(Auth);

  showPassword = signal(false);
  showConfirmPassword = signal(false);
  cargando = signal(false);

  form = this.fb.group({
    email: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.pattern(
          /^[a-zA-Z0-9._%+-]+@((gmail|hotmail|outlook)\.com|[a-zA-Z0-9.-]+\.edu\.ec)$/
        ),
      ],
      [emailUniqueValidator()],
    ],

    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
      ],
    ],

    confirmPassword: ['', [Validators.required]],
  }, {
    validators: passwordMatchValidator,
  });

  get email() {
    return this.form.get('email')!;
  }

  get password() {
    return this.form.get('password')!;
  }

  get confirmPassword() {
    return this.form.get('confirmPassword')!;
  }

  togglePassword(): void {
    this.showPassword.set(!this.showPassword());
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  async onSubmit(): Promise<void> {

    if (this.cargando()) {
      return;
    }

    if (this.form.pending) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando.set(true);

    try {
      const { email, password } = this.form.getRawValue();

      await this.authService.registerWithEmail(email!, password!);

      console.log('Cuenta de prueba creada en Firebase exitosamente.');

      await this.router.navigate(['/']);

    } catch (error) {
      console.error('Error durante el registro:', error);

      alert(
        'Hubo un inconveniente al intentar crear la cuenta. Verifique la información e intente nuevamente.'
      );
    } finally {
      this.cargando.set(false);
    }
  }
}