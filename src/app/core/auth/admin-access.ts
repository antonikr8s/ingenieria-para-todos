import type { User } from '@angular/fire/auth';

const ADMIN_EMAIL = 'antoniogordillo.1808@gmail.com';

export function isAdminUser(user: User | null | undefined): boolean {
  return user?.emailVerified === true && user.email?.toLowerCase() === ADMIN_EMAIL;
}
