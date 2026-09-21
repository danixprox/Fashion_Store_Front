import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SucursalOpcion } from '../../core/models/sucursal.model';
import { InventarioItem } from '../../core/models/inventario.model';
import { InventarioService } from './inventario.service';
import { SucursalesService } from '../sucursales/sucursales.service';
import { AjustarStockDialog, AjustarStockDialogData } from './ajustar-stock-dialog';
import { AuthService } from '../../core/auth/auth.service';
import { ROL } from '../../core/models/usuario.model';

@Component({
  selector: 'app-inventario-page',
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './inventario-page.html',
  styleUrl: './inventario-page.scss',
})
export class InventarioPage implements OnInit {
  private readonly service = inject(InventarioService);
  private readonly sucursalesSvc = inject(SucursalesService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(AuthService);

  /** El encargado solo ve/opera sobre su propia sucursal. */
  protected readonly esEncargado = computed(() => this.auth.hasRole(ROL.ENCARGADO));
  private readonly miSucursalId = computed(() => this.auth.user()?.sucursal_id ?? null);

  private readonly buscador =
    viewChild<ElementRef<HTMLInputElement>>('buscador');

  protected readonly columnas = [
    'producto',
    'variante',
    'sucursal',
    'disponible',
    'reservado',
    'costo',
    'estado',
    'acciones',
  ];

  protected readonly sucursales = toSignal(this.sucursalesSvc.opciones(), {
    initialValue: [] as SucursalOpcion[],
  });

  protected readonly cargando = signal(false);
  protected readonly items = signal<InventarioItem[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(0);
  protected readonly size = signal(10);

  protected readonly qCtrl = new FormControl('', { nonNullable: true });
  protected readonly sucursalId = signal<number | null>(null);

  protected readonly sinResultados = computed(
    () => !this.cargando() && this.items().length === 0,
  );

  ngOnInit(): void {
    if (this.esEncargado()) {
      this.sucursalId.set(this.miSucursalId());
    }
    this.qCtrl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.page.set(0);
        this.cargar();
      });
    this.cargar();
  }

  @HostListener('document:keydown', ['$event'])
  enfocarBuscador(ev: Event): void {
    const e = ev as KeyboardEvent;
    if (e.key !== '/') return;
    const t = e.target as HTMLElement;
    if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return;
    e.preventDefault();
    this.buscador()?.nativeElement.focus();
  }

  cambiarSucursal(valor: number | null): void {
    this.sucursalId.set(valor);
    this.page.set(0);
    this.cargar();
  }

  onPage(ev: PageEvent): void {
    this.page.set(ev.pageIndex);
    this.size.set(ev.pageSize);
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    this.service
      .listar({
        q: this.qCtrl.value.trim() || undefined,
        sucursal_id: this.sucursalId(),
        page: this.page() + 1,
        size: this.size(),
      })
      .subscribe({
        next: (res) => {
          this.items.set(res.items);
          this.total.set(res.total);
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.snack.open('No se pudo cargar el inventario.', 'Cerrar', {
            duration: 4000,
          });
        },
      });
  }

  ajustar(item?: InventarioItem): void {
    const ref = this.dialog.open<
      AjustarStockDialog,
      AjustarStockDialogData,
      InventarioItem | undefined
    >(AjustarStockDialog, {
      data: {
        item,
        sucursalFija: this.esEncargado() ? this.miSucursalId() ?? undefined : undefined,
      },
      autoFocus: 'first-tabbable',
    });
    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.snack.open('Stock actualizado.', 'OK', { duration: 2500 });
        this.cargar();
      }
    });
  }
}
