import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth as FirebaseAuth, authState, signOut } from '@angular/fire/auth';
import { from, switchMap, take } from 'rxjs';
import { isAdminUser } from '../auth/admin-access';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(FirebaseAuth);
  const router = inject(Router);

  // Espera a que Firebase restaure la sesión persistida antes de decidir.
  // Así, al abrir /panel directamente, no confundimos una sesión aún cargando
  // con una visita sin autenticar.
  return from(auth.authStateReady()).pipe(
    switchMap(() => authState(auth).pipe(take(1))),
    switchMap(async user => {
      if (isAdminUser(user)) return true;

      // /login está reservado a visitantes. Cerramos una sesión autenticada
      // sin permisos para que el guard de visitantes permita mostrar el login.
      if (user) await signOut(auth);

      return router.createUrlTree(['/login']);
    })
  );
};
