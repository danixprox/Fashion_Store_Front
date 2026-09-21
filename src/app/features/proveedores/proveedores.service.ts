import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Page } from '../../core/models/usuario.model';
import { Proveedor, ProveedorOpcion } from '../../core/models/proveedor.model';

export interface ProveedorCreate {
  nombre_empresa: string;
  contacto?: string | null;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
}

export type ProveedorUpdate = Partial<ProveedorCreate> & { activo?: boolean };

@Injectable({ providedIn: 'root' })
export class ProveedoresService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/proveedores`;

  listar(p: {
    q?: string;
    activo?: boolean | null;
    page: number;
    size: number;
  }): Observable<Page<Proveedor>> {
    let params = new HttpParams().set('page', p.page).set('size', p.size);
    if (p.q) params = params.set('q', p.q);
    if (p.activo != null) params = params.set('activo', p.activo);
    return this.http.get<Page<Proveedor>>(this.base, { params });
  }

  opciones(): Observable<ProveedorOpcion[]> {
    return this.http.get<ProveedorOpcion[]>(`${this.base}/opciones`);
  }

  crear(dto: ProveedorCreate): Observable<Proveedor> {
    return this.http.post<Proveedor>(this.base, dto);
  }

  actualizar(id: number, dto: ProveedorUpdate): Observable<Proveedor> {
    return this.http.patch<Proveedor>(`${this.base}/${id}`, dto);
  }
}
