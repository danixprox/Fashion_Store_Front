import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Reserva } from '../../core/models/reserva.model';
import { GrupoReservaCard } from './grupo-reserva-card';
import { ReservaBolsaService } from './reserva-bolsa.service';

/** CU16 — "Mi reserva": arma una reserva con varias prendas y elige el turno por sucursal. */
@Component({
  selector: 'app-mi-reserva-page',
  imports: [RouterLink, MatToolbarModule, MatIconModule, MatButtonModule, GrupoReservaCard],
  template: `
    <mat-toolbar class="bar">
      <button mat-icon-button (click)="volver()" aria-label="Volver">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <span>Mi reserva</span>
    </mat-toolbar>

    <div class="contenido">
      @if (bolsa.grupos().length === 0) {
        <div class="vacio">
          <mat-icon>event_available</mat-icon>
          <p>Todavía no agregaste prendas para probarte.</p>
          <a mat-flat-button class="btn-primario" routerLink="/catalogo">Ver catálogo</a>
        </div>
      } @else {
        <p class="ayuda">
          Elegí las prendas que querés probarte y reservá un turno. Una reserva es de una sola
          sucursal: si agregaste prendas de sucursales distintas, reservás cada grupo por separado.
        </p>
        @for (g of bolsa.grupos(); track g.sucursalId) {
          <app-grupo-reserva-card [grupo]="g" (reservada)="alReservar($event, g.sucursal)" />
        }
      }
    </div>
  `,
  styles: `
    :host { display: block; }
    .bar { background: var(--fs-green-700); color: #fff; gap: .25rem; }
    .contenido { max-width: 720px; margin: 0 auto; padding: 1.25rem 1rem 3rem; display: flex; flex-direction: column; gap: 1rem; }
    .ayuda { margin: 0; color: #64748b; font-size: .9rem; }
    .vacio { text-align: center; color: #64748b; padding: 3rem 1rem; display: flex; flex-direction: column; align-items: center; gap: .5rem; }
    .vacio mat-icon { font-size: 3rem; width: 3rem; height: 3rem; color: var(--fs-green-500); }
    .btn-primario { background: var(--fs-green-700); color: #fff; }
  `,
})
export class MiReservaPage {
  protected readonly bolsa = inject(ReservaBolsaService);
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  volver(): void {
    this.location.back();
  }

  alReservar(reserva: Reserva, sucursal: string): void {
    this.snack.open(
      `Reserva #${reserva.id} confirmada en ${sucursal}. La ves en "Mis reservas".`,
      'Ver',
      { duration: 5000 },
    ).onAction().subscribe(() => void this.router.navigate(['/mis-reservas']));
    if (this.bolsa.grupos().length === 0) {
      void this.router.navigate(['/mis-reservas']);
    }
  }
}
