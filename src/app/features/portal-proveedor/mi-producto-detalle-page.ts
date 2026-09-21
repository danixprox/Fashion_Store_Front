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
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ProductoDetalle, Variante } from '../../core/models/producto.model';
import { Categoria } from '../../core/models/catalogo.model';
import { Coleccion } from '../../core/models/temporada.model';
import { PortalProveedorService } from './portal-proveedor.service';
import { CatalogoService } from '../catalogo/catalogo.service';
import { TemporadasService } from '../temporadas/temporadas.service';
import { VarianteDialog, VarianteDialogData } from '../productos/variante-dialog';

@Component({
  selector: 'app-mi-producto-detalle-page',
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
    MatToolbarModule,
    MatTableModule,
    MatTooltipModule,
    MatProgressBarModule,
  ],
  templateUrl: './mi-producto-detalle-page.html',
  styleUrl: '../productos/producto-detalle-page.scss',
})
export class MiProductoDetallePage {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(PortalProveedorService);
  private readonly catalogo = inject(CatalogoService);
  private readonly temporadas = inject(TemporadasService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  protected readonly colVar = ['talla', 'color', 'sku', 'precio', 'acciones'];

  protected readonly productoId = signal<number | null>(null);
  protected readonly esNuevo = computed(() => this.productoId() === null);
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly detalle = signal<ProductoDetalle | null>(null);
  protected readonly variantes = signal<Variante[]>([]);

  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly colecciones = signal<Coleccion[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    descripcion: [''],
    categoria_id: [null as number | null, [Validators.required]],
    coleccion_id: [null as number | null],
    precio_compra: ['', [Validators.required, Validators.min(0.01)]],
    imagen_url: [''],
  });

  constructor() {
    this.catalogo.opcionesCategorias().subscribe((c) => this.categorias.set(c));
    this.temporadas.opcionesColecciones().subscribe((c) => this.colecciones.set(c));

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
          precio_compra: d.precio_compra ?? '',
          imagen_url: d.imagen_url ?? '',
        });
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.snack.open('No se pudo cargar el producto.', 'Cerrar', {
          duration: 4000,
        });
        void this.router.navigate(['/proveedor/productos']);
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
      proveedor_id: 0, // ignorado por el backend
      precio_compra: String(v.precio_compra),
      imagen_url: v.imagen_url || null,
    };
    try {
      if (this.esNuevo()) {
        const creado = await firstValueFrom(this.service.crear(base));
        this.snack.open('Producto registrado. Agregá sus variantes.', 'OK', {
          duration: 3000,
        });
        await this.router.navigate(['/proveedor/productos', creado.id]);
        this.productoId.set(creado.id);
        this.cargar(creado.id);
      } else {
        await firstValueFrom(this.service.actualizar(this.productoId()!, base));
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
        data: { productoId: this.productoId()!, variante, portal: true },
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

  eliminarProducto(): void {
    const d = this.detalle();
    if (!d) return;
    if (!confirm(`¿Eliminar "${d.nombre}"? Esta acción no se puede deshacer.`)) return;
    this.service.eliminar(d.id).subscribe({
      next: () => {
        this.snack.open('Producto eliminado.', 'OK', { duration: 2500 });
        void this.router.navigate(['/proveedor/productos']);
      },
      error: (e) =>
        this.snack.open(
          e?.error?.detail ?? 'No se pudo eliminar el producto.',
          'Cerrar',
          { duration: 4000 },
        ),
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
}
