import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Page } from '../../core/models/usuario.model';
import { EstadoPagoInfo, Pago, Venta, VentaCaja } from '../../core/models/venta.model';

@Injectable({ providedIn: 'root' })
export class VentasService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/ventas`;

  checkout(direccion: string, referencia: string | null): Observable<Venta> {
    return this.http.post<Venta>(`${this.base}/checkout`, {
      direccion_entrega: direccion,
      referencia_entrega: referencia,
    });
  }

  misCompras(): Observable<Venta[]> {
    return this.http.get<Venta[]>(`${this.base}/mias`);
  }

  cancelar(ventaId: number): Observable<Venta> {
    return this.http.post<Venta>(`${this.base}/${ventaId}/cancelar`, {});
  }

  iniciarPago(ventaId: number): Observable<Pago> {
    return this.http.post<Pago>(`${this.base}/${ventaId}/pagos`, {});
  }

  estadoPago(ventaId: number): Observable<EstadoPagoInfo> {
    return this.http.get<EstadoPagoInfo>(`${this.base}/${ventaId}/pagos/estado`);
  }

  // CU36/CU37 — vista de ventas para Administrador (global) y Encargado (su sucursal)
  listarSucursal(f: {
    sucursal_id?: number | null;
    estado?: string | null;
    page: number;
    size: number;
  }): Observable<Page<VentaCaja>> {
    let params = new HttpParams().set('page', f.page).set('size', f.size);
    if (f.sucursal_id != null) params = params.set('sucursal_id', f.sucursal_id);
    if (f.estado) params = params.set('estado', f.estado);
    return this.http.get<Page<VentaCaja>>(`${this.base}/sucursal`, { params });
  }
}
