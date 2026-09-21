import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TiendaService } from './tienda.service';
import {
  CatalogoProductoDetalle,
  CatalogoVariante,
} from '../../core/models/catalogo-cliente.model';
import { DisponibilidadSucursal } from '../../core/models/inventario.model';
import { AuthService } from '../../core/auth/auth.service';
import { ROL } from '../../core/models/usuario.model';
import {
  AgregarReservaData,
  AgregarReservaDialog,
} from '../reservas/agregar-reserva-dialog';
import { CarritoService } from '../carrito/carrito.service';

@Component({
  selector: 'app-producto-detalle-cliente-page',
  imports: [
    RouterLink,
    DecimalPipe,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
  ],
  templateUrl: './producto-detalle-cliente-page.html',
  styleUrl: './producto-detalle-cliente-page.scss',
})
export class ProductoDetalleClientePage {
  private readonly tienda = inject(TiendaService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  private readonly carritoSvc = inject(CarritoService);

  protected readonly agregandoCarrito = signal(false);

  protected readonly cargando = signal(true);
  protected readonly noEncontrado = signal(false);
  protected readonly producto = signal<CatalogoProductoDetalle | null>(null);

  protected readonly colorSel = signal<number | null>(null);
  protected readonly tallaSel = signal<number | null>(null);

  protected readonly colores = computed(() => {
    const vs = this.producto()?.variantes ?? [];
    const vistos = new Map<number, CatalogoVariante>();
    for (const v of vs) if (!vistos.has(v.color_id)) vistos.set(v.color_id, v);
    return [...vistos.values()];
  });

  protected readonly tallasParaColor = computed(() => {
    const vs = this.producto()?.variantes ?? [];
    const color = this.colorSel();
    return vs.filter((v) => (color == null ? true : v.color_id === color));
  });

  protected readonly varianteSeleccionada = computed(() => {
    const vs = this.producto()?.variantes ?? [];
    return (
      vs.find(
        (v) => v.color_id === this.colorSel() && v.talla_id === this.tallaSel(),
      ) ?? null
    );
  });

  protected readonly imagenMostrada = computed(
    () => this.varianteSeleccionada()?.imagen_efectivo ?? this.producto()?.imagen_url ?? null,
  );

  protected readonly disponibilidad = signal<DisponibilidadSucursal[]>([]);
  protected readonly cargandoDisponibilidad = signal(false);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.tienda.detalle(id).subscribe({
      next: (d) => {
        this.producto.set(d);
        this.cargando.set(false);
        if (d.variantes.length > 0) {
          this.colorSel.set(d.variantes[0].color_id);
          this.tallaSel.set(d.variantes[0].talla_id);
        }
      },
      error: () => {
        this.cargando.set(false);
        this.noEncontrado.set(true);
      },
    });

    // CU12: consultar disponibilidad por sucursal de la variante elegida
    effect(() => {
      const variante = this.varianteSeleccionada();
      if (!variante) {
        this.disponibilidad.set([]);
        return;
      }
      this.cargandoDisponibilidad.set(true);
      this.tienda.disponibilidad(variante.id).subscribe({
        next: (res) => {
          this.disponibilidad.set(res);
          this.cargandoDisponibilidad.set(false);
        },
        error: () => {
          this.disponibilidad.set([]);
          this.cargandoDisponibilidad.set(false);
        },
      });
    });
  }

  elegirColor(colorId: number): void {
    this.colorSel.set(colorId);
    const disponibles = this.tallasParaColor();
    if (!disponibles.some((v) => v.talla_id === this.tallaSel())) {
      this.tallaSel.set(disponibles[0]?.talla_id ?? null);
    }
  }

  elegirTalla(tallaId: number): void {
    this.tallaSel.set(tallaId);
  }

  agregarAReserva(): void {
    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/ingresar'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }
    if (!this.auth.hasRole(ROL.CLIENTE)) {
      this.snack.open(
        'Las reservas están disponibles solo para cuentas de cliente.',
        'Cerrar',
        { duration: 4000 },
      );
      return;
    }
    const variante = this.varianteSeleccionada();
    const disponibles = this.disponibilidad();
    if (!variante || disponibles.length === 0) return;

    const ref = this.dialog.open<AgregarReservaDialog, AgregarReservaData, boolean>(
      AgregarReservaDialog,
      {
        data: {
          varianteId: variante.id,
          productoNombre: this.producto()?.nombre ?? '',
          talla: variante.talla,
          color: variante.color,
          imagenUrl: variante.imagen_efectivo ?? this.producto()?.imagen_url ?? null,
          sucursales: disponibles,
        },
        autoFocus: 'first-tabbable',
      },
    );
    ref.afterClosed().subscribe((agregada) => {
      if (agregada) {
        this.snack
          .open('Agregada a tu reserva.', 'Ver mi reserva', { duration: 4000 })
          .onAction()
          .subscribe(() => void this.router.navigate(['/mi-reserva']));
      }
    });
  }

  agregarAlCarrito(): void {
    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/ingresar'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }
    if (!this.auth.hasRole(ROL.CLIENTE)) {
      this.snack.open(
        'Comprar está disponible solo para cuentas de cliente.',
        'Cerrar',
        { duration: 4000 },
      );
      return;
    }
    const variante = this.varianteSeleccionada();
    if (!variante) return;

    this.agregandoCarrito.set(true);
    this.carritoSvc.agregar({ variante_id: variante.id, cantidad: 1 }).subscribe({
      next: () => {
        this.agregandoCarrito.set(false);
        this.snack.open('Se agregó al carrito.', 'Ver carrito', {
          duration: 3500,
        }).onAction().subscribe(() => void this.router.navigate(['/carrito']));
      },
      error: (e: unknown) => {
        this.agregandoCarrito.set(false);
        this.snack.open(
          (e as { error?: { detail?: string } }).error?.detail ??
            'No se pudo agregar al carrito.',
          'Cerrar',
          { duration: 4000 },
        );
      },
    });
  }
}
