import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

import { Venta, VentaCaja } from '../../core/models/venta.model';
import { CajaService } from './caja.service';

/** CU25 — cobro en caja de una venta que nació de una reserva. */
@Component({
  selector: 'app-cobro-dialog',
  imports: [
    DecimalPipe,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Cobrar pedido #{{ venta.id }}</h2>
    <mat-dialog-content>
      <p class="total">Total a cobrar: <strong>Bs {{ +venta.total | number: '1.2-2' }}</strong></p>
      <mat-form-field appearance="outline" class="campo">
        <mat-label>Método de pago</mat-label>
        <mat-select [value]="metodo()" (valueChange)="metodo.set($event)">
          <mat-option value="EFECTIVO">Efectivo</mat-option>
          <mat-option value="TARJETA_CAJA">Tarjeta</mat-option>
        </mat-select>
      </mat-form-field>
      @if (metodo() === 'EFECTIVO') {
        <mat-form-field appearance="outline" class="campo">
          <mat-label>Monto recibido (Bs)</mat-label>
          <input
            matInput
            type="number"
            min="0"
            step="0.01"
            [ngModel]="monto()"
            (ngModelChange)="monto.set($event)"
          />
        </mat-form-field>
        @if (vuelto() !== null) {
          <p class="vuelto">Vuelto: <strong>Bs {{ vuelto()! | number: '1.2-2' }}</strong></p>
        }
      }
      @if (error()) {
        <p class="err">{{ error() }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close()">Cancelar</button>
      <button mat-flat-button (click)="cobrar()" [disabled]="procesando() || !puedeCobrar()">
        Confirmar cobro
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .total { margin: 0 0 1rem; font-size: 1rem; }
    .campo { width: min(360px, 80vw); display: block; }
    .vuelto { margin: 0; color: #334155; }
    .err { color: #b3261e; font-size: .85rem; margin: .5rem 0 0; }
  `,
})
export class CobroDialog {
  private readonly service = inject(CajaService);
  protected readonly ref = inject(MatDialogRef<CobroDialog, Venta>);
  protected readonly venta = inject<VentaCaja>(MAT_DIALOG_DATA);

  protected readonly metodo = signal<'EFECTIVO' | 'TARJETA_CAJA'>('EFECTIVO');
  protected readonly monto = signal<number | null>(null);
  protected readonly procesando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly vuelto = computed(() => {
    const recibido = this.monto();
    if (this.metodo() !== 'EFECTIVO' || recibido == null) return null;
    return Math.max(0, recibido - +this.venta.total);
  });

  protected readonly puedeCobrar = computed(
    () => this.metodo() === 'TARJETA_CAJA' || (this.monto() ?? 0) >= +this.venta.total,
  );

  async cobrar(): Promise<void> {
    if (this.procesando() || !this.puedeCobrar()) return;
    this.procesando.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(
        this.service.procesarPago(this.venta.id, {
          metodo: this.metodo(),
          monto_recibido: this.metodo() === 'EFECTIVO' ? String(this.monto()) : null,
        }),
      );
      this.ref.close(res);
    } catch (e: unknown) {
      const detail = (e as { error?: { detail?: unknown } }).error?.detail;
      this.error.set(typeof detail === 'string' ? detail : 'No se pudo procesar el cobro.');
    } finally {
      this.procesando.set(false);
    }
  }
}
