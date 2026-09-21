import { Component, computed, inject, signal } from '@angular/core';
import { Location, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Pago } from '../../core/models/venta.model';
import { CarritoService } from '../carrito/carrito.service';
import { VentasService } from './ventas.service';

type Paso = 'entrega' | 'pago';

@Component({
  selector: 'app-checkout-page',
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
  ],
  templateUrl: './checkout-page.html',
  styleUrl: './checkout-page.scss',
})
export class CheckoutPage {
  private readonly carritoSvc = inject(CarritoService);
  private readonly ventasSvc = inject(VentasService);
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  protected readonly cargando = signal(true);
  protected readonly procesando = signal(false);
  protected readonly paso = signal<Paso>('entrega');
  protected readonly pago = signal<Pago | null>(null);
  protected readonly ventaId = signal<number | null>(null);

  protected readonly direccion = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(5), Validators.maxLength(200)],
  });
  protected readonly referencia = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(150)],
  });

  protected readonly carrito = this.carritoSvc.carrito;
  protected readonly items = computed(() => this.carrito()?.items ?? []);

  constructor() {
    this.carritoSvc.cargar().subscribe({
      next: () => this.cargando.set(false),
      error: () => this.cargando.set(false),
    });
  }

  volver(): void {
    this.location.back();
  }

  continuarAlPago(): void {
    this.direccion.markAsTouched();
    if (this.direccion.invalid || this.referencia.invalid || this.procesando()) return;
    this.procesando.set(true);
    this.ventasSvc
      .checkout(this.direccion.value.trim(), this.referencia.value.trim() || null)
      .subscribe({
      next: (venta) => {
        this.ventaId.set(venta.id);
        this.carritoSvc.cargar().subscribe(); // el carrito ya quedó vacío
        this.iniciarPago(venta.id);
      },
      error: (e: unknown) => {
        this.procesando.set(false);
        this.mostrarError(e, 'No se pudo iniciar la compra.');
      },
    });
  }

  private iniciarPago(ventaId: number): void {
    this.ventasSvc.iniciarPago(ventaId).subscribe({
      next: (pago) => {
        this.pago.set(pago);
        this.paso.set('pago');
        this.procesando.set(false);
      },
      error: (e: unknown) => {
        this.procesando.set(false);
        this.mostrarError(e, 'No se pudo generar el link de pago.');
      },
    });
  }

  irAPagar(): void {
    const url = this.pago()?.checkout_url;
    if (url) window.location.href = url;
  }

  cancelarPedido(): void {
    const ventaId = this.ventaId();
    if (!ventaId || !confirm('¿Cancelar este pedido? El stock se libera.')) return;
    this.ventasSvc.cancelar(ventaId).subscribe({
      next: () => {
        this.snack.open('Pedido cancelado.', 'OK', { duration: 2500 });
        void this.router.navigate(['/catalogo']);
      },
      error: (e: unknown) => this.mostrarError(e, 'No se pudo cancelar el pedido.'),
    });
  }

  private mostrarError(e: unknown, fallback: string): void {
    this.snack.open(
      (e as { error?: { detail?: string } }).error?.detail ?? fallback,
      'Cerrar',
      { duration: 4000 },
    );
  }
}
