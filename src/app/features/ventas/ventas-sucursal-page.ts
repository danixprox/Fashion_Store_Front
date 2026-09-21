import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';

import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/auth/auth.service';
import { ROL } from '../../core/models/usuario.model';
import { SucursalOpcion } from '../../core/models/sucursal.model';
import { VentaCaja } from '../../core/models/venta.model';
import { SucursalesService } from '../sucursales/sucursales.service';
import { VentasService } from './ventas.service';

const ETIQUETA_ESTADO: Record<string, string> = {
  PENDIENTE_PAGO: 'Pendiente de pago',
  PAGADA: 'Pagada',
  COMPLETADA: 'Completada',
  ANULADA: 'Anulada',
};

@Component({
  selector: 'app-ventas-sucursal-page',
  imports: [
    DatePipe,
    DecimalPipe,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressBarModule,
  ],
  templateUrl: './ventas-sucursal-page.html',
  styleUrl: './ventas-sucursal-page.scss',
})
export class VentasSucursalPage implements OnInit {
  private readonly service = inject(VentasService);
  private readonly sucursalesSvc = inject(SucursalesService);
  private readonly auth = inject(AuthService);
  private readonly snack = inject(MatSnackBar);

  /** El encargado solo ve su propia sucursal (mismo patrón que Inventario/Movimientos). */
  protected readonly esEncargado = computed(() => this.auth.hasRole(ROL.ENCARGADO));

  protected readonly columnas = computed(() =>
    this.esEncargado()
      ? ['fecha', 'cliente', 'origen', 'items', 'entrega', 'estado', 'total']
      : ['fecha', 'sucursal', 'cliente', 'origen', 'items', 'entrega', 'estado', 'total'],
  );

  protected readonly sucursales = toSignal(this.sucursalesSvc.opciones(), {
    initialValue: [] as SucursalOpcion[],
  });

  protected readonly cargando = signal(false);
  protected readonly ventas = signal<VentaCaja[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(0);
  protected readonly size = signal(10);
  protected readonly sucursalId = signal<number | null>(null);
  protected readonly estado = signal<string | null>(null);

  protected readonly sinResultados = computed(
    () => !this.cargando() && this.ventas().length === 0,
  );

  ngOnInit(): void {
    this.cargar();
  }

  cambiarSucursal(valor: number | null): void {
    this.sucursalId.set(valor);
    this.page.set(0);
    this.cargar();
  }

  cambiarEstado(valor: string | null): void {
    this.estado.set(valor);
    this.page.set(0);
    this.cargar();
  }

  onPage(ev: PageEvent): void {
    this.page.set(ev.pageIndex);
    this.size.set(ev.pageSize);
    this.cargar();
  }

  etiquetaEstado(estado: string): string {
    return ETIQUETA_ESTADO[estado] ?? estado;
  }

  origen(v: VentaCaja): string {
    if (v.reserva_id) return `Reserva #${v.reserva_id}`;
    return v.cajero_nombre ? `Presencial · ${v.cajero_nombre}` : 'Web';
  }

  private cargar(): void {
    this.cargando.set(true);
    this.service
      .listarSucursal({
        sucursal_id: this.sucursalId(),
        estado: this.estado(),
        page: this.page() + 1,
        size: this.size(),
      })
      .subscribe({
        next: (res) => {
          this.ventas.set(res.items);
          this.total.set(res.total);
          this.cargando.set(false);
        },
        error: (e: unknown) => {
          this.cargando.set(false);
          this.snack.open(
            (e as { error?: { detail?: string } }).error?.detail ??
              'No se pudieron cargar las ventas.',
            'Cerrar',
            { duration: 4000 },
          );
        },
      });
  }
}
