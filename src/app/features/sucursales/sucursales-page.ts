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

import { Sucursal } from '../../core/models/sucursal.model';
import { SucursalesService } from './sucursales.service';
import {
  SucursalFormData,
  SucursalFormDialog,
} from './sucursal-form-dialog';
import { HorariosDialog, HorariosDialogData } from './horarios-dialog';

@Component({
  selector: 'app-sucursales-page',
  imports: [
    ReactiveFormsModule,
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
  templateUrl: './sucursales-page.html',
  styleUrl: './sucursales-page.scss',
})
export class SucursalesPage implements OnInit {
  private readonly service = inject(SucursalesService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  private readonly buscador =
    viewChild<ElementRef<HTMLInputElement>>('buscador');

  protected readonly columnas = [
    'nombre',
    'ciudad',
    'direccion',
    'telefono',
    'estado',
    'acciones',
  ];

  protected readonly cargando = signal(false);
  protected readonly sucursales = signal<Sucursal[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(0);
  protected readonly size = signal(10);

  protected readonly qCtrl = new FormControl('', { nonNullable: true });
  protected readonly estado = signal<'todas' | 'activas' | 'inactivas'>('todas');

  protected readonly sinResultados = computed(
    () => !this.cargando() && this.sucursales().length === 0,
  );

  ngOnInit(): void {
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

  cambiarEstado(valor: 'todas' | 'activas' | 'inactivas'): void {
    this.estado.set(valor);
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
    const activa =
      this.estado() === 'todas' ? null : this.estado() === 'activas';
    this.service
      .listar({
        q: this.qCtrl.value.trim() || undefined,
        activa,
        page: this.page() + 1,
        size: this.size(),
      })
      .subscribe({
        next: (res) => {
          this.sucursales.set(res.items);
          this.total.set(res.total);
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.snack.open('No se pudieron cargar las sucursales.', 'Cerrar', {
            duration: 4000,
          });
        },
      });
  }

  nueva(): void {
    this.abrirDialogo(null);
  }

  editar(s: Sucursal): void {
    this.abrirDialogo(s);
  }

  private abrirDialogo(sucursal: Sucursal | null): void {
    const ref = this.dialog.open<
      SucursalFormDialog,
      SucursalFormData,
      Sucursal | undefined
    >(SucursalFormDialog, {
      data: { sucursal },
      autoFocus: 'first-tabbable',
    });
    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.snack.open(
          sucursal ? 'Sucursal actualizada.' : 'Sucursal creada.',
          'OK',
          { duration: 2500 },
        );
        this.cargar();
      }
    });
  }

  horarios(s: Sucursal): void {
    const ref = this.dialog.open<HorariosDialog, HorariosDialogData, boolean>(
      HorariosDialog,
      { data: { sucursalId: s.id, sucursalNombre: s.nombre } },
    );
    ref.afterClosed().subscribe((ok) => {
      if (ok) {
        this.snack.open('Horarios guardados.', 'OK', { duration: 2500 });
      }
    });
  }
}
