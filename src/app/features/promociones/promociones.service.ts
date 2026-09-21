import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Promocion, PromocionDto, VarianteOpcion } from '../../core/models/promocion.model';

/** CU33 — Gestionar Promociones (Administrador). */
@Injectable({ providedIn: 'root' })
export class PromocionesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/promociones`;

  variantesOpciones(): Observable<VarianteOpcion[]> {
    return this.http.get<VarianteOpcion[]>(`${this.base}/variantes/opciones`);
  }

  listar(): Observable<Promocion[]> {
    return this.http.get<Promocion[]>(this.base);
  }

  crear(dto: PromocionDto): Observable<Promocion> {
    return this.http.post<Promocion>(this.base, dto);
  }

  actualizar(id: number, dto: Partial<PromocionDto>): Observable<Promocion> {
    return this.http.patch<Promocion>(`${this.base}/${id}`, dto);
  }
}
