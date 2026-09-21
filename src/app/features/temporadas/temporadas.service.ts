import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Page } from '../../core/models/usuario.model';
import { Coleccion, Temporada } from '../../core/models/temporada.model';

@Injectable({ providedIn: 'root' })
export class TemporadasService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  // --- Temporadas ---
  listarTemporadas(q: string, page: number, size: number): Observable<Page<Temporada>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (q) params = params.set('q', q);
    return this.http.get<Page<Temporada>>(`${this.base}/temporadas`, { params });
  }
  opcionesTemporadas(): Observable<Temporada[]> {
    return this.http.get<Temporada[]>(`${this.base}/temporadas/opciones`);
  }
  crearTemporada(dto: {
    nombre: string;
    fecha_inicio?: string | null;
    fecha_fin?: string | null;
  }) {
    return this.http.post<Temporada>(`${this.base}/temporadas`, dto);
  }
  actualizarTemporada(
    id: number,
    dto: {
      nombre?: string;
      fecha_inicio?: string | null;
      fecha_fin?: string | null;
      activo?: boolean;
    },
  ) {
    return this.http.patch<Temporada>(`${this.base}/temporadas/${id}`, dto);
  }

  // --- Colecciones ---
  opcionesColecciones(temporadaId?: number): Observable<Coleccion[]> {
    let params = new HttpParams();
    if (temporadaId != null) params = params.set('temporada_id', temporadaId);
    return this.http.get<Coleccion[]>(`${this.base}/colecciones/opciones`, {
      params,
    });
  }
  listarColecciones(
    q: string,
    temporadaId: number | null,
    page: number,
    size: number,
  ): Observable<Page<Coleccion>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (q) params = params.set('q', q);
    if (temporadaId != null) params = params.set('temporada_id', temporadaId);
    return this.http.get<Page<Coleccion>>(`${this.base}/colecciones`, { params });
  }
  crearColeccion(dto: {
    nombre: string;
    descripcion?: string | null;
    temporada_id: number;
  }) {
    return this.http.post<Coleccion>(`${this.base}/colecciones`, dto);
  }
  actualizarColeccion(
    id: number,
    dto: {
      nombre?: string;
      descripcion?: string | null;
      temporada_id?: number;
      activo?: boolean;
    },
  ) {
    return this.http.patch<Coleccion>(`${this.base}/colecciones/${id}`, dto);
  }
}
