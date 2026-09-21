import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ReporteInventario, ReporteVentas } from '../../core/models/reporte.model';

/** CU31 — reportes de ventas e inventario (Administrador). */
@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/reportes`;

  ventas(desde: string, hasta: string, sucursalId: number | null): Observable<ReporteVentas> {
    let params = new HttpParams().set('fecha_desde', desde).set('fecha_hasta', hasta);
    if (sucursalId != null) params = params.set('sucursal_id', sucursalId);
    return this.http.get<ReporteVentas>(`${this.base}/ventas`, { params });
  }

  inventario(sucursalId: number | null, umbral: number): Observable<ReporteInventario> {
    let params = new HttpParams().set('umbral', umbral);
    if (sucursalId != null) params = params.set('sucursal_id', sucursalId);
    return this.http.get<ReporteInventario>(`${this.base}/inventario`, { params });
  }
}
