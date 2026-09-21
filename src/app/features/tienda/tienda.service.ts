import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Page } from '../../core/models/usuario.model';
import { Categoria, Color, Talla } from '../../core/models/catalogo.model';
import {
  CatalogoProducto,
  CatalogoProductoDetalle,
  OrdenCatalogo,
} from '../../core/models/catalogo-cliente.model';
import { DisponibilidadSucursal } from '../../core/models/inventario.model';

export interface FiltrosCatalogo {
  q?: string;
  categoria_id?: number | null;
  talla_id?: number | null;
  color_id?: number | null;
  precio_min?: number | null;
  precio_max?: number | null;
  orden?: OrdenCatalogo;
  page: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class TiendaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/catalogo`;

  categorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.base}/categorias`);
  }

  tallas(): Observable<Talla[]> {
    return this.http.get<Talla[]>(`${this.base}/tallas`);
  }

  colores(): Observable<Color[]> {
    return this.http.get<Color[]>(`${this.base}/colores`);
  }

  destacados(limit = 8): Observable<CatalogoProducto[]> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<CatalogoProducto[]>(`${this.base}/destacados`, { params });
  }

  listar(f: FiltrosCatalogo): Observable<Page<CatalogoProducto>> {
    let params = new HttpParams().set('page', f.page).set('size', f.size);
    if (f.q) params = params.set('q', f.q);
    if (f.categoria_id != null) params = params.set('categoria_id', f.categoria_id);
    if (f.talla_id != null) params = params.set('talla_id', f.talla_id);
    if (f.color_id != null) params = params.set('color_id', f.color_id);
    if (f.precio_min != null) params = params.set('precio_min', f.precio_min);
    if (f.precio_max != null) params = params.set('precio_max', f.precio_max);
    if (f.orden) params = params.set('orden', f.orden);
    return this.http.get<Page<CatalogoProducto>>(`${this.base}/productos`, { params });
  }

  detalle(id: number): Observable<CatalogoProductoDetalle> {
    return this.http.get<CatalogoProductoDetalle>(`${this.base}/productos/${id}`);
  }

  disponibilidad(varianteId: number): Observable<DisponibilidadSucursal[]> {
    return this.http.get<DisponibilidadSucursal[]>(
      `${this.base}/variantes/${varianteId}/disponibilidad`,
    );
  }
}
