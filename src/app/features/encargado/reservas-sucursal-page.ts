import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/auth/auth.service';
import { ROL } from '../../core/models/usuario.model';
import { SucursalOpcion } from '../../core/models/sucursal.model';
import { ReservaSucursal } from '../../core/models/reserva.model';
import { SucursalesService } from '../sucursales/sucursales.service';
import { ReservasService } from '../reservas/reservas.service';
import { FinalizarReservaDialog } from './finalizar-reserva-dialog';

const ETIQUETA_ESTADO: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  NOTIFICADA: 'Notificada',
  PREPARADA: 'Preparada',
  ATENDIDA: 'Atendida',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
  EXPIRADA: 'Vencida',
};

@Component({
  selector: 'app-reservas-sucursal-page',
  imports: [
    DatePipe,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './reservas-sucursal-page.html',
  styleUrl: './reservas-sucursal-page.scss',
})
export class ReservasSucursalPage implements OnInit {
  private readonly service = inject(ReservasService);
  private readonly sucursalesSvc = inject(SucursalesService);
  private readonly auth = inject(AuthService);
  private readonly snack = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  /** El admin ve todas las sucursales (CU36); el encargado solo la suya (CU18/19). */
  protected readonly esEncargado = computed(() => this.auth.hasRole(ROL.ENCARGADO));

  protected readonly columnas = computed(() =>
    this.esEncargado()
      ? ['fecha', 'cliente', 'items', 'estado', 'acciones']
      : ['fecha', 'sucursal', 'cliente', 'items', 'estado'],
  );

  protected readonly sucursales = toSignal(this.sucursalesSvc.opciones(), {
    initialValue: [] as SucursalOpcion[],
  });

  protected readonly cargando = signal(false);
  protected readonly procesando = signal<number | null>(null);
  protected readonly reservas = signal<ReservaSucursal[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(0);
  protected readonly size = signal(10);
  protected readonly sucursalId = signal<number | null>(null);
  protected readonly estado = signal<string | null>(null);

  protected readonly sinResultados = computed(
    () => !this.cargando() && this.reservas().length === 0,
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
          this.reservas.set(res.items);
          this.total.set(res.total);
          this.cargando.set(false);
        },
        error: (e: unknown) => {
          this.cargando.set(false);
          this.snack.open(
            (e as { error?: { detail?: string } }).error?.detail ??
              'No se pudieron cargar las reservas.',
            'Cerrar',
            { duration: 4000 },
          );
        },
      });
  }

  notificar(r: ReservaSucursal): void {
    this.procesando.set(r.id);
    this.service.notificar(r.id).subscribe({
      next: (actualizada) => {
        this.reservas.update((lista) =>
          lista.map((x) => (x.id === actualizada.id ? actualizada : x)),
        );
        this.procesando.set(null);
        this.snack.open('Reserva notificada.', 'OK', { duration: 2500 });
      },
      error: (e: unknown) => {
        this.procesando.set(null);
        this.snack.open(
          (e as { error?: { detail?: string } }).error?.detail ??
            'No se pudo notificar la reserva.',
          'Cerrar',
          { duration: 4000 },
        );
      },
    });
  }

  finalizar(r: ReservaSucursal): void {
    const ref = this.dialog.open(FinalizarReservaDialog, { data: r });
    ref.afterClosed().subscribe((res) => {
      if (!res) return;
      this.reservas.update((lista) =>
        lista.map((x) => (x.id === res.reserva.id ? res.reserva : x)),
      );
      this.snack.open(
        res.venta_id
          ? `Reserva finalizada. Se envió a caja la venta #${res.venta_id} (Bs ${(+res.total).toFixed(2)}).`
          : 'Reserva finalizada. Todas las prendas volvieron al stock.',
        'OK',
        { duration: 5000 },
      );
    });
  }

  recepcionar(r: ReservaSucursal): void {
    this.procesando.set(r.id);
    this.service.recepcionar(r.id).subscribe({
      next: (actualizada) => {
        this.reservas.update((lista) =>
          lista.map((x) => (x.id === actualizada.id ? actualizada : x)),
        );
        this.procesando.set(null);
        this.snack.open('Reserva recepcionada.', 'OK', { duration: 2500 });
      },
      error: (e: unknown) => {
        this.procesando.set(null);
        this.snack.open(
          (e as { error?: { detail?: string } }).error?.detail ??
            'No se pudo recepcionar la reserva.',
          'Cerrar',
          { duration: 4000 },
        );
      },
    });
  }
}
