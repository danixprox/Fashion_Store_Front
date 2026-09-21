import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Carrito } from '../../core/models/carrito.model';

export interface ItemCarritoCreateDto {
  variante_id: number;
  cantidad: number;
}

export interface ItemCarritoUpdateDto {
  cantidad: number;
}

@Injectable({ providedIn: 'root' })
export class CarritoService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/carrito`;

  private readonly _carrito = signal<Carrito | null>(null);
  readonly carrito = this._carrito.asReadonly();
  readonly cantidadItems = computed(() => this._carrito()?.cantidad_items ?? 0);

  cargar(): Observable<Carrito> {
    return this.http
      .get<Carrito>(this.base)
      .pipe(tap((c) => this._carrito.set(c)));
  }

  agregar(dto: ItemCarritoCreateDto): Observable<Carrito> {
    return this.http
      .post<Carrito>(`${this.base}/items`, dto)
      .pipe(tap((c) => this._carrito.set(c)));
  }

  actualizarCantidad(itemId: number, dto: ItemCarritoUpdateDto): Observable<Carrito> {
    return this.http
      .patch<Carrito>(`${this.base}/items/${itemId}`, dto)
      .pipe(tap((c) => this._carrito.set(c)));
  }

  quitar(itemId: number): Observable<Carrito> {
    return this.http
      .delete<Carrito>(`${this.base}/items/${itemId}`)
      .pipe(tap((c) => this._carrito.set(c)));
  }

  vaciar(): Observable<Carrito> {
    return this.http
      .delete<Carrito>(this.base)
      .pipe(tap((c) => this._carrito.set(c)));
  }

  limpiarLocal(): void {
    this._carrito.set(null);
  }
}
