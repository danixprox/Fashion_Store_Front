import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { TiendaService } from './tienda.service';
import { ProductoCard } from './producto-card';
import { Categoria, Color, Talla } from '../../core/models/catalogo.model';
import {
  CatalogoProducto,
  OrdenCatalogo,
} from '../../core/models/catalogo-cliente.model';

@Component({
  selector: 'app-catalogo-page',
  imports: [
    ReactiveFormsModule,
    ProductoCard,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './catalogo-page.html',
  styleUrl: './catalogo-page.scss',
})
export class CatalogoPage implements OnInit {
  private readonly tienda = inject(TiendaService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly SIZE = 12;

  protected readonly qCtrl = new FormControl('', { nonNullable: true });
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly categoriaId = signal<number | null>(null);
  protected readonly orden = signal<OrdenCatalogo>('novedad');

  // CU10 — filtros avanzados
  protected readonly panelAbierto = signal(false);
  protected readonly tallas = signal<Talla[]>([]);
  protected readonly colores = signal<Color[]>([]);
  protected readonly tallaId = signal<number | null>(null);
  protected readonly colorId = signal<number | null>(null);
  protected readonly precioMinCtrl = new FormControl<number | null>(null);
  protected readonly precioMaxCtrl = new FormControl<number | null>(null);

  protected readonly filtrosActivos = computed(() => {
    let n = 0;
    if (this.tallaId() != null) n++;
    if (this.colorId() != null) n++;
    if (this.precioMinCtrl.value != null) n++;
    if (this.precioMaxCtrl.value != null) n++;
    return n;
  });

  protected readonly cargando = signal(true);
  protected readonly productos = signal<CatalogoProducto[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(0);

  protected readonly sinResultados = computed(
    () => !this.cargando() && this.productos().length === 0,
  );

  ngOnInit(): void {
    this.tienda.categorias().subscribe((c) => this.categorias.set(c));
    this.tienda.tallas().subscribe((t) => this.tallas.set(t));
    this.tienda.colores().subscribe((c) => this.colores.set(c));

    this.qCtrl.valueChanges
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.page.set(0);
        this.cargar();
      });

    for (const ctrl of [this.precioMinCtrl, this.precioMaxCtrl]) {
      ctrl.valueChanges
        .pipe(
          debounceTime(450),
          distinctUntilChanged(),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(() => {
          this.page.set(0);
          this.cargar();
        });
    }

    this.cargar();
  }

  elegirCategoria(id: number | null): void {
    this.categoriaId.set(id === this.categoriaId() ? null : id);
    this.page.set(0);
    this.cargar();
  }

  elegirTalla(id: number): void {
    this.tallaId.set(this.tallaId() === id ? null : id);
    this.page.set(0);
    this.cargar();
  }

  elegirColor(id: number): void {
    this.colorId.set(this.colorId() === id ? null : id);
    this.page.set(0);
    this.cargar();
  }

  cambiarOrden(v: OrdenCatalogo): void {
    this.orden.set(v);
    this.page.set(0);
    this.cargar();
  }

  onPage(e: PageEvent): void {
    this.page.set(e.pageIndex);
    this.cargar();
  }

  alternarPanel(): void {
    this.panelAbierto.set(!this.panelAbierto());
  }

  limpiarFiltros(): void {
    this.qCtrl.setValue('');
    this.categoriaId.set(null);
    this.tallaId.set(null);
    this.colorId.set(null);
    this.precioMinCtrl.setValue(null);
    this.precioMaxCtrl.setValue(null);
    this.orden.set('novedad');
    this.page.set(0);
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    this.tienda
      .listar({
        q: this.qCtrl.value.trim() || undefined,
        categoria_id: this.categoriaId(),
        talla_id: this.tallaId(),
        color_id: this.colorId(),
        precio_min: this.precioMinCtrl.value,
        precio_max: this.precioMaxCtrl.value,
        orden: this.orden(),
        page: this.page() + 1,
        size: this.SIZE,
      })
      .subscribe({
        next: (r) => {
          this.productos.set(r.items);
          this.total.set(r.total);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
  }
}
