import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { VentaCaja } from '../../core/models/venta.model';
import { CajaService } from './caja.service';
import { CobroDialog } from './cobro-dialog';

/** CU25 — ventas de reservas finalizadas, esperando el cobro en caja. */
@Component({
  selector: 'app-por-cobrar-page',
  imports: [DatePipe, DecimalPipe, MatIconModule, MatButtonModule, MatProgressBarModule],
  templateUrl: './por-cobrar-page.html',
  styleUrl: './por-cobrar-page.scss',
})
export class PorCobrarPage {
  private readonly service = inject(CajaService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  private readonly router = inject(Router);

  protected readonly cargando = signal(true);
  protected readonly procesando = signal<number | null>(null);
  protected readonly ventas = signal<VentaCaja[]>([]);
  protected readonly sinResultados = computed(
    () => !this.cargando() && this.ventas().length === 0,
  );

  constructor() {
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    this.service.porCobrar().subscribe({
      next: (v) => {
        this.ventas.set(v);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  cobrar(v: VentaCaja): void {
    const ref = this.dialog.open(CobroDialog, { data: v, autoFocus: 'first-tabbable' });
    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.snack.open('Cobro registrado.', 'OK', { duration: 2500 });
        void this.router.navigate(['/caja/comprobante', v.id]);
      }
    });
  }

  anular(v: VentaCaja): void {
    if (!confirm('¿El cliente no se lleva estas prendas? Volverán al stock.')) return;
    this.procesando.set(v.id);
    this.service.anular(v.id).subscribe({
      next: () => {
        this.procesando.set(null);
        this.snack.open('Venta anulada. Las prendas volvieron al stock.', 'OK', {
          duration: 3000,
        });
        this.cargar();
      },
      error: (e: unknown) => {
        this.procesando.set(null);
        this.snack.open(
          (e as { error?: { detail?: string } }).error?.detail ?? 'No se pudo anular la venta.',
          'Cerrar',
          { duration: 4000 },
        );
      },
    });
  }
}
