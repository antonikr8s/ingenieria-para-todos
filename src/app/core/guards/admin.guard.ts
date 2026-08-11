import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth as FirebaseAuth, authState } from '@angular/fire/auth';
import { map, take } from 'rxjs';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(FirebaseAuth);
  const router = inject(Router);

  // LOS MISMOS ADMINISTRADORES QUE EN EL AUTH SERVICE
  const adminEmails = [
    'antoniogordillo.1808@gmail.com',
    'admin.test@ucuenca.edu.ec'
  ];
  return authState(auth).pipe(
    take(1),
    map(user => {
      // Si no hay sesión, lo manda al login
      if (!user || !user.email) return router.createUrlTree(['/login']);

      // Si está logueado, verificamos si es administrador
      return adminEmails.includes(user.email) ? true : router.createUrlTree(['/']);
    })
  );
};