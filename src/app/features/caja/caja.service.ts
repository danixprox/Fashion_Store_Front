import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { RegistroClienteDto } from '../../core/auth/auth.service';
import {
  ClienteBuscado,
  Comprobante,
  Venta,
  VentaCaja,
} from '../../core/models/venta.model';

export interface ItemVentaPresencialDto {
  variante_id: number;
  cantidad: number;
}

export interface PagoCajaDto {
  metodo: 'EFECTIVO' | 'TARJETA_CAJA';
  monto_recibido?: string | null;
}

@Injectable({ providedIn: 'root' })
export class CajaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/ventas`;

  buscarClientes(q: string): Observable<ClienteBuscado[]> {
    const params = new HttpParams().set('q', q);
    return this.http.get<ClienteBuscado[]>(`${this.base}/clientes/buscar`, { params });
  }

  registrarClienteRapido(dto: RegistroClienteDto): Observable<ClienteBuscado> {
    return this.http.post<ClienteBuscado>(`${this.base}/clientes`, dto);
  }

  crearVentaPresencial(
    clienteId: number,
    items: ItemVentaPresencialDto[],
  ): Observable<Venta> {
    return this.http.post<Venta>(`${this.base}/presencial`, {
      cliente_id: clienteId,
      items,
    });
  }

  procesarPago(ventaId: number, dto: PagoCajaDto): Observable<Venta> {
    return this.http.post<Venta>(`${this.base}/${ventaId}/pagos/caja`, dto);
  }

  comprobante(ventaId: number): Observable<Comprobante> {
    return this.http.get<Comprobante>(`${this.base}/${ventaId}/comprobante`);
  }

  historial(): Observable<VentaCaja[]> {
    return this.http.get<VentaCaja[]>(`${this.base}/caja/historial`);
  }

  // Ventas de reservas finalizadas, esperando el cobro.
  porCobrar(): Observable<VentaCaja[]> {
    return this.http.get<VentaCaja[]>(`${this.base}/caja/por-cobrar`);
  }

  anular(ventaId: number): Observable<Venta> {
    return this.http.post<Venta>(`${this.base}/${ventaId}/caja/anular`, {});
  }
}
