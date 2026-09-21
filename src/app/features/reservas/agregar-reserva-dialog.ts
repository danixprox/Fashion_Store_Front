import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

import { DisponibilidadSucursal } from '../../core/models/inventario.model';
import { ReservaBolsaService } from './reserva-bolsa.service';

export interface AgregarReservaData {
  varianteId: number;
  productoNombre: string;
  talla: string | null;
  color: string | null;
  imagenUrl: string | null;
  sucursales: DisponibilidadSucursal[];
}

/** CU16 — elegir en qué sucursal y cuántas unidades de esta prenda agregar a "Mi reserva". */
@Component({
  selector: 'app-agregar-reserva-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Agregar a mi reserva</h2>
    <mat-dialog-content>
      <p class="prenda">
        <strong>{{ data.productoNombre }}</strong>
        @if (data.talla || data.color) {
          <span class="detalle">{{ data.talla }} · {{ data.color }}</span>
        }
      </p>
      <p class="ayuda">
        Una reserva es de una sola sucursal. Si elegís prendas de sucursales distintas, las
        reservás por separado.
      </p>
      <form [formGroup]="form" class="col">
        <mat-form-field appearance="outline">
          <mat-label>Sucursal</mat-label>
          <mat-select formControlName="sucursal_id">
            @for (s of data.sucursales; track s.sucursal_id) {
              <mat-option [value]="s.sucursal_id">
                {{ s.sucursal }} — {{ s.ciudad }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Cantidad</mat-label>
          <input matInput type="number" min="1" [max]="maxCantidad" formControlName="cantidad" />
          <mat-hint>
            @if (maxCantidad > 0) {
              Máximo {{ maxCantidad }} más en esa sucursal.
            } @else {
              Ya agregaste todo lo disponible en esa sucursal.
            }
          </mat-hint>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close()">Cancelar</button>
      <button
        mat-flat-button
        class="btn-primary"
        (click)="agregar()"
        [disabled]="form.invalid || maxCantidad < 1"
      >
        Agregar
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .prenda { margin: 0 0 .5rem; }
    .detalle { color: #64748b; margin-left: .4rem; font-size: .9rem; }
    .ayuda { margin: 0 0 1rem; color: #64748b; font-size: .85rem; max-width: 420px; }
    .col { display: flex; flex-direction: column; gap: 1.25rem; min-width: min(420px, 80vw); }
    mat-form-field { width: 100%; }
    .btn-primary { background: var(--fs-green-700); color: #fff; }
  `,
})
export class AgregarReservaDialog {
  private readonly fb = inject(FormBuilder);
  private readonly bolsa = inject(ReservaBolsaService);
  protected readonly ref = inject(MatDialogRef<AgregarReservaDialog, boolean>);
  protected readonly data = inject<AgregarReservaData>(MAT_DIALOG_DATA);

  protected readonly form = this.fb.nonNullable.group({
    sucursal_id: [this.data.sucursales[0]?.sucursal_id ?? 0, [Validators.required]],
    cantidad: [1, [Validators.required, Validators.min(1)]],
  });

  /** Lo disponible en la sucursal elegida, menos lo que ya está en "Mi reserva". */
  protected get maxCantidad(): number {
    const sucursalId = this.form.controls.sucursal_id.value;
    const s = this.data.sucursales.find((x) => x.sucursal_id === sucursalId);
    if (!s) return 0;
    return Math.max(0, s.cantidad_disponible - this.bolsa.cantidadEnBolsa(this.data.varianteId, sucursalId));
  }

  agregar(): void {
    const v = this.form.getRawValue();
    const s = this.data.sucursales.find((x) => x.sucursal_id === v.sucursal_id);
    if (!s || v.cantidad < 1 || v.cantidad > this.maxCantidad) return;
    this.bolsa.agregar({
      varianteId: this.data.varianteId,
      productoNombre: this.data.productoNombre,
      talla: this.data.talla,
      color: this.data.color,
      imagenUrl: this.data.imagenUrl,
      sucursalId: s.sucursal_id,
      sucursal: s.sucursal,
      ciudad: s.ciudad,
      cantidad: v.cantidad,
      maxDisponible: s.cantidad_disponible,
    });
    this.ref.close(true);
  }
}
