import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { Promocion, VarianteOpcion } from '../../core/models/promocion.model';
import { ProductoOpcion } from '../../core/models/producto.model';
import { ProductosService } from '../productos/productos.service';
import { PromocionesService } from './promociones.service';

/** Date -> 'YYYY-MM-DD'. */
function iso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

@Component({
  selector: 'app-promocion-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatSlideToggleModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar promoción' : 'Nueva promoción' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="col" (ngSubmit)="guardar()">
        <mat-form-field appearance="outline">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="nombre" placeholder="Liquidación de verano" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Descripción (opcional)</mat-label>
          <input matInput formControlName="descripcion" />
        </mat-form-field>
        <div class="fila">
          <mat-form-field appearance="outline">
            <mat-label>Tipo de descuento</mat-label>
            <mat-select formControlName="tipo_descuento">
              <mat-option value="PORCENTAJE">Porcentaje (%)</mat-option>
              <mat-option value="MONTO_FIJO">Monto fijo (Bs)</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>{{ form.controls.tipo_descuento.value === 'PORCENTAJE' ? 'Porcentaje' : 'Monto en Bs' }}</mat-label>
            <input matInput type="number" step="0.01" min="0" formControlName="valor" />
          </mat-form-field>
        </div>
        <div class="fila">
          <mat-form-field appearance="outline">
            <mat-label>Inicio</mat-label>
            <input matInput [matDatepicker]="di" formControlName="fecha_inicio" />
            <mat-datepicker-toggle matIconSuffix [for]="di" />
            <mat-datepicker #di />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Fin</mat-label>
            <input matInput [matDatepicker]="df" formControlName="fecha_fin" />
            <mat-datepicker-toggle matIconSuffix [for]="df" />
            <mat-datepicker #df />
          </mat-form-field>
        </div>
        <p class="ayuda">
          Elegí productos completos (todas sus tallas y colores) y/o variantes puntuales, por
          ejemplo solo la M azul marino.
        </p>
        <mat-form-field appearance="outline">
          <mat-label>Productos completos</mat-label>
          <mat-select formControlName="producto_ids" multiple>
            @for (p of productos(); track p.id) {
              <mat-option [value]="p.id">{{ p.nombre }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Variantes específicas</mat-label>
          <mat-select formControlName="variante_ids" multiple>
            @for (g of gruposVariantes(); track g.producto) {
              <mat-optgroup [label]="g.producto">
                @for (v of g.variantes; track v.id) {
                  <mat-option [value]="v.id">{{ v.talla }} · {{ v.color }}</mat-option>
                }
              </mat-optgroup>
            }
          </mat-select>
        </mat-form-field>
        @if (data) {
          <mat-slide-toggle formControlName="activo">Activa</mat-slide-toggle>
        }
        @if (error()) {
          <p class="err">{{ error() }}</p>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close()">Cancelar</button>
      <button mat-flat-button (click)="guardar()" [disabled]="guardando()">
        {{ data ? 'Guardar' : 'Crear' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .col { display: flex; flex-direction: column; gap: .4rem; padding-top: .5rem; min-width: min(480px, 80vw); }
    .fila { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
    mat-form-field { width: 100%; }
    .err { color: #b3261e; font-size: .85rem; margin: 0; }
    .ayuda { margin: 0; color: #64748b; font-size: .82rem; max-width: 480px; }
    @media (max-width: 480px) { .fila { grid-template-columns: 1fr; } }
  `,
})
export class PromocionDialog implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(PromocionesService);
  private readonly productosSvc = inject(ProductosService);
  protected readonly ref = inject(MatDialogRef<PromocionDialog, Promocion>);
  protected readonly data = inject<Promocion | null>(MAT_DIALOG_DATA);

  protected readonly productos = signal<ProductoOpcion[]>([]);
  private readonly variantes = signal<VarianteOpcion[]>([]);
  protected readonly gruposVariantes = computed(() => {
    const porProducto = new Map<string, VarianteOpcion[]>();
    for (const v of this.variantes()) {
      porProducto.set(v.producto, [...(porProducto.get(v.producto) ?? []), v]);
    }
    return [...porProducto.entries()].map(([producto, variantes]) => ({ producto, variantes }));
  });
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    nombre: [this.data?.nombre ?? '', [Validators.required, Validators.minLength(3)]],
    descripcion: [this.data?.descripcion ?? ''],
    tipo_descuento: [this.data?.tipo_descuento ?? ('PORCENTAJE' as 'PORCENTAJE' | 'MONTO_FIJO')],
    valor: [this.data ? +this.data.valor : (null as number | null), [Validators.required, Validators.min(0.01)]],
    fecha_inicio: [
      this.data ? new Date(this.data.fecha_inicio + 'T00:00:00') : (null as Date | null),
      Validators.required,
    ],
    fecha_fin: [
      this.data ? new Date(this.data.fecha_fin + 'T00:00:00') : (null as Date | null),
      Validators.required,
    ],
    producto_ids: [this.data?.productos.map((p) => p.id) ?? ([] as number[])],
    variante_ids: [this.data?.variantes.map((v) => v.id) ?? ([] as number[])],
    activo: [this.data?.activo ?? true],
  });

  ngOnInit(): void {
    this.productosSvc.opciones().subscribe((p) => this.productos.set(p));
    this.service.variantesOpciones().subscribe((v) => this.variantes.set(v));
  }

  async guardar(): Promise<void> {
    if (this.form.invalid || this.guardando()) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    if (v.producto_ids.length === 0 && v.variante_ids.length === 0) {
      this.error.set('Elegí al menos un producto o una variante.');
      return;
    }
    if (v.fecha_fin! < v.fecha_inicio!) {
      this.error.set('La fecha de fin no puede ser anterior a la de inicio.');
      return;
    }
    if (v.tipo_descuento === 'PORCENTAJE' && v.valor! > 90) {
      this.error.set('El descuento porcentual no puede superar el 90%.');
      return;
    }
    this.guardando.set(true);
    this.error.set(null);
    const dto = {
      nombre: v.nombre.trim(),
      descripcion: v.descripcion.trim() || null,
      tipo_descuento: v.tipo_descuento,
      valor: v.valor!,
      fecha_inicio: iso(v.fecha_inicio!),
      fecha_fin: iso(v.fecha_fin!),
      activo: v.activo,
      producto_ids: v.producto_ids,
      variante_ids: v.variante_ids,
    };
    try {
      const res = this.data
        ? await firstValueFrom(this.service.actualizar(this.data.id, dto))
        : await firstValueFrom(this.service.crear(dto));
      this.ref.close(res);
    } catch (e: unknown) {
      const detail = (e as { error?: { detail?: unknown } }).error?.detail;
      this.error.set(typeof detail === 'string' ? detail : 'No se pudo guardar.');
    } finally {
      this.guardando.set(false);
    }
  }
}
