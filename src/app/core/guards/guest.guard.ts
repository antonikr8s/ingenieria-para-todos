import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth as FirebaseAuth, authState } from '@angular/fire/auth';
import { map, take } from 'rxjs';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(FirebaseAuth);
  const router = inject(Router);

  // Esperamos a Firebase. Si hay usuario, lo mandamos al Home. Si no, lo dejamos pasar al Login.
  return authState(auth).pipe(
    take(1),
    map(user => !user ? true :
      user.providerData.some(provider => provider.providerId === 'password') && !user.emailVerified
        ? router.createUrlTree(['/verificar-correo']) : router.createUrlTree(['/']))
  );
};
