import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../../../core/services/auth/auth';

@Component({
  selector: 'app-verificar-correo-page',
  templateUrl: './verificar-correo-page.html',
})
export class VerificarCorreoPage implements OnInit, OnDestroy {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  readonly user = this.auth.currentUser;
  readonly remaining = signal(60);
  readonly busy = signal(false);
  readonly message = signal('');
  private get timerKey() {
    return `ipt-verification-resend-at:${this.user()?.uid ?? 'unknown'}`;
  }
  private timer?: ReturnType<typeof setInterval>;
  private readonly handleFocus = () => void this.syncVerification();
  private readonly handleVisibility = () => {
    if (document.visibilityState === 'visible') void this.syncVerification();
  };

  ngOnInit() {
    if (typeof window === 'undefined') return;

    const storedDeadline = Number(window.localStorage.getItem(this.timerKey));
    const deadline = Number.isFinite(storedDeadline) && storedDeadline > Date.now()
      ? storedDeadline
      : Date.now() + 60_000;
    window.localStorage.setItem(this.timerKey, String(deadline));
    this.startCountdown(deadline);
    window.addEventListener('focus', this.handleFocus);
    document.addEventListener('visibilitychange', this.handleVisibility);
    void this.syncVerification();
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
    if (typeof window !== 'undefined') window.removeEventListener('focus', this.handleFocus);
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', this.handleVisibility);
  }

  async resend() {
    if (this.remaining() > 0 || this.busy()) return;
    this.busy.set(true);
    this.message.set('');
    try {
      await this.auth.resendVerification();
      const deadline = Date.now() + 60_000;
      if (typeof window !== 'undefined') window.localStorage.setItem(this.timerKey, String(deadline));
      this.startCountdown(deadline);
      this.message.set('Te enviamos otro enlace. Revisa también la carpeta de spam.');
    } catch {
      this.message.set('No se pudo reenviar el correo. Inténtalo de nuevo más tarde.');
    } finally {
      this.busy.set(false);
    }
  }

  async accept() {
    await this.auth.logoutToLogin();
  }

  private startCountdown(deadline: number) {
    if (this.timer) clearInterval(this.timer);
    const tick = () => this.remaining.set(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick();
    this.timer = setInterval(tick, 1000);
  }

  private async syncVerification() {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    if (!this.user() || this.busy()) return;
    try {
      if (await this.auth.refreshVerification()) await this.router.navigate(['/']);
    } catch {
      // El aviso sigue disponible; se vuelve a comprobar al regresar a la pestaña.
    }
  }
}
