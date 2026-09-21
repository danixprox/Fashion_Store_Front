import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Page } from '../../core/models/usuario.model';
import {
  HorarioDia,
  Sucursal,
  SucursalOpcion,
} from '../../core/models/sucursal.model';

export interface SucursalCreate {
  nombre: string;
  ciudad: string;
  direccion: string;
  telefono?: string | null;
  horario_atencion?: string | null;
}

export type SucursalUpdate = Partial<SucursalCreate> & { activa?: boolean };

@Injectable({ providedIn: 'root' })
export class SucursalesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/sucursales`;

  listar(p: {
    q?: string;
    activa?: boolean | null;
    page: number;
    size: number;
  }): Observable<Page<Sucursal>> {
    let params = new HttpParams().set('page', p.page).set('size', p.size);
    if (p.q) params = params.set('q', p.q);
    if (p.activa != null) params = params.set('activa', p.activa);
    return this.http.get<Page<Sucursal>>(this.base, { params });
  }

  opciones(): Observable<SucursalOpcion[]> {
    return this.http.get<SucursalOpcion[]>(`${this.base}/opciones`);
  }

  crear(dto: SucursalCreate): Observable<Sucursal> {
    return this.http.post<Sucursal>(this.base, dto);
  }

  actualizar(id: number, dto: SucursalUpdate): Observable<Sucursal> {
    return this.http.patch<Sucursal>(`${this.base}/${id}`, dto);
  }

  // CU16
  obtenerHorarios(id: number): Observable<HorarioDia[]> {
    return this.http.get<HorarioDia[]>(`${this.base}/${id}/horarios`);
  }

  guardarHorarios(id: number, dias: HorarioDia[]): Observable<HorarioDia[]> {
    return this.http.put<HorarioDia[]>(`${this.base}/${id}/horarios`, { dias });
  }
}
