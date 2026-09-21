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

import { Proveedor } from '../../core/models/proveedor.model';
import { ProveedoresService } from './proveedores.service';

export interface ProveedorFormData {
  proveedor: Proveedor | null;
}

@Component({
  selector: 'app-proveedor-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatProgressBarModule,
  ],
  templateUrl: './proveedor-form-dialog.html',
  styleUrl: './proveedor-form-dialog.scss',
})
export class ProveedorFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ProveedoresService);
  private readonly ref = inject(MatDialogRef<ProveedorFormDialog, Proveedor>);
  protected readonly data = inject<ProveedorFormData>(MAT_DIALOG_DATA);

  protected readonly esEdicion = this.data.proveedor !== null;
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    nombre_empresa: [
      this.data.proveedor?.nombre_empresa ?? '',
      [Validators.required, Validators.minLength(2)],
    ],
    contacto: [this.data.proveedor?.contacto ?? ''],
    email: [this.data.proveedor?.email ?? '', [Validators.email]],
    telefono: [this.data.proveedor?.telefono ?? ''],
    direccion: [this.data.proveedor?.direccion ?? ''],
    activo: [this.data.proveedor?.activo ?? true],
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
      nombre_empresa: v.nombre_empresa,
      contacto: v.contacto || null,
      email: v.email || null,
      telefono: v.telefono || null,
      direccion: v.direccion || null,
    };

    try {
      const resultado =
        this.esEdicion && this.data.proveedor
          ? await firstValueFrom(
              this.service.actualizar(this.data.proveedor.id, {
                ...dto,
                activo: v.activo,
              }),
            )
          : await firstValueFrom(this.service.crear(dto));
      this.ref.close(resultado);
    } catch (e: unknown) {
      const err = e as { error?: { detail?: string } };
      this.error.set(err.error?.detail ?? 'No se pudo guardar el proveedor.');
    } finally {
      this.guardando.set(false);
    }
  }

  cerrar(): void {
    this.ref.close();
  }
}
