import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

export function emailUniqueValidator(): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const correosTomados = ['test@test.com', 'admin@admin.com', 'cagordillot@email.com'];
    
    return of(control.value).pipe(
      delay(500), 
      map((email: string) => {
        return correosTomados.includes(email) ? { emailTaken: true } : null;
      })
    );
  };
}