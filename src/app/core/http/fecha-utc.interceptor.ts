import { HttpEvent, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs';

// El backend guarda todas las fechas en UTC pero Postgres/SQLModel pierden
// la marca de zona horaria al ir y volver de la base ("TIMESTAMP" en vez de
// "TIMESTAMPTZ") — así que llegan como "2026-09-15T02:19:00.123456", sin
// 'Z'. El navegador interpreta un datetime ISO sin offset como si ya fuera
// hora LOCAL (así lo define el propio estándar ECMA-262), así que termina
// mostrando la hora UTC cruda en vez de convertirla a la hora de Bolivia.
//
// Corregir esto bien de raíz implica migrar todas las columnas datetime del
// backend a TIMESTAMPTZ — se dejó anotado para más adelante. Mientras tanto,
// como TODAS las fechas que manda la API son UTC por convención, alcanza
// con marcarlas como tales acá, en un solo lugar, antes de que le lleguen a
// cualquier pantalla que las muestre con `| date`.
const FECHA_SIN_ZONA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/;

function marcarComoUtc(valor: unknown): unknown {
  if (typeof valor === 'string') {
    return FECHA_SIN_ZONA.test(valor) ? `${valor}Z` : valor;
  }
  if (Array.isArray(valor)) {
    return valor.map(marcarComoUtc);
  }
  if (valor && typeof valor === 'object') {
    const resultado: Record<string, unknown> = {};
    for (const [clave, v] of Object.entries(valor)) {
      resultado[clave] = marcarComoUtc(v);
    }
    return resultado;
  }
  return valor;
}

export const fechaUtcInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    map((event: HttpEvent<unknown>) => {
      if (event instanceof HttpResponse && event.body) {
        return event.clone({ body: marcarComoUtc(event.body) });
      }
      return event;
    }),
  );
