import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Page } from '../../core/models/usuario.model';
import {
  InventarioItem,
  MovimientoInventario,
} from '../../core/models/inventario.model';

export interface InventarioAjusteDto {
  variante_id: number;
  sucursal_id: number;
  cantidad_disponible: number;
}

// CU14
export interface MovimientoIngresoDto {
  variante_id: number;
  sucursal_id: number;
  cantidad: number;
  costo_unitario: string;
  nota?: string | null;
}

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/inventario`;

  listar(f: {
    sucursal_id?: number | null;
    q?: string;
    page: number;
    size: number;
  }): Observable<Page<InventarioItem>> {
    let params = new HttpParams().set('page', f.page).set('size', f.size);
    if (f.sucursal_id != null) params = params.set('sucursal_id', f.sucursal_id);
    if (f.q) params = params.set('q', f.q);
    return this.http.get<Page<InventarioItem>>(this.base, { params });
  }

  ajustar(dto: InventarioAjusteDto): Observable<InventarioItem> {
    return this.http.post<InventarioItem>(`${this.base}/ajustar`, dto);
  }

  // CU14
  listarMovimientos(f: {
    sucursal_id?: number | null;
    variante_id?: number | null;
    page: number;
    size: number;
  }): Observable<Page<MovimientoInventario>> {
    let params = new HttpParams().set('page', f.page).set('size', f.size);
    if (f.sucursal_id != null) params = params.set('sucursal_id', f.sucursal_id);
    if (f.variante_id != null) params = params.set('variante_id', f.variante_id);
    return this.http.get<Page<MovimientoInventario>>(`${this.base}/movimientos`, {
      params,
    });
  }

  registrarIngreso(dto: MovimientoIngresoDto): Observable<MovimientoInventario> {
    return this.http.post<MovimientoInventario>(`${this.base}/movimientos`, dto);
  }
}
