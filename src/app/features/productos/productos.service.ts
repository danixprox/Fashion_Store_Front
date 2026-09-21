import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Page } from '../../core/models/usuario.model';
import {
  Producto,
  ProductoDetalle,
  ProductoOpcion,
  Variante,
} from '../../core/models/producto.model';

export interface ProductoCreate {
  nombre: string;
  descripcion?: string | null;
  categoria_id: number;
  coleccion_id?: number | null;
  proveedor_id: number;
  precio_compra?: string | null;
  precio_base?: string | null;
  imagen_url?: string | null;
}

export type ProductoUpdate = Partial<ProductoCreate> & { activo?: boolean };

export interface VarianteCreate {
  talla_id: number;
  color_id: number;
  sku: string;
  precio?: string | null;
  precio_compra?: string | null;
  imagen_url?: string | null;
}

export type VarianteUpdate = Partial<VarianteCreate>;

export interface FiltrosProductos {
  q?: string;
  categoria_id?: number | null;
  coleccion_id?: number | null;
  proveedor_id?: number | null;
  activo?: boolean | null;
  page: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class ProductosService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  listar(f: FiltrosProductos): Observable<Page<Producto>> {
    let p = new HttpParams().set('page', f.page).set('size', f.size);
    if (f.q) p = p.set('q', f.q);
    if (f.categoria_id != null) p = p.set('categoria_id', f.categoria_id);
    if (f.coleccion_id != null) p = p.set('coleccion_id', f.coleccion_id);
    if (f.proveedor_id != null) p = p.set('proveedor_id', f.proveedor_id);
    if (f.activo != null) p = p.set('activo', f.activo);
    return this.http.get<Page<Producto>>(`${this.base}/productos`, { params: p });
  }

  obtener(id: number): Observable<ProductoDetalle> {
    return this.http.get<ProductoDetalle>(`${this.base}/productos/${id}`);
  }

  opciones(): Observable<ProductoOpcion[]> {
    return this.http.get<ProductoOpcion[]>(`${this.base}/productos/opciones`);
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
