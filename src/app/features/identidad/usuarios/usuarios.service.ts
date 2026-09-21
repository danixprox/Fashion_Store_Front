import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Page, Rol, Usuario } from '../../../core/models/usuario.model';

export interface ListarUsuariosParams {
  q?: string;
  rol_id?: number | null;
  activo?: boolean | null;
  page: number;
  size: number;
}

export interface UsuarioCreate {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono?: string | null;
  rol_id: number;
  sucursal_id?: number | null;
  proveedor_id?: number | null;
}

export type UsuarioUpdate = Partial<Omit<UsuarioCreate, 'password'>> & {
  password?: string;
  activo?: boolean;
};

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  listar(p: ListarUsuariosParams): Observable<Page<Usuario>> {
    let params = new HttpParams()
      .set('page', p.page)
      .set('size', p.size);
    if (p.q) params = params.set('q', p.q);
    if (p.rol_id != null) params = params.set('rol_id', p.rol_id);
    if (p.activo != null) params = params.set('activo', p.activo);
    return this.http.get<Page<Usuario>>(`${this.base}/usuarios`, { params });
  }

  roles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(`${this.base}/roles`);
  }

  crear(dto: UsuarioCreate): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.base}/usuarios`, dto);
  }

  actualizar(id: number, dto: UsuarioUpdate): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.base}/usuarios/${id}`, dto);
  }
}
