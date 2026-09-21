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

import { Categoria } from '../../core/models/catalogo.model';
import { CatalogoService } from './catalogo.service';

@Component({
  selector: 'app-categoria-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar categoría' : 'Nueva categoría' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="col" (ngSubmit)="guardar()">
        <mat-form-field appearance="outline">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="nombre" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Descripción</mat-label>
          <textarea matInput rows="2" formControlName="descripcion"></textarea>
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
    .col { display: flex; flex-direction: column; gap: .4rem; padding-top: .5rem; min-width: min(420px, 80vw); }
    mat-form-field { width: 100%; }
    .err { color: #b3261e; font-size: .85rem; margin: 0; }
  `,
})
export class CategoriaDialog {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CatalogoService);
  protected readonly ref = inject(MatDialogRef<CategoriaDialog, Categoria>);
  protected readonly data = inject<Categoria | null>(MAT_DIALOG_DATA);

  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    nombre: [this.data?.nombre ?? '', [Validators.required, Validators.minLength(2)]],
    descripcion: [this.data?.descripcion ?? ''],
    activo: [this.data?.activo ?? true],
  });

  async guardar(): Promise<void> {
    if (this.form.invalid || this.guardando()) return;
    this.guardando.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    try {
      const res = this.data
        ? await firstValueFrom(
            this.service.actualizarCategoria(this.data.id, {
              nombre: v.nombre,
              descripcion: v.descripcion || null,
              activo: v.activo,
            }),
          )
        : await firstValueFrom(
            this.service.crearCategoria({
              nombre: v.nombre,
              descripcion: v.descripcion || null,
            }),
          );
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
