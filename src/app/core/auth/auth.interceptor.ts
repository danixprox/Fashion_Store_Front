import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { TokenService } from './token.service';

/**
 * - Agrega `Authorization: Bearer <token>` a las llamadas al API.
 * - Si el backend responde 401, limpia la sesión y manda al login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokens = inject(TokenService);
  const router = inject(Router);
  const token = tokens.get();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err) => {
      if (err?.status === 401 && token) {
        tokens.clear();
        void router.navigate(['/ingresar']);
      }
      return throwError(() => err);
    }),
  );
};
