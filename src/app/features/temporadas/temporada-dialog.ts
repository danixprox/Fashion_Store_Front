import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { Temporada } from '../../core/models/temporada.model';
import { TemporadasService } from './temporadas.service';

/** Date -> 'YYYY-MM-DD' (o null). */
function iso(d: Date | null): string | null {
  if (!d) return null;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

@Component({
  selector: 'app-temporada-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
    MatSlideToggleModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar temporada' : 'Nueva temporada' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="col" (ngSubmit)="guardar()">
        <mat-form-field appearance="outline">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="nombre" placeholder="Primavera-Verano 2026" />
        </mat-form-field>
        <div class="fechas">
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
    .col { display: flex; flex-direction: column; gap: .4rem; padding-top: .5rem; min-width: min(440px, 80vw); }
    .fechas { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
    mat-form-field { width: 100%; }
    .err { color: #b3261e; font-size: .85rem; margin: 0; }
    @media (max-width: 440px) { .fechas { grid-template-columns: 1fr; } }
  `,
})
export class TemporadaDialog {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(TemporadasService);
  protected readonly ref = inject(MatDialogRef<TemporadaDialog, Temporada>);
  protected readonly data = inject<Temporada | null>(MAT_DIALOG_DATA);

  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    nombre: [this.data?.nombre ?? '', [Validators.required, Validators.minLength(2)]],
    fecha_inicio: [
      this.data?.fecha_inicio ? new Date(this.data.fecha_inicio + 'T00:00:00') : (null as Date | null),
    ],
    fecha_fin: [
      this.data?.fecha_fin ? new Date(this.data.fecha_fin + 'T00:00:00') : (null as Date | null),
    ],
    activo: [this.data?.activo ?? true],
  });

  async guardar(): Promise<void> {
    if (this.form.invalid || this.guardando()) return;
    const v = this.form.getRawValue();
    if (v.fecha_inicio && v.fecha_fin && v.fecha_fin < v.fecha_inicio) {
      this.error.set('La fecha de fin no puede ser anterior a la de inicio.');
      return;
    }
    this.guardando.set(true);
    this.error.set(null);
    const dto = {
      nombre: v.nombre,
      fecha_inicio: iso(v.fecha_inicio),
      fecha_fin: iso(v.fecha_fin),
    };
    try {
      const res = this.data
        ? await firstValueFrom(
            this.service.actualizarTemporada(this.data.id, { ...dto, activo: v.activo }),
          )
        : await firstValueFrom(this.service.crearTemporada(dto));
      this.ref.close(res);
    } catch (e: unknown) {
      this.error.set(
        (e as { error?: { detail?: string } }).error?.detail ?? 'No se pudo guardar.',
      );
    } finally {
      this.guardando.set(false);
    }
  }
}
