import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../../../core/services/auth/auth';

@Component({
  selector: 'app-login-page',
  imports: [],
  templateUrl: './login-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {

  private router = inject(Router);
  private auth = inject(Auth);

  cargando = signal(false);
  errorMessage = signal<string | null>(null);

  ingresarConGoogle() {
    this.iniciarSesion(() => this.auth.loginWithGoogle());
  }

  ingresarConFacebook() {
    this.iniciarSesion(() => this.auth.loginWithFacebook());
  }

  ingresarConMicrosoft() {
    this.iniciarSesion(() => this.auth.loginWithMicrosoft());
  }

  private iniciarSesion(metodo: () => Promise<any>) {
    this.errorMessage.set(null);
    this.cargando.set(true);

    metodo()
      .then(() => {
        this.cargando.set(false);
        this.router.navigate(['/']);
      })
      .catch((error) => {
        this.cargando.set(false);
        console.error('Error de autenticación:', error);
        this.errorMessage.set('No se pudo iniciar sesión. Inténtalo de nuevo.');
      });
  }
}