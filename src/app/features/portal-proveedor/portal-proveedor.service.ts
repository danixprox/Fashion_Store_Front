import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Page } from '../../core/models/usuario.model';
import {
  Producto,
  ProductoDetalle,
  Variante,
} from '../../core/models/producto.model';
import {
  ProductoCreate,
  ProductoUpdate,
  VarianteCreate,
  VarianteUpdate,
} from '../productos/productos.service';

export interface PerfilProveedor {
  id: number;
  nombre_empresa: string;
  email: string | null;
  telefono: string | null;
}

@Injectable({ providedIn: 'root' })
export class PortalProveedorService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/portal-proveedor`;

  perfil(): Observable<PerfilProveedor> {
    return this.http.get<PerfilProveedor>(`${this.base}/perfil`);
  }

  listar(q: string, page: number, size: number): Observable<Page<Producto>> {
    let p = new HttpParams().set('page', page).set('size', size);
    if (q) p = p.set('q', q);
    return this.http.get<Page<Producto>>(`${this.base}/productos`, { params: p });
  }

  obtener(id: number): Observable<ProductoDetalle> {
    return this.http.get<ProductoDetalle>(`${this.base}/productos/${id}`);
  }

  crear(dto: ProductoCreate): Observable<Producto> {
    return this.http.post<Producto>(`${this.base}/productos`, dto);
  }

  actualizar(id: number, dto: ProductoUpdate): Observable<Producto> {
    return this.http.patch<Producto>(`${this.base}/productos/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/productos/${id}`);
  }

  agregarVariante(productoId: number, dto: VarianteCreate): Observable<Variante> {
    return this.http.post<Variante>(
      `${this.base}/productos/${productoId}/variantes`,
      dto,
    );
  }

  actualizarVariante(id: number, dto: VarianteUpdate): Observable<Variante> {
    return this.http.patch<Variante>(`${this.base}/variantes/${id}`, dto);
  }

  eliminarVariante(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/variantes/${id}`);
  }
}
