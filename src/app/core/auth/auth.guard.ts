import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';
import { ROL } from '../models/usuario.model';

/** Requiere sesión iniciada; si no, manda al login guardando el destino. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated()
    ? true
    : router.createUrlTree(['/ingresar'], {
        queryParams: { returnUrl: state.url },
      });
};

/** Requiere rol Administrador. */
export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.hasRole(ROL.ADMIN)) return true;
  if (auth.isAuthenticated()) return router.createUrlTree(['/']);
  return router.createUrlTree(['/ingresar'], {
    queryParams: { returnUrl: state.url },
  });
};

/** Requiere rol Proveedor (portal del proveedor). */
export const proveedorGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.hasRole(ROL.PROVEEDOR)) return true;
  if (auth.isAuthenticated()) return router.createUrlTree(['/']);
  return router.createUrlTree(['/ingresar'], {
    queryParams: { returnUrl: state.url },
  });
};

/** Requiere rol EncargadoSucursal (panel de la sucursal). */
export const encargadoGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.hasRole(ROL.ENCARGADO)) return true;
  if (auth.isAuthenticated()) return router.createUrlTree(['/']);
  return router.createUrlTree(['/ingresar'], {
    queryParams: { returnUrl: state.url },
  });
};

/** Requiere rol Cajero (panel de caja / venta presencial). */
export const cajeroGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.hasRole(ROL.CAJERO)) return true;
  if (auth.isAuthenticated()) return router.createUrlTree(['/']);
  return router.createUrlTree(['/ingresar'], {
    queryParams: { returnUrl: state.url },
  });
};

/** Para login/registro: si ya hay sesión, no tiene sentido mostrarlos. */
export const noAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? router.createUrlTree(['/']) : true;
};

/**
 * Para la portada pública ('/'): si quien entra es personal (Admin o
 * Proveedor), lo manda directo a su propio panel en vez de mostrarle la
 * vitrina de cliente. El catálogo (/catalogo) sigue quedando accesible
 * para todos si alguna vez quieren revisarlo como lo ve un cliente.
 */
export const redirectStaffGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.hasRole(ROL.ADMIN)) return router.createUrlTree(['/admin/usuarios']);
  if (auth.hasRole(ROL.PROVEEDOR)) return router.createUrlTree(['/proveedor/productos']);
  if (auth.hasRole(ROL.ENCARGADO)) return router.createUrlTree(['/encargado/reservas']);
  if (auth.hasRole(ROL.CAJERO)) return router.createUrlTree(['/caja/nueva-venta']);
  return true;
};
