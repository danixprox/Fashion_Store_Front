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
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Producto } from '../../core/models/producto.model';
import { PortalProveedorService } from './portal-proveedor.service';

@Component({
  selector: 'app-mis-productos-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DecimalPipe,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './mis-productos-page.html',
  styleUrl: './mis-productos-page.scss',
})
export class MisProductosPage implements OnInit {
  private readonly service = inject(PortalProveedorService);
  private readonly snack = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly columnas = [
    'nombre',
    'categoria',
    'precio',
    'variantes',
    'estado',
    'acciones',
  ];

  eliminar(p: Producto): void {
    if (!confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) return;
    this.service.eliminar(p.id).subscribe({
      next: () => {
        this.snack.open('Producto eliminado.', 'OK', { duration: 2500 });
        this.cargar();
      },
      error: (e) =>
        this.snack.open(
          e?.error?.detail ?? 'No se pudo eliminar el producto.',
          'Cerrar',
          { duration: 4000 },
        ),
    });
  }
  protected readonly cargando = signal(false);
  protected readonly productos = signal<Producto[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(0);
  protected readonly size = signal(10);
  protected readonly qCtrl = new FormControl('', { nonNullable: true });

  protected readonly sinResultados = computed(
    () => !this.cargando() && this.productos().length === 0,
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

  onPage(e: PageEvent): void {
    this.page.set(e.pageIndex);
    this.size.set(e.pageSize);
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    this.service
      .listar(this.qCtrl.value.trim(), this.page() + 1, this.size())
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
