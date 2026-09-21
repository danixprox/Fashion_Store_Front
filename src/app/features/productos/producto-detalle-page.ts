import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ProductoDetalle, Variante } from '../../core/models/producto.model';
import { Categoria } from '../../core/models/catalogo.model';
import { Coleccion } from '../../core/models/temporada.model';
import { ProveedorOpcion } from '../../core/models/proveedor.model';
import { ProductosService } from './productos.service';
import { CatalogoService } from '../catalogo/catalogo.service';
import { TemporadasService } from '../temporadas/temporadas.service';
import { ProveedoresService } from '../proveedores/proveedores.service';
import { VarianteDialog, VarianteDialogData } from './variante-dialog';

@Component({
  selector: 'app-producto-detalle-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DecimalPipe,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatToolbarModule,
    MatTableModule,
    MatTooltipModule,
    MatProgressBarModule,
  ],
  templateUrl: './producto-detalle-page.html',
  styleUrl: './producto-detalle-page.scss',
})
export class ProductoDetallePage {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ProductosService);
  private readonly catalogo = inject(CatalogoService);
  private readonly temporadas = inject(TemporadasService);
  private readonly proveedoresSvc = inject(ProveedoresService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  protected readonly colVar = [
    'imagen',
    'talla',
    'color',
    'sku',
    'costo',
    'precio',
    'acciones',
  ];

  protected readonly productoId = signal<number | null>(null);
  protected readonly esNuevo = computed(() => this.productoId() === null);
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly detalle = signal<ProductoDetalle | null>(null);
  protected readonly variantes = signal<Variante[]>([]);

  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly colecciones = signal<Coleccion[]>([]);
  protected readonly proveedores = signal<ProveedorOpcion[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    descripcion: [''],
    categoria_id: [null as number | null, [Validators.required]],
    coleccion_id: [null as number | null],
    proveedor_id: [null as number | null, [Validators.required]],
    precio_compra: [''],
    precio_base: [''],
    imagen_url: [''],
    activo: [true],
  });

  protected readonly margen = computed(() => {
    const d = this.detalle();
    if (!d || d.precio_base == null || d.precio_compra == null) return null;
    return +d.precio_base - +d.precio_compra;
  });

  constructor() {
    this.catalogo.opcionesCategorias().subscribe((c) => this.categorias.set(c));
    this.temporadas.opcionesColecciones().subscribe((c) => this.colecciones.set(c));
    this.proveedoresSvc.opciones().subscribe((p) => this.proveedores.set(p));

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'nuevo') {
      this.productoId.set(Number(idParam));
      this.cargar(Number(idParam));
    }
  }

  private cargar(id: number): void {
    this.cargando.set(true);
    this.service.obtener(id).subscribe({
      next: (d) => {
        this.detalle.set(d);
        this.variantes.set(d.variantes);
        this.form.patchValue({
          nombre: d.nombre,
          descripcion: d.descripcion ?? '',
          categoria_id: d.categoria_id,
          coleccion_id: d.coleccion_id,
          proveedor_id: d.proveedor_id,
          precio_compra: d.precio_compra ?? '',
          precio_base: d.precio_base ?? '',
          imagen_url: d.imagen_url ?? '',
          activo: d.activo,
        });
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.snack.open('No se pudo cargar el producto.', 'Cerrar', {
          duration: 4000,
        });
        void this.router.navigate(['/admin/productos']);
      },
    });
  }

  async guardar(): Promise<void> {
    if (this.form.invalid || this.guardando()) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    const base = {
      nombre: v.nombre,
      descripcion: v.descripcion || null,
      categoria_id: v.categoria_id!,
      coleccion_id: v.coleccion_id,
      proveedor_id: v.proveedor_id!,
      precio_compra: v.precio_compra ? String(v.precio_compra) : null,
      precio_base: v.precio_base ? String(v.precio_base) : null,
      imagen_url: v.imagen_url || null,
    };
    try {
      if (this.esNuevo()) {
        const creado = await firstValueFrom(this.service.crear(base));
        this.snack.open('Producto creado. Agregá sus variantes.', 'OK', {
          duration: 3000,
        });
        await this.router.navigate(['/admin/productos', creado.id]);
        this.productoId.set(creado.id);
        this.cargar(creado.id);
      } else {
        await firstValueFrom(
          this.service.actualizar(this.productoId()!, { ...base, activo: v.activo }),
        );
        this.snack.open('Cambios guardados.', 'OK', { duration: 2500 });
        this.cargar(this.productoId()!);
      }
    } catch (e: unknown) {
      this.error.set(
        (e as { error?: { detail?: string } }).error?.detail ??
          'No se pudo guardar el producto.',
      );
    } finally {
      this.guardando.set(false);
    }
  }

  nuevaVariante(): void {
    this.abrirVariante(null);
  }
  editarVariante(v: Variante): void {
    this.abrirVariante(v);
  }

  private abrirVariante(variante: Variante | null): void {
    const ref = this.dialog.open<VarianteDialog, VarianteDialogData, Variante>(
      VarianteDialog,
      {
        data: { productoId: this.productoId()!, variante },
        autoFocus: 'first-tabbable',
      },
    );
    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.snack.open('Variante guardada.', 'OK', { duration: 2000 });
        this.cargar(this.productoId()!);
      }
    });
  }

  eliminarVariante(v: Variante): void {
    if (!confirm(`¿Eliminar la variante ${v.sku}?`)) return;
    this.service.eliminarVariante(v.id).subscribe({
      next: () => {
        this.snack.open('Variante eliminada.', 'OK', { duration: 2000 });
        this.cargar(this.productoId()!);
      },
      error: () =>
        this.snack.open('No se pudo eliminar.', 'Cerrar', { duration: 4000 }),
    });
  }

  eliminarProducto(): void {
    const nombre = this.detalle()?.nombre ?? 'este producto';
    if (
      !confirm(
        `¿Eliminar "${nombre}"? Se borrarán también sus variantes y el stock cargado. Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }
    this.service.eliminar(this.productoId()!).subscribe({
      next: () => {
        this.snack.open('Producto eliminado.', 'OK', { duration: 2500 });
        void this.router.navigate(['/admin/productos']);
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
}
