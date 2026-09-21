import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ProductoOpcion, Variante } from '../../core/models/producto.model';
import { SucursalOpcion } from '../../core/models/sucursal.model';
import { InventarioItem } from '../../core/models/inventario.model';
import { ProductosService } from '../productos/productos.service';
import { SucursalesService } from '../sucursales/sucursales.service';
import { InventarioService } from './inventario.service';

export interface AjustarStockDialogData {
  /** Precarga (al ajustar desde la fila de la tabla). */
  item?: InventarioItem;
  /** Si viene seteada, el select de sucursal queda bloqueado en ese valor
   * (caso encargado de sucursal, que solo puede ajustar la suya). */
  sucursalFija?: number;
}

@Component({
  selector: 'app-ajustar-stock-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Ajustar stock</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="grid" (ngSubmit)="guardar()">
        <mat-form-field appearance="outline" class="col-2">
          <mat-label>Producto</mat-label>
          <mat-select
            formControlName="producto_id"
            (selectionChange)="onProducto($event.value)"
          >
            @for (p of productos(); track p.id) {
              <mat-option [value]="p.id">{{ p.nombre }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="col-2">
          <mat-label>Variante (talla / color)</mat-label>
          <mat-select formControlName="variante_id">
            @if (cargandoVariantes()) {
              <mat-option [disabled]="true">Cargando…</mat-option>
            }
            @for (v of variantes(); track v.id) {
              <mat-option [value]="v.id">
                {{ v.talla }} · {{ v.color }} ({{ v.sku }})
              </mat-option>
            }
          </mat-select>
          @if (!cargandoVariantes() && form.controls.producto_id.value && variantes().length === 0) {
            <mat-hint>Este producto no tiene variantes cargadas.</mat-hint>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Sucursal</mat-label>
          <mat-select formControlName="sucursal_id">
            @for (s of sucursales(); track s.id) {
              <mat-option [value]="s.id">{{ s.nombre }} — {{ s.ciudad }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Cantidad disponible</mat-label>
          <input
            matInput
            type="number"
            min="0"
            step="1"
            formControlName="cantidad_disponible"
          />
        </mat-form-field>

        @if (error()) {
          <p class="err col-2">{{ error() }}</p>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close()">Cancelar</button>
      <button mat-flat-button class="btn-primary" (click)="guardar()" [disabled]="guardando()">
        @if (guardando()) {
          <mat-spinner diameter="18" />
        } @else {
          Guardar
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: .4rem 1rem; padding-top: .5rem; min-width: min(480px, 82vw); }
    .col-2 { grid-column: 1 / -1; }
    mat-form-field { width: 100%; }
    .err { color:#b3261e; font-size:.85rem; margin:0; }
    .btn-primary { background: var(--fs-green-700); color: #fff; }
    @media (max-width: 480px) { .grid { grid-template-columns: 1fr; } .col-2 { grid-column: auto; } }
  `,
})
export class AjustarStockDialog {
  private readonly fb = inject(FormBuilder);
  private readonly productosSvc = inject(ProductosService);
  private readonly sucursalesSvc = inject(SucursalesService);
  private readonly inventarioSvc = inject(InventarioService);
  protected readonly ref = inject(MatDialogRef<AjustarStockDialog, InventarioItem>);
  protected readonly data = inject<AjustarStockDialogData>(MAT_DIALOG_DATA);

  protected readonly productos = toSignal(this.productosSvc.opciones(), {
    initialValue: [] as ProductoOpcion[],
  });
  protected readonly sucursales = toSignal(this.sucursalesSvc.opciones(), {
    initialValue: [] as SucursalOpcion[],
  });

  protected readonly variantes = signal<Variante[]>([]);
  protected readonly cargandoVariantes = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly item = this.data.item;
  protected readonly form = this.fb.nonNullable.group({
    producto_id: [this.item?.producto_id ?? (null as number | null), [Validators.required]],
    variante_id: [this.item?.variante_id ?? (null as number | null), [Validators.required]],
    sucursal_id: [
      this.item?.sucursal_id ?? this.data.sucursalFija ?? (null as number | null),
      [Validators.required],
    ],
    cantidad_disponible: [
      this.item?.cantidad_disponible ?? 0,
      [Validators.required, Validators.min(0)],
    ],
  });

  constructor() {
    if (this.data.sucursalFija != null) {
      this.form.controls.sucursal_id.disable();
    }
    if (this.item?.producto_id) {
      this.onProducto(this.item.producto_id);
    }
  }

  onProducto(productoId: number): void {
    this.form.controls.variante_id.setValue(this.item?.variante_id ?? null);
    this.variantes.set([]);
    this.cargandoVariantes.set(true);
    this.productosSvc.obtener(productoId).subscribe({
      next: (p) => {
        this.variantes.set(p.variantes);
        this.cargandoVariantes.set(false);
      },
      error: () => this.cargandoVariantes.set(false),
    });
  }

  async guardar(): Promise<void> {
    if (this.form.invalid || this.guardando()) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.error.set(null);
    const val = this.form.getRawValue();
    try {
      const res = await firstValueFrom(
        this.inventarioSvc.ajustar({
          variante_id: val.variante_id!,
          sucursal_id: val.sucursal_id!,
          cantidad_disponible: val.cantidad_disponible,
        }),
      );
      this.ref.close(res);
    } catch (e: unknown) {
      this.error.set(
        (e as { error?: { detail?: string } }).error?.detail ??
          'No se pudo ajustar el stock.',
      );
    } finally {
      this.guardando.set(false);
    }
  }
}
