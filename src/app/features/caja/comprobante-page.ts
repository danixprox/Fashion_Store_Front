import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { Comprobante } from '../../core/models/venta.model';
import { CajaService } from './caja.service';

@Component({
  selector: 'app-comprobante-page',
  imports: [
    RouterLink,
    DatePipe,
    DecimalPipe,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
  ],
  templateUrl: './comprobante-page.html',
  styleUrl: './comprobante-page.scss',
})
export class ComprobantePage {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(CajaService);

  protected readonly cargando = signal(true);
  protected readonly comprobante = signal<Comprobante | null>(null);
  protected readonly error = signal(false);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.service.comprobante(id).subscribe({
      next: (c) => {
        this.comprobante.set(c);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
      },
    });
  }

  /** Cuánto se descontó en total por promociones (precio original − precio cobrado). */
  ahorro(c: Comprobante): number {
    return c.items.reduce(
      (t, i) => t + (i.precio_original ? (+i.precio_original - +i.precio_unitario) * i.cantidad : 0),
      0,
    );
  }

  imprimir(): void {
    window.print();
  }
}
