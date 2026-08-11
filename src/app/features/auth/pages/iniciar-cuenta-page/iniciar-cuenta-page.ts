import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../../core/services/auth/auth';

@Component({
  selector: 'app-iniciar-cuenta-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './iniciar-cuenta-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IniciarCuentaPage {

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private auth = inject(Auth);

  showPassword = signal(false);
  cargando = signal(false);
  errorMessage = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  get email() { return this.form.get('email')!; }
  get password() { return this.form.get('password')!; }

  togglePassword(): void {
    this.showPassword.set(!this.showPassword());
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.cargando.set(true);

    const { email, password } = this.form.value;

    this.auth.loginWithEmail(email!, password!)
      .then(() => {
        this.cargando.set(false);
        this.router.navigate(['/']);
      })
      .catch((error) => {
        this.cargando.set(false);
        console.error('Error de autenticación:', error);
        this.errorMessage.set('El correo o la contraseña son incorrectos.');
      });
  }
}