import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { debounceTime, distinctUntilChanged, startWith, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../core/auth/auth.service';
import { TiendaService } from '../tienda/tienda.service';
import { CajaService } from './caja.service';
import { ClienteBuscado } from '../../core/models/venta.model';
import { CatalogoProducto, CatalogoVariante } from '../../core/models/catalogo-cliente.model';

interface ItemVentaLocal {
  variante_id: number;
  producto: string;
  talla: string | null;
  color: string | null;
  precio: number;
  cantidad: number;
}

type Paso = 'cliente' | 'items' | 'pago';

@Component({
  selector: 'app-nueva-venta-page',
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatRadioModule,
    MatProgressBarModule,
  ],
  templateUrl: './nueva-venta-page.html',
  styleUrl: './nueva-venta-page.scss',
})
export class NuevaVentaPage {
  private readonly auth = inject(AuthService);
  private readonly tienda = inject(TiendaService);
  private readonly caja = inject(CajaService);
  private readonly snack = inject(MatSnackBar);
  private readonly router = inject(Router);

  protected readonly paso = signal<Paso>('cliente');
  protected readonly guardando = signal(false);

  // --- Paso 1: cliente -------------------------------------------------- //
  protected readonly clienteQ = new FormControl('', { nonNullable: true });
  // Con el campo vacío igual se pide la lista (el backend devuelve los
  // últimos clientes registrados) para que sirva de ayuda antes de escribir.
  protected readonly clienteResultados = toSignal(
    this.clienteQ.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((q) => this.caja.buscarClientes(q.trim())),
    ),
    { initialValue: [] as ClienteBuscado[] },
  );
  protected readonly clienteSeleccionado = signal<ClienteBuscado | null>(null);
  protected readonly mostrarFormNuevo = signal(false);
  protected readonly formNuevoCliente = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: Validators.required }),
    apellido: new FormControl('', { nonNullable: true, validators: Validators.required }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    telefono: new FormControl(''),
  });

  elegirCliente(c: ClienteBuscado): void {
    this.clienteSeleccionado.set(c);
    this.mostrarFormNuevo.set(false);
  }

  quitarCliente(): void {
    this.clienteSeleccionado.set(null);
    this.clienteQ.setValue('');
  }

  registrarClienteNuevo(): void {
    if (this.formNuevoCliente.invalid) {
      this.formNuevoCliente.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.caja.registrarClienteRapido(this.formNuevoCliente.getRawValue()).subscribe({
      next: (c) => {
        this.guardando.set(false);
        this.mostrarFormNuevo.set(false);
        this.formNuevoCliente.reset();
        this.elegirCliente(c);
        this.snack.open('Cliente registrado.', 'OK', { duration: 2000 });
      },
      error: (e: unknown) => {
        this.guardando.set(false);
        this.mostrarError(e, 'No se pudo registrar el cliente.');
      },
    });
  }

  irAItems(): void {
    if (!this.clienteSeleccionado()) return;
    this.paso.set('items');
  }

  // --- Paso 2: productos -------------------------------------------------- //
  protected readonly productoQ = new FormControl('', { nonNullable: true });
  // Igual que con clientes: campo vacío = lista por defecto (las prendas
  // más nuevas del catálogo), como ayuda antes de escribir nada.
  protected readonly productoResultados = toSignal(
    this.productoQ.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((q) =>
        this.tienda.listar({ q: q.trim() || undefined, page: 1, size: 10 }),
      ),
    ),
    { initialValue: { items: [] as CatalogoProducto[], total: 0, page: 1, size: 10 } },
  );
  protected readonly productoElegido = signal<CatalogoProducto | null>(null);
  protected readonly variantesProducto = signal<CatalogoVariante[]>([]);
  protected readonly varianteElegida = signal<CatalogoVariante | null>(null);
  protected readonly stockVariante = signal<number | null>(null);
  protected readonly cantidad = signal(1);

  protected readonly items = signal<ItemVentaLocal[]>([]);
  protected readonly total = computed(() =>
    this.items().reduce((acc, i) => acc + i.precio * i.cantidad, 0),
  );

  elegirProducto(p: CatalogoProducto): void {
    this.productoElegido.set(p);
    this.varianteElegida.set(null);
    this.stockVariante.set(null);
    this.tienda.detalle(p.id).subscribe((d) => this.variantesProducto.set(d.variantes));
  }

  elegirVariante(v: CatalogoVariante): void {
    this.varianteElegida.set(v);
    this.stockVariante.set(null);
    const miSucursal = this.auth.user()?.sucursal_id;
    this.tienda.disponibilidad(v.id).subscribe((disp) => {
      const enMiSucursal = disp.find((d) => d.sucursal_id === miSucursal);
      this.stockVariante.set(enMiSucursal?.cantidad_disponible ?? 0);
    });
  }

  agregarItem(): void {
    const producto = this.productoElegido();
    const variante = this.varianteElegida();
    if (!producto || !variante || this.cantidad() < 1) return;

    const existente = this.items().find((i) => i.variante_id === variante.id);
    if (existente) {
      existente.cantidad += this.cantidad();
      this.items.set([...this.items()]);
    } else {
      this.items.update((lista) => [
        ...lista,
        {
          variante_id: variante.id,
          producto: producto.nombre,
          talla: variante.talla,
          color: variante.color,
          precio: +variante.precio_efectivo,
          cantidad: this.cantidad(),
        },
      ]);
    }

    this.productoQ.setValue('');
    this.productoElegido.set(null);
    this.variantesProducto.set([]);
    this.varianteElegida.set(null);
    this.stockVariante.set(null);
    this.cantidad.set(1);
  }

  quitarItem(varianteId: number): void {
    this.items.update((lista) => lista.filter((i) => i.variante_id !== varianteId));
  }

  protected readonly ventaId = signal<number | null>(null);

  registrarVenta(): void {
    const cliente = this.clienteSeleccionado();
    if (!cliente || this.items().length === 0) return;
    this.guardando.set(true);
    this.caja
      .crearVentaPresencial(
        cliente.id,
        this.items().map((i) => ({ variante_id: i.variante_id, cantidad: i.cantidad })),
      )
      .subscribe({
        next: (venta) => {
          this.guardando.set(false);
          this.ventaId.set(venta.id);
          this.paso.set('pago');
        },
        error: (e: unknown) => {
          this.guardando.set(false);
          this.mostrarError(e, 'No se pudo registrar la venta.');
        },
      });
  }

  // --- Paso 3: pago -------------------------------------------------- //
  protected readonly metodo = signal<'EFECTIVO' | 'TARJETA_CAJA'>('EFECTIVO');
  protected readonly montoRecibido = signal<number | null>(null);
  protected readonly vuelto = computed(() => {
    const recibido = this.montoRecibido();
    if (this.metodo() !== 'EFECTIVO' || recibido == null) return null;
    const v = recibido - this.total();
    return v >= 0 ? v : null;
  });

  confirmarPago(): void {
    const ventaId = this.ventaId();
    if (!ventaId) return;
    if (this.metodo() === 'EFECTIVO' && (this.montoRecibido() ?? 0) < this.total()) {
      this.snack.open('El monto recibido es menor al total.', 'Cerrar', { duration: 3000 });
      return;
    }
    this.guardando.set(true);
    this.caja
      .procesarPago(ventaId, {
        metodo: this.metodo(),
        monto_recibido:
          this.metodo() === 'EFECTIVO' ? String(this.montoRecibido()) : null,
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          void this.router.navigate(['/caja/comprobante', ventaId]);
        },
        error: (e: unknown) => {
          this.guardando.set(false);
          this.mostrarError(e, 'No se pudo procesar el pago.');
        },
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
