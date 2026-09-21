import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Categoria, Color, Talla } from '../../core/models/catalogo.model';
import { CatalogoService } from './catalogo.service';
import { CategoriaDialog } from './categoria-dialog';
import { TallaDialog } from './talla-dialog';
import { ColorDialog } from './color-dialog';

@Component({
  selector: 'app-catalogo-base-page',
  imports: [
    ReactiveFormsModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './catalogo-base-page.html',
  styleUrl: './catalogo-base-page.scss',
})
export class CatalogoBasePage implements OnInit {
  private readonly service = inject(CatalogoService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  // Categorías
  protected readonly colCat = ['nombre', 'descripcion', 'estado', 'acciones'];
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly totalCat = signal(0);
  protected readonly pageCat = signal(0);
  protected readonly cargandoCat = signal(false);
  protected readonly qCat = new FormControl('', { nonNullable: true });

  // Tallas
  protected readonly colTalla = ['valor', 'tipo', 'estado', 'acciones'];
  protected readonly tallas = signal<Talla[]>([]);
  protected readonly totalTalla = signal(0);
  protected readonly pageTalla = signal(0);
  protected readonly cargandoTalla = signal(false);
  protected readonly qTalla = new FormControl('', { nonNullable: true });

  // Colores
  protected readonly colColor = ['color', 'nombre', 'hex', 'estado', 'acciones'];
  protected readonly colores = signal<Color[]>([]);
  protected readonly totalColor = signal(0);
  protected readonly pageColor = signal(0);
  protected readonly cargandoColor = signal(false);
  protected readonly qColor = new FormControl('', { nonNullable: true });

  private readonly SIZE = 20;

  ngOnInit(): void {
    this.enganchar(this.qCat, () => {
      this.pageCat.set(0);
      this.cargarCat();
    });
    this.enganchar(this.qTalla, () => {
      this.pageTalla.set(0);
      this.cargarTalla();
    });
    this.enganchar(this.qColor, () => {
      this.pageColor.set(0);
      this.cargarColor();
    });
    this.cargarCat();
    this.cargarTalla();
    this.cargarColor();
  }

  private enganchar(ctrl: FormControl<string>, fn: () => void): void {
    ctrl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(fn);
  }

  // --- Categorías ---
  cargarCat(): void {
    this.cargandoCat.set(true);
    this.service
      .listarCategorias(this.qCat.value.trim(), this.pageCat() + 1, this.SIZE)
      .subscribe({
        next: (r) => {
          this.categorias.set(r.items);
          this.totalCat.set(r.total);
          this.cargandoCat.set(false);
        },
        error: () => {
          this.cargandoCat.set(false);
          this.err();
        },
      });
  }
  onPageCat(e: PageEvent): void {
    this.pageCat.set(e.pageIndex);
    this.cargarCat();
  }
  nuevaCat(): void {
    this.abrir(CategoriaDialog, null, () => this.cargarCat());
  }
  editarCat(c: Categoria): void {
    this.abrir(CategoriaDialog, c, () => this.cargarCat());
  }

  // --- Tallas ---
  cargarTalla(): void {
    this.cargandoTalla.set(true);
    this.service
      .listarTallas(this.qTalla.value.trim(), this.pageTalla() + 1, this.SIZE)
      .subscribe({
        next: (r) => {
          this.tallas.set(r.items);
          this.totalTalla.set(r.total);
          this.cargandoTalla.set(false);
        },
        error: () => {
          this.cargandoTalla.set(false);
          this.err();
        },
      });
  }
  onPageTalla(e: PageEvent): void {
    this.pageTalla.set(e.pageIndex);
    this.cargarTalla();
  }
  nuevaTalla(): void {
    this.abrir(TallaDialog, null, () => this.cargarTalla());
  }
  editarTalla(t: Talla): void {
    this.abrir(TallaDialog, t, () => this.cargarTalla());
  }

  // --- Colores ---
  cargarColor(): void {
    this.cargandoColor.set(true);
    this.service
      .listarColores(this.qColor.value.trim(), this.pageColor() + 1, this.SIZE)
      .subscribe({
        next: (r) => {
          this.colores.set(r.items);
          this.totalColor.set(r.total);
          this.cargandoColor.set(false);
        },
        error: () => {
          this.cargandoColor.set(false);
          this.err();
        },
      });
  }
  onPageColor(e: PageEvent): void {
    this.pageColor.set(e.pageIndex);
    this.cargarColor();
  }
  nuevoColor(): void {
    this.abrir(ColorDialog, null, () => this.cargarColor());
  }
  editarColor(c: Color): void {
    this.abrir(ColorDialog, c, () => this.cargarColor());
  }

  private abrir(cmp: unknown, data: unknown, recargar: () => void): void {
    const ref = this.dialog.open(cmp as never, { data, autoFocus: 'first-tabbable' });
    ref.afterClosed().subscribe((res: unknown) => {
      if (res) {
        this.snack.open('Guardado.', 'OK', { duration: 2000 });
        recargar();
      }
    });
  }

  private err(): void {
    this.snack.open('No se pudo cargar la información.', 'Cerrar', {
      duration: 4000,
    });
  }
}
