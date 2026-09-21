import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
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
import { MatSnackBar } from '@angular/material/snack-bar';

import { Producto } from '../../core/models/producto.model';
import { Categoria } from '../../core/models/catalogo.model';
import { ProductosService } from './productos.service';
import { CatalogoService } from '../catalogo/catalogo.service';
import { ProveedoresService } from '../proveedores/proveedores.service';
import { ProveedorOpcion } from '../../core/models/proveedor.model';

@Component({
  selector: 'app-productos-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
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
  templateUrl: './productos-page.html',
  styleUrl: './productos-page.scss',
})
export class ProductosPage implements OnInit {
  private readonly service = inject(ProductosService);
  private readonly catalogo = inject(CatalogoService);
  private readonly proveedores = inject(ProveedoresService);
  private readonly snack = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly columnas = [
    'imagen',
    'nombre',
    'categoria',
    'proveedor',
    'precio',
    'variantes',
    'estado',
    'acciones',
  ];

  protected readonly cargando = signal(false);
  protected readonly productos = signal<Producto[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(0);
  protected readonly size = signal(10);

  protected readonly qCtrl = new FormControl('', { nonNullable: true });
  protected readonly categoriaId = signal<number | null>(null);
  protected readonly proveedorId = signal<number | null>(null);
  protected readonly estado = signal<'todos' | 'activos' | 'inactivos'>('todos');

  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly opcProveedores = signal<ProveedorOpcion[]>([]);

  protected readonly sinResultados = computed(
    () => !this.cargando() && this.productos().length === 0,
  );

  ngOnInit(): void {
    this.catalogo.opcionesCategorias().subscribe((c) => this.categorias.set(c));
    this.proveedores.opciones().subscribe((p) => this.opcProveedores.set(p));

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

  cambiarCategoria(v: number | null): void {
    this.categoriaId.set(v);
    this.page.set(0);
    this.cargar();
  }
  cambiarProveedor(v: number | null): void {
    this.proveedorId.set(v);
    this.page.set(0);
    this.cargar();
  }
  cambiarEstado(v: 'todos' | 'activos' | 'inactivos'): void {
    this.estado.set(v);
    this.page.set(0);
    this.cargar();
  }
  onPage(e: PageEvent): void {
    this.page.set(e.pageIndex);
    this.size.set(e.pageSize);
    this.cargar();
  }

  eliminar(p: Producto): void {
    if (
      !confirm(
        `¿Eliminar "${p.nombre}"? Se borrarán también sus variantes y el stock cargado. Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }
    this.service.eliminar(p.id).subscribe({
      next: () => {
        this.snack.open('Producto eliminado.', 'OK', { duration: 2500 });
        this.cargar();
      },
      error: (e: unknown) =>
        this.snack.open(
          (e as { error?: { detail?: string } }).error?.detail ??
            'No se pudo eliminar el producto.',
          'Cerrar',
          { duration: 4000 },
        ),
    });
  }

  private cargar(): void {
    this.cargando.set(true);
    const activo =
      this.estado() === 'todos' ? null : this.estado() === 'activos';
    this.service
      .listar({
        q: this.qCtrl.value.trim() || undefined,
        categoria_id: this.categoriaId(),
        proveedor_id: this.proveedorId(),
        activo,
        page: this.page() + 1,
        size: this.size(),
      })
      .subscribe({
        next: (r) => {
          this.productos.set(r.items);
          this.total.set(r.total);
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.snack.open('No se pudieron cargar los productos.', 'Cerrar', {
            duration: 4000,
          });
        },
      });
  }
}
