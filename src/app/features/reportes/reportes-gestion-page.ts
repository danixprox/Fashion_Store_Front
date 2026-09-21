import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ReporteInventario, ReporteVentas } from '../../core/models/reporte.model';
import { SucursalOpcion } from '../../core/models/sucursal.model';
import { SucursalesService } from '../sucursales/sucursales.service';
import { ReportesService } from './reportes.service';

function fechaISO(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** CU31 — Generar Reportes de Ventas e Inventario (Administrador, sin IA). */
@Component({
  selector: 'app-reportes-gestion-page',
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSlideToggleModule,
  ],
  templateUrl: './reportes-gestion-page.html',
  styleUrl: './reportes-gestion-page.scss',
})
export class ReportesGestionPage {
  private readonly service = inject(ReportesService);
  private readonly sucursalesSvc = inject(SucursalesService);
  private readonly snack = inject(MatSnackBar);

  protected readonly sucursales = toSignal(this.sucursalesSvc.opciones(), {
    initialValue: [] as SucursalOpcion[],
  });

  // --- Ventas ---
  private readonly hoy = new Date();
  protected readonly desde = new FormControl<Date>(
    new Date(this.hoy.getFullYear(), this.hoy.getMonth(), this.hoy.getDate() - 29),
    { nonNullable: true, validators: [Validators.required] },
  );
  protected readonly hasta = new FormControl<Date>(this.hoy, {
    nonNullable: true,
    validators: [Validators.required],
  });
  protected readonly sucursalVentas = signal<number | null>(null);
  protected readonly cargandoVentas = signal(false);
  protected readonly ventas = signal<ReporteVentas | null>(null);

  // --- Inventario ---
  protected readonly sucursalInv = signal<number | null>(null);
  protected readonly umbral = new FormControl(3, {
    nonNullable: true,
    validators: [Validators.required, Validators.min(0), Validators.max(1000)],
  });
  protected readonly soloBajo = signal(false);
  protected readonly cargandoInv = signal(false);
  protected readonly inventario = signal<ReporteInventario | null>(null);
  protected readonly itemsInventario = computed(() => {
    const r = this.inventario();
    if (!r) return [];
    return this.soloBajo() ? r.items.filter((i) => i.stock_bajo) : r.items;
  });

  generarVentas(): void {
    if (this.desde.invalid || this.hasta.invalid || this.cargandoVentas()) return;
    if (this.hasta.value < this.desde.value) {
      this.snack.open('La fecha final no puede ser anterior a la inicial.', 'Cerrar', {
        duration: 4000,
      });
      return;
    }
    this.cargandoVentas.set(true);
    this.service
      .ventas(fechaISO(this.desde.value), fechaISO(this.hasta.value), this.sucursalVentas())
      .subscribe({
        next: (r) => {
          this.ventas.set(r);
          this.cargandoVentas.set(false);
        },
        error: (e: unknown) => {
          this.cargandoVentas.set(false);
          this.error(e, 'No se pudo generar el reporte de ventas.');
        },
      });
  }

  generarInventario(): void {
    if (this.umbral.invalid || this.cargandoInv()) return;
    this.cargandoInv.set(true);
    this.service.inventario(this.sucursalInv(), this.umbral.value).subscribe({
      next: (r) => {
        this.inventario.set(r);
        this.cargandoInv.set(false);
      },
      error: (e: unknown) => {
        this.cargandoInv.set(false);
        this.error(e, 'No se pudo generar el reporte de inventario.');
      },
    });
  }

  private error(e: unknown, mensaje: string): void {
    const detail = (e as { error?: { detail?: unknown } }).error?.detail;
    this.snack.open(typeof detail === 'string' ? detail : mensaje, 'Cerrar', { duration: 4000 });
  }
}
