import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth as FirebaseAuth, authState } from '@angular/fire/auth';
import { map, take } from 'rxjs';
import { isAdminUser } from '../auth/admin-access';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(FirebaseAuth);
  const router = inject(Router);

  return authState(auth).pipe(
    take(1),
    map(user => {
      // Si no hay sesión, lo manda al login
      if (!user || !user.email) return router.createUrlTree(['/login']);

      // Si está logueado, verificamos si es administrador
      return isAdminUser(user) ? true : router.createUrlTree(['/']);
    })
  );
};
