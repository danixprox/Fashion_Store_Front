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

import { Color } from '../../core/models/catalogo.model';
import { CatalogoService } from './catalogo.service';

@Component({
  selector: 'app-color-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar color' : 'Nuevo color' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="col" (ngSubmit)="guardar()">
        <mat-form-field appearance="outline">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="nombre" />
        </mat-form-field>
        <div class="hex-row">
          <input type="color" [value]="form.controls.codigo_hex.value || '#000000'"
                 (input)="setHex($any($event.target).value)" aria-label="Elegir color" />
          <mat-form-field appearance="outline">
            <mat-label>Código hex</mat-label>
            <input matInput formControlName="codigo_hex" placeholder="#RRGGBB" />
            <mat-hint>Opcional</mat-hint>
          </mat-form-field>
        </div>
        @if (data) {
          <mat-slide-toggle formControlName="activo">Activo</mat-slide-toggle>
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
    .col { display: flex; flex-direction: column; gap: .4rem; padding-top: .5rem; min-width: min(380px, 80vw); }
    mat-form-field { width: 100%; }
    .hex-row { display: flex; align-items: flex-start; gap: .6rem; }
    .hex-row input[type=color] { width: 44px; height: 44px; border: none; background: none; cursor: pointer; }
    .err { color: #b3261e; font-size: .85rem; margin: 0; }
  `,
})
export class ColorDialog {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CatalogoService);
  protected readonly ref = inject(MatDialogRef<ColorDialog, Color>);
  protected readonly data = inject<Color | null>(MAT_DIALOG_DATA);

  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    nombre: [this.data?.nombre ?? '', [Validators.required, Validators.minLength(2)]],
    codigo_hex: [
      this.data?.codigo_hex ?? '',
      [Validators.pattern(/^#[0-9A-Fa-f]{6}$/)],
    ],
    activo: [this.data?.activo ?? true],
  });

  setHex(value: string): void {
    this.form.controls.codigo_hex.setValue(value.toUpperCase());
  }

  async guardar(): Promise<void> {
    if (this.form.invalid || this.guardando()) return;
    this.guardando.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    try {
      const res = this.data
        ? await firstValueFrom(
            this.service.actualizarColor(this.data.id, {
              nombre: v.nombre,
              codigo_hex: v.codigo_hex || null,
              activo: v.activo,
            }),
          )
        : await firstValueFrom(
            this.service.crearColor({
              nombre: v.nombre,
              codigo_hex: v.codigo_hex || null,
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
