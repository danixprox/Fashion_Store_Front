import { Component, computed, inject, signal } from '@angular/core';
import { Location, DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ItemCarrito } from '../../core/models/carrito.model';
import { CarritoService } from './carrito.service';

@Component({
  selector: 'app-carrito-page',
  imports: [
    RouterLink,
    DecimalPipe,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './carrito-page.html',
  styleUrl: './carrito-page.scss',
})
export class CarritoPage {
  private readonly service = inject(CarritoService);
  private readonly location = inject(Location);
  private readonly snack = inject(MatSnackBar);
  private readonly router = inject(Router);

  protected readonly cargando = signal(true);
  protected readonly actualizando = signal<number | null>(null);
  protected readonly carrito = this.service.carrito;

  protected readonly items = computed(() => this.carrito()?.items ?? []);
  protected readonly sinResultados = computed(
    () => !this.cargando() && this.items().length === 0,
  );
  protected readonly hayNoDisponibles = computed(() =>
    this.items().some((i) => !i.disponible),
  );

  constructor() {
    this.service.cargar().subscribe({
      next: () => this.cargando.set(false),
      error: () => this.cargando.set(false),
    });
  }

  volver(): void {
    this.location.back();
  }

  cambiarCantidad(item: ItemCarrito, delta: number): void {
    const nueva = item.cantidad + delta;
    if (nueva < 1 || nueva > 20) return;
    this.actualizando.set(item.id);
    this.service.actualizarCantidad(item.id, { cantidad: nueva }).subscribe({
      next: () => this.actualizando.set(null),
      error: (e: unknown) => {
        this.actualizando.set(null);
        this.mostrarError(e);
      },
    });
  }

  quitar(item: ItemCarrito): void {
    this.actualizando.set(item.id);
    this.service.quitar(item.id).subscribe({
      next: () => {
        this.actualizando.set(null);
        this.snack.open('Se quitó del carrito.', 'OK', { duration: 2000 });
      },
      error: (e: unknown) => {
        this.actualizando.set(null);
        this.mostrarError(e);
      },
    });
  }

  vaciar(): void {
    if (!confirm('¿Vaciar todo el carrito?')) return;
    this.service.vaciar().subscribe({
      next: () => this.snack.open('Carrito vacío.', 'OK', { duration: 2000 }),
      error: (e: unknown) => this.mostrarError(e),
    });
  }

  irACheckout(): void {
    if (this.hayNoDisponibles() || this.items().length === 0) return;
    void this.router.navigate(['/checkout']);
  }

  private mostrarError(e: unknown): void {
    this.snack.open(
      (e as { error?: { detail?: string } }).error?.detail ??
        'No se pudo actualizar el carrito.',
      'Cerrar',
      { duration: 4000 },
    );
  }
}
