import { Component, inject, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { HorarioDia } from '../../core/models/sucursal.model';
import { SucursalesService } from './sucursales.service';

export interface HorariosDialogData {
  sucursalId: number;
  sucursalNombre: string;
}

const NOMBRES_DIA = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

@Component({
  selector: 'app-horarios-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Horarios de atención — {{ data.sucursalNombre }}</h2>
    <mat-dialog-content>
      @if (cargando()) {
        <div class="cargando"><mat-spinner diameter="28" /></div>
      } @else {
        <div class="dias" [formGroup]="form">
          <div formArrayName="dias">
            @for (dia of diasArray.controls; track $index) {
              <div class="fila" [formGroupName]="$index">
                <span class="nombre-dia">{{ nombresDia[$index] }}</span>
                <mat-slide-toggle formControlName="abierto">
                  {{ dia.value.abierto ? 'Abierto' : 'Cerrado' }}
                </mat-slide-toggle>
                @if (dia.value.abierto) {
                  <mat-form-field appearance="outline" class="hora">
                    <mat-label>Apertura</mat-label>
                    <input matInput type="time" formControlName="hora_apertura" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="hora">
                    <mat-label>Cierre</mat-label>
                    <input matInput type="time" formControlName="hora_cierre" />
                  </mat-form-field>
                }
              </div>
            }
          </div>
        </div>
        @if (error()) {
          <p class="err">{{ error() }}</p>
        }
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close()">Cancelar</button>
      <button
        mat-flat-button
        class="btn-primary"
        (click)="guardar()"
        [disabled]="cargando() || guardando()"
      >
        @if (guardando()) {
          <mat-spinner diameter="18" />
        } @else {
          Guardar horarios
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .cargando { display: flex; justify-content: center; padding: 2rem; }
    .dias { min-width: min(560px, 86vw); display: flex; flex-direction: column; gap: .35rem; padding-top: .25rem; }
    .fila {
      display: grid;
      grid-template-columns: 90px 140px 1fr 1fr;
      align-items: center;
      gap: .6rem;
      padding: .3rem 0;
      border-bottom: 1px solid #eef2f7;
    }
    .nombre-dia { font-weight: 500; color: #334155; }
    .hora { width: 100%; }
    ::ng-deep .hora .mat-mdc-form-field-infix { min-height: 40px; }
    .err { color:#b3261e; font-size:.85rem; margin: .5rem 0 0; }
    .btn-primary { background: var(--fs-green-700); color: #fff; }
    @media (max-width: 560px) {
      .fila { grid-template-columns: 1fr; }
    }
  `,
})
export class HorariosDialog {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(SucursalesService);
  protected readonly ref = inject(MatDialogRef<HorariosDialog, boolean>);
  protected readonly data = inject<HorariosDialogData>(MAT_DIALOG_DATA);

  protected readonly nombresDia = NOMBRES_DIA;
  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.group({
    dias: this.fb.array(
      Array.from({ length: 7 }, () =>
        this.fb.group({
          dia_semana: [0],
          abierto: [true],
          hora_apertura: ['09:00'],
          hora_cierre: ['19:00'],
        }),
      ),
    ),
  });

  protected get diasArray(): FormArray {
    return this.form.get('dias') as FormArray;
  }

  constructor() {
    this.service.obtenerHorarios(this.data.sucursalId).subscribe({
      next: (dias) => {
        dias
          .sort((a, b) => a.dia_semana - b.dia_semana)
          .forEach((d: HorarioDia, i: number) => {
            this.diasArray.at(i).patchValue({
              dia_semana: d.dia_semana,
              abierto: !d.cerrado,
              hora_apertura: (d.hora_apertura ?? '09:00').slice(0, 5),
              hora_cierre: (d.hora_cierre ?? '19:00').slice(0, 5),
            });
          });
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  async guardar(): Promise<void> {
    if (this.guardando()) return;
    this.guardando.set(true);
    this.error.set(null);
    const dias = this.diasArray.value.map(
      (d: {
        dia_semana: number;
        abierto: boolean;
        hora_apertura: string;
        hora_cierre: string;
      }) => ({
        dia_semana: d.dia_semana,
        cerrado: !d.abierto,
        hora_apertura: d.abierto ? `${d.hora_apertura}:00` : null,
        hora_cierre: d.abierto ? `${d.hora_cierre}:00` : null,
      }),
    );
    try {
      await firstValueFrom(this.service.guardarHorarios(this.data.sucursalId, dias));
      this.ref.close(true);
    } catch (e: unknown) {
      this.error.set(
        (e as { error?: { detail?: string } }).error?.detail ??
          'No se pudieron guardar los horarios.',
      );
    } finally {
      this.guardando.set(false);
    }
  }
}
