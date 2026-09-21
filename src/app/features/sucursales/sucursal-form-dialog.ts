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
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { Sucursal } from '../../core/models/sucursal.model';
import { SucursalesService } from './sucursales.service';

export interface SucursalFormData {
  sucursal: Sucursal | null;
}

@Component({
  selector: 'app-sucursal-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatProgressBarModule,
  ],
  templateUrl: './sucursal-form-dialog.html',
  styleUrl: './sucursal-form-dialog.scss',
})
export class SucursalFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(SucursalesService);
  private readonly ref = inject(MatDialogRef<SucursalFormDialog, Sucursal>);
  protected readonly data = inject<SucursalFormData>(MAT_DIALOG_DATA);

  protected readonly esEdicion = this.data.sucursal !== null;
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    nombre: [
      this.data.sucursal?.nombre ?? '',
      [Validators.required, Validators.minLength(2)],
    ],
    ciudad: [
      this.data.sucursal?.ciudad ?? '',
      [Validators.required, Validators.minLength(2)],
    ],
    direccion: [
      this.data.sucursal?.direccion ?? '',
      [Validators.required, Validators.minLength(3)],
    ],
    telefono: [this.data.sucursal?.telefono ?? ''],
    horario_atencion: [this.data.sucursal?.horario_atencion ?? ''],
    activa: [this.data.sucursal?.activa ?? true],
  });

  async guardar(): Promise<void> {
    if (this.form.invalid || this.guardando()) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    const dto = {
      nombre: v.nombre,
      ciudad: v.ciudad,
      direccion: v.direccion,
      telefono: v.telefono || null,
      horario_atencion: v.horario_atencion || null,
    };

    try {
      const resultado =
        this.esEdicion && this.data.sucursal
          ? await firstValueFrom(
              this.service.actualizar(this.data.sucursal.id, {
                ...dto,
                activa: v.activa,
              }),
            )
          : await firstValueFrom(this.service.crear(dto));
      this.ref.close(resultado);
    } catch (e: unknown) {
      const err = e as { error?: { detail?: string } };
      this.error.set(err.error?.detail ?? 'No se pudo guardar la sucursal.');
    } finally {
      this.guardando.set(false);
    }
  }

  cerrar(): void {
    this.ref.close();
  }
}
