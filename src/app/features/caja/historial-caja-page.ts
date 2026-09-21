import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { VentaCaja } from '../../core/models/venta.model';
import { CajaService } from './caja.service';

@Component({
  selector: 'app-historial-caja-page',
  imports: [RouterLink, DatePipe, DecimalPipe, MatIconModule, MatButtonModule, MatProgressBarModule],
  templateUrl: './historial-caja-page.html',
  styleUrl: './historial-caja-page.scss',
})
export class HistorialCajaPage {
  private readonly service = inject(CajaService);

  protected readonly cargando = signal(true);
  protected readonly ventas = signal<VentaCaja[]>([]);
  protected readonly sinResultados = computed(
    () => !this.cargando() && this.ventas().length === 0,
  );

  constructor() {
    this.service.historial().subscribe({
      next: (v) => {
        this.ventas.set(v);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}
