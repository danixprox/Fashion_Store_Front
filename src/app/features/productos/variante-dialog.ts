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

import { Color, Talla } from '../../core/models/catalogo.model';
import { Variante } from '../../core/models/producto.model';
import { CatalogoService } from '../catalogo/catalogo.service';
import { ProductosService } from './productos.service';
import { PortalProveedorService } from '../portal-proveedor/portal-proveedor.service';

export interface VarianteDialogData {
  productoId: number;
  variante: Variante | null;
  /** Si es true usa los endpoints del portal del proveedor. */
  portal?: boolean;
}

@Component({
  selector: 'app-variante-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.variante ? 'Editar variante' : 'Nueva variante' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="grid" (ngSubmit)="guardar()">
        <mat-form-field appearance="outline">
          <mat-label>Talla</mat-label>
          <mat-select formControlName="talla_id">
            @for (t of tallas(); track t.id) {
              <mat-option [value]="t.id">{{ t.valor }} ({{ t.tipo }})</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Color</mat-label>
          <mat-select formControlName="color_id">
            @for (c of colores(); track c.id) {
              <mat-option [value]="c.id">
                <span class="sw" [style.background]="c.codigo_hex || '#e2e8f0'"></span>
                {{ c.nombre }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="col-2">
          <mat-label>SKU</mat-label>
          <input matInput formControlName="sku" placeholder="POL-MC-M-NEG" />
          @if (form.controls.sku.hasError('required') && form.controls.sku.touched) {
            <mat-error>Obligatorio.</mat-error>
          }
        </mat-form-field>

        @if (!data.portal) {
          <mat-form-field appearance="outline" class="col-2">
            <mat-label>Precio de venta (opcional)</mat-label>
            <span matTextPrefix>Bs&nbsp;</span>
            <input matInput type="number" step="0.01" formControlName="precio" />
            <mat-hint>Si lo dejás vacío, usa el precio de venta del producto.</mat-hint>
          </mat-form-field>
        }

        @if (data.portal) {
          <mat-form-field appearance="outline" class="col-2">
            <mat-label>Precio que nos vendés esta talla/color (opcional)</mat-label>
            <span matTextPrefix>Bs&nbsp;</span>
            <input matInput type="number" step="0.01" formControlName="precio_compra" />
            <mat-hint>Si lo dejás vacío, usa el precio general del producto.</mat-hint>
          </mat-form-field>
        }

        <mat-form-field appearance="outline" class="col-2">
          <mat-label>URL de imagen (opcional)</mat-label>
          <input matInput formControlName="imagen_url" placeholder="https://…" />
          <mat-hint>Para este color/talla en particular. Si la dejás vacía, usa la imagen del producto.</mat-hint>
        </mat-form-field>

        @if (error()) {
          <p class="err col-2">{{ error() }}</p>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close()">Cancelar</button>
      <button mat-flat-button (click)="guardar()" [disabled]="guardando()">
        {{ data.variante ? 'Guardar' : 'Agregar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: .4rem 1rem; padding-top: .5rem; min-width: min(480px, 82vw); }
    .col-2 { grid-column: 1 / -1; }
    mat-form-field { width: 100%; }
    .sw { display:inline-block; width:12px; height:12px; border-radius:3px; margin-right:.4rem; border:1px solid #cbd5e1; vertical-align:middle; }
    .err { color:#b3261e; font-size:.85rem; margin:0; }
    @media (max-width: 480px) { .grid { grid-template-columns: 1fr; } .col-2 { grid-column: auto; } }
  `,
})
export class VarianteDialog {
  private readonly fb = inject(FormBuilder);
  private readonly adminSvc = inject(ProductosService);
  private readonly portalSvc = inject(PortalProveedorService);
  private readonly catalogo = inject(CatalogoService);
  protected readonly ref = inject(MatDialogRef<VarianteDialog, Variante>);
  protected readonly data = inject<VarianteDialogData>(MAT_DIALOG_DATA);

  private get service() {
    return this.data.portal ? this.portalSvc : this.adminSvc;
  }

  protected readonly tallas = toSignal(this.catalogo.opcionesTallas(), {
    initialValue: [] as Talla[],
  });
  protected readonly colores = toSignal(this.catalogo.opcionesColores(), {
    initialValue: [] as Color[],
  });

  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly v = this.data.variante;
  protected readonly form = this.fb.nonNullable.group({
    talla_id: [this.v?.talla_id ?? (null as number | null), [Validators.required]],
    color_id: [this.v?.color_id ?? (null as number | null), [Validators.required]],
    sku: [this.v?.sku ?? '', [Validators.required]],
    precio: [this.v?.precio ?? ''],
    precio_compra: [this.v?.precio_compra ?? ''],
    imagen_url: [this.v?.imagen_url ?? ''],
  });

  async guardar(): Promise<void> {
    if (this.form.invalid || this.guardando()) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.error.set(null);
    const val = this.form.getRawValue();
    const dto = {
      talla_id: val.talla_id!,
      color_id: val.color_id!,
      sku: val.sku.trim(),
      precio: val.precio ? String(val.precio) : null,
      precio_compra: val.precio_compra ? String(val.precio_compra) : null,
      imagen_url: val.imagen_url?.trim() || null,
    };
    try {
      const res = this.v
        ? await firstValueFrom(this.service.actualizarVariante(this.v.id, dto))
        : await firstValueFrom(
            this.service.agregarVariante(this.data.productoId, dto),
          );
      this.ref.close(res);
    } catch (e: unknown) {
      this.error.set(
        (e as { error?: { detail?: string } }).error?.detail ??
          'No se pudo guardar la variante.',
      );
    } finally {
      this.guardando.set(false);
    }
  }
}
