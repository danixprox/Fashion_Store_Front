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
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { TALLA_TIPOS, Talla } from '../../core/models/catalogo.model';
import { CatalogoService } from './catalogo.service';

@Component({
  selector: 'app-talla-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar talla' : 'Nueva talla' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="col" (ngSubmit)="guardar()">
        <mat-form-field appearance="outline">
          <mat-label>Valor</mat-label>
          <input matInput formControlName="valor" placeholder="S, M, L, 42…" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Tipo</mat-label>
          <mat-select formControlName="tipo">
            @for (t of tipos; track t) {
              <mat-option [value]="t">{{ t }}</mat-option>
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
    .col { display: flex; flex-direction: column; gap: .4rem; padding-top: .5rem; min-width: min(380px, 80vw); }
    mat-form-field { width: 100%; }
    .err { color: #b3261e; font-size: .85rem; margin: 0; }
  `,
})
export class TallaDialog {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(CatalogoService);
  protected readonly ref = inject(MatDialogRef<TallaDialog, Talla>);
  protected readonly data = inject<Talla | null>(MAT_DIALOG_DATA);
  protected readonly tipos = TALLA_TIPOS;

  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    valor: [this.data?.valor ?? '', [Validators.required]],
    tipo: [this.data?.tipo ?? 'Ropa', [Validators.required]],
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
            this.service.actualizarTalla(this.data.id, {
              valor: v.valor,
              tipo: v.tipo,
              activo: v.activo,
            }),
          )
        : await firstValueFrom(
            this.service.crearTalla({ valor: v.valor, tipo: v.tipo }),
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
