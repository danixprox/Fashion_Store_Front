import { Component, OnDestroy, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, timer } from 'rxjs';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { EstadoPago } from '../../core/models/venta.model';
import { VentasService } from './ventas.service';

type Fase = 'confirmando' | 'aprobado' | 'rechazado' | 'cancelado' | 'agotado';

const INTERVALO_MS = 2500;
const MAX_INTENTOS = 16; // ~40s

@Component({
  selector: 'app-checkout-resultado-page',
  imports: [
    RouterLink,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './checkout-resultado-page.html',
  styleUrl: './checkout-resultado-page.scss',
})
export class CheckoutResultadoPage implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly ventasSvc = inject(VentasService);
  private readonly snack = inject(MatSnackBar);
  private sub: Subscription | null = null;

  protected readonly ventaId = signal<number | null>(null);
  protected readonly fase = signal<Fase>('confirmando');
  protected readonly reintentando = signal(false);

  constructor() {
    const params = this.route.snapshot.queryParamMap;
    const id = Number(params.get('venta_id'));
    const resultado = params.get('resultado');
    this.ventaId.set(id || null);

    if (!id) {
      this.fase.set('rechazado');
      return;
    }
    if (resultado === 'cancelado') {
      this.fase.set('cancelado');
      return;
    }
    this.consultar(0);
  }

  private consultar(intento: number): void {
    const ventaId = this.ventaId();
    if (!ventaId) return;
    this.ventasSvc.estadoPago(ventaId).subscribe({
      next: (info) => {
        const estado: EstadoPago | null = info.pago_estado;
        if (estado === 'APROBADO') {
          this.fase.set('aprobado');
          return;
        }
        if (estado === 'RECHAZADO') {
          this.fase.set('rechazado');
          return;
        }
        if (intento + 1 >= MAX_INTENTOS) {
          this.fase.set('agotado');
          return;
        }
        this.sub = timer(INTERVALO_MS).subscribe(() => this.consultar(intento + 1));
      },
      error: () => this.fase.set('agotado'),
    });
  }

  reintentarPago(): void {
    const ventaId = this.ventaId();
    if (!ventaId || this.reintentando()) return;
    this.reintentando.set(true);
    this.ventasSvc.iniciarPago(ventaId).subscribe({
      next: (pago) => {
        if (pago.checkout_url) window.location.href = pago.checkout_url;
      },
      error: (e: unknown) => {
        this.reintentando.set(false);
        this.snack.open(
          (e as { error?: { detail?: string } }).error?.detail ??
            'No se pudo generar un nuevo link de pago.',
          'Cerrar',
          { duration: 4000 },
        );
      },
    });
  }

  volverAConsultar(): void {
    this.fase.set('confirmando');
    this.consultar(0);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
