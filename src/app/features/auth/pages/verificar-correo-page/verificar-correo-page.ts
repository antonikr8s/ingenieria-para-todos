import { Component, OnDestroy, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../../core/services/auth/auth';

@Component({
  selector: 'app-verificar-correo-page',
  imports: [RouterLink],
  templateUrl: './verificar-correo-page.html',
})
export class VerificarCorreoPage implements OnDestroy {
  private auth = inject(Auth);
  private router = inject(Router);
  readonly user = this.auth.currentUser;
  readonly remaining = signal(60);
  readonly busy = signal(false);
  readonly message = signal('');
  private timer = setInterval(() => this.remaining.update(value => Math.max(0, value - 1)), 1000);

  ngOnDestroy() { clearInterval(this.timer); }

  async check() {
    this.busy.set(true);
    try {
      if (await this.auth.refreshVerification()) await this.router.navigate(['/']);
      else this.message.set('Tu correo aún no está verificado. Abre el enlace e inténtalo nuevamente.');
    } catch { this.message.set('No se pudo comprobar la verificación. Inténtalo de nuevo.'); }
    finally { this.busy.set(false); }
  }

  async resend() {
    if (this.remaining() > 0 || this.busy()) return;
    this.busy.set(true);
    try {
      await this.auth.resendVerification();
      this.remaining.set(60);
      this.message.set('Te enviamos otro enlace de verificación.');
    } catch { this.message.set('No se pudo reenviar el correo. Espera un momento e inténtalo de nuevo.'); }
    finally { this.busy.set(false); }
  }

  async changeAccount() {
    this.auth.logout();
  }
}
