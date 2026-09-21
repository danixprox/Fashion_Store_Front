import { Component, computed, inject, signal } from '@angular/core';
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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { ROL, Rol, Usuario } from '../../../core/models/usuario.model';
import { SucursalOpcion } from '../../../core/models/sucursal.model';
import { ProveedorOpcion } from '../../../core/models/proveedor.model';
import { SucursalesService } from '../../sucursales/sucursales.service';
import { ProveedoresService } from '../../proveedores/proveedores.service';
import { UsuariosService } from './usuarios.service';

export interface UsuarioFormData {
  usuario: Usuario | null;
  roles: Rol[];
}

/** Roles que pertenecen a una sucursal. */
const ROLES_CON_SUCURSAL: string[] = [ROL.CAJERO, ROL.ENCARGADO];

@Component({
  selector: 'app-usuario-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatProgressBarModule,
  ],
  templateUrl: './usuario-form-dialog.html',
  styleUrl: './usuario-form-dialog.scss',
})
export class UsuarioFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(UsuariosService);
  private readonly sucursalesService = inject(SucursalesService);
  private readonly proveedoresService = inject(ProveedoresService);
  private readonly ref = inject(MatDialogRef<UsuarioFormDialog, Usuario>);
  protected readonly data = inject<UsuarioFormData>(MAT_DIALOG_DATA);

  protected readonly esEdicion = this.data.usuario !== null;
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly sucursales = toSignal(this.sucursalesService.opciones(), {
    initialValue: [] as SucursalOpcion[],
  });
  protected readonly proveedores = toSignal(this.proveedoresService.opciones(), {
    initialValue: [] as ProveedorOpcion[],
  });

  protected readonly form = this.fb.nonNullable.group({
    nombre: [this.data.usuario?.nombre ?? '', [Validators.required, Validators.minLength(2)]],
    apellido: [this.data.usuario?.apellido ?? '', [Validators.required, Validators.minLength(2)]],
    email: [this.data.usuario?.email ?? '', [Validators.required, Validators.email]],
    telefono: [this.data.usuario?.telefono ?? ''],
    rol_id: [this.data.usuario?.rol_id ?? (null as number | null), [Validators.required]],
    sucursal_id: [this.data.usuario?.sucursal_id ?? (null as number | null)],
    proveedor_id: [this.data.usuario?.proveedor_id ?? (null as number | null)],
    password: ['', this.esEdicion ? [] : [Validators.required, Validators.minLength(8)]],
    activo: [this.data.usuario?.activo ?? true],
  });

  private readonly rolIdSig = toSignal(this.form.controls.rol_id.valueChanges, {
    initialValue: this.form.controls.rol_id.value,
  });

  private readonly rolNombre = computed(
    () => this.data.roles.find((r) => r.id === this.rolIdSig())?.nombre ?? null,
  );

  protected readonly requiereSucursal = computed(
    () => this.rolNombre() != null && ROLES_CON_SUCURSAL.includes(this.rolNombre()!),
  );
  protected readonly requiereProveedor = computed(
    () => this.rolNombre() === ROL.PROVEEDOR,
  );

  async guardar(): Promise<void> {
    if (this.form.invalid || this.guardando()) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.requiereSucursal() && !this.form.controls.sucursal_id.value) {
      this.error.set('Elegí una sucursal para este rol.');
      return;
    }
    if (this.requiereProveedor() && !this.form.controls.proveedor_id.value) {
      this.error.set('Elegí el proveedor asociado a esta cuenta.');
      return;
    }
    this.guardando.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    const sucursalId = this.requiereSucursal() ? v.sucursal_id : null;
    const proveedorId = this.requiereProveedor() ? v.proveedor_id : null;

    try {
      let resultado: Usuario;
      if (this.esEdicion && this.data.usuario) {
        const dto: Record<string, unknown> = {
          nombre: v.nombre,
          apellido: v.apellido,
          email: v.email,
          telefono: v.telefono || null,
          rol_id: v.rol_id,
          sucursal_id: sucursalId,
          proveedor_id: proveedorId,
          activo: v.activo,
        };
        if (v.password) dto['password'] = v.password;
        resultado = await firstValueFrom(
          this.service.actualizar(this.data.usuario.id, dto),
        );
      } else {
        resultado = await firstValueFrom(
          this.service.crear({
            nombre: v.nombre,
            apellido: v.apellido,
            email: v.email,
            telefono: v.telefono || null,
            rol_id: v.rol_id as number,
            sucursal_id: sucursalId,
            proveedor_id: proveedorId,
            password: v.password,
          }),
        );
      }
      this.ref.close(resultado);
    } catch (e: unknown) {
      const err = e as { error?: { detail?: string } };
      this.error.set(err.error?.detail ?? 'No se pudo guardar. Revisá los datos.');
    } finally {
      this.guardando.set(false);
    }
  }

  cerrar(): void {
    this.ref.close();
  }
}
