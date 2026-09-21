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

import { Proveedor } from '../../core/models/proveedor.model';
import { ProveedoresService } from './proveedores.service';
import {
  ProveedorFormData,
  ProveedorFormDialog,
} from './proveedor-form-dialog';

@Component({
  selector: 'app-proveedores-page',
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
  templateUrl: './proveedores-page.html',
  styleUrl: './proveedores-page.scss',
})
export class ProveedoresPage implements OnInit {
  private readonly service = inject(ProveedoresService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  private readonly buscador =
    viewChild<ElementRef<HTMLInputElement>>('buscador');

  protected readonly columnas = [
    'empresa',
    'contacto',
    'email',
    'telefono',
    'estado',
    'acciones',
  ];

  protected readonly cargando = signal(false);
  protected readonly proveedores = signal<Proveedor[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(0);
  protected readonly size = signal(10);

  protected readonly qCtrl = new FormControl('', { nonNullable: true });
  protected readonly estado = signal<'todos' | 'activos' | 'inactivos'>('todos');

  protected readonly sinResultados = computed(
    () => !this.cargando() && this.proveedores().length === 0,
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

  cambiarEstado(valor: 'todos' | 'activos' | 'inactivos'): void {
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
    const activo =
      this.estado() === 'todos' ? null : this.estado() === 'activos';
    this.service
      .listar({
        q: this.qCtrl.value.trim() || undefined,
        activo,
        page: this.page() + 1,
        size: this.size(),
      })
      .subscribe({
        next: (res) => {
          this.proveedores.set(res.items);
          this.total.set(res.total);
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.snack.open('No se pudieron cargar los proveedores.', 'Cerrar', {
            duration: 4000,
          });
        },
      });
  }

  nuevo(): void {
    this.abrirDialogo(null);
  }

  editar(p: Proveedor): void {
    this.abrirDialogo(p);
  }

  private abrirDialogo(proveedor: Proveedor | null): void {
    const ref = this.dialog.open<
      ProveedorFormDialog,
      ProveedorFormData,
      Proveedor | undefined
    >(ProveedorFormDialog, {
      data: { proveedor },
      autoFocus: 'first-tabbable',
    });
    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.snack.open(
          proveedor ? 'Proveedor actualizado.' : 'Proveedor creado.',
          'OK',
          { duration: 2500 },
        );
        this.cargar();
      }
    });
  }
}
