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
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';

import { Coleccion, Temporada } from '../../core/models/temporada.model';
import { TemporadasService } from './temporadas.service';
import { TemporadaDialog } from './temporada-dialog';
import { ColeccionDialog } from './coleccion-dialog';

@Component({
  selector: 'app-temporadas-page',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatTabsModule,
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
  templateUrl: './temporadas-page.html',
  styleUrl: './temporadas-page.scss',
})
export class TemporadasPage implements OnInit {
  private readonly service = inject(TemporadasService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly SIZE = 20;

  // Temporadas
  protected readonly colTemp = ['nombre', 'inicio', 'fin', 'estado', 'acciones'];
  protected readonly temporadas = signal<Temporada[]>([]);
  protected readonly totalTemp = signal(0);
  protected readonly pageTemp = signal(0);
  protected readonly cargandoTemp = signal(false);
  protected readonly qTemp = new FormControl('', { nonNullable: true });

  // Colecciones
  protected readonly colCol = ['nombre', 'temporada', 'descripcion', 'estado', 'acciones'];
  protected readonly colecciones = signal<Coleccion[]>([]);
  protected readonly totalCol = signal(0);
  protected readonly pageCol = signal(0);
  protected readonly cargandoCol = signal(false);
  protected readonly qCol = new FormControl('', { nonNullable: true });
  protected readonly filtroTemp = signal<number | null>(null);
  protected readonly opcionesTemp = signal<Temporada[]>([]);

  ngOnInit(): void {
    this.enganchar(this.qTemp, () => {
      this.pageTemp.set(0);
      this.cargarTemp();
    });
    this.enganchar(this.qCol, () => {
      this.pageCol.set(0);
      this.cargarCol();
    });
    this.service.opcionesTemporadas().subscribe((t) => this.opcionesTemp.set(t));
    this.cargarTemp();
    this.cargarCol();
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

  // --- Temporadas ---
  cargarTemp(): void {
    this.cargandoTemp.set(true);
    this.service
      .listarTemporadas(this.qTemp.value.trim(), this.pageTemp() + 1, this.SIZE)
      .subscribe({
        next: (r) => {
          this.temporadas.set(r.items);
          this.totalTemp.set(r.total);
          this.cargandoTemp.set(false);
        },
        error: () => {
          this.cargandoTemp.set(false);
          this.err();
        },
      });
  }
  onPageTemp(e: PageEvent): void {
    this.pageTemp.set(e.pageIndex);
    this.cargarTemp();
  }
  nuevaTemp(): void {
    this.abrir(TemporadaDialog, null, () => {
      this.cargarTemp();
      this.service.opcionesTemporadas().subscribe((t) => this.opcionesTemp.set(t));
    });
  }
  editarTemp(t: Temporada): void {
    this.abrir(TemporadaDialog, t, () => {
      this.cargarTemp();
      this.cargarCol();
    });
  }

  // --- Colecciones ---
  cargarCol(): void {
    this.cargandoCol.set(true);
    this.service
      .listarColecciones(
        this.qCol.value.trim(),
        this.filtroTemp(),
        this.pageCol() + 1,
        this.SIZE,
      )
      .subscribe({
        next: (r) => {
          this.colecciones.set(r.items);
          this.totalCol.set(r.total);
          this.cargandoCol.set(false);
        },
        error: () => {
          this.cargandoCol.set(false);
          this.err();
        },
      });
  }
  cambiarFiltroTemp(v: number | null): void {
    this.filtroTemp.set(v);
    this.pageCol.set(0);
    this.cargarCol();
  }
  onPageCol(e: PageEvent): void {
    this.pageCol.set(e.pageIndex);
    this.cargarCol();
  }
  nuevaCol(): void {
    this.abrir(ColeccionDialog, null, () => this.cargarCol());
  }
  editarCol(c: Coleccion): void {
    this.abrir(ColeccionDialog, c, () => this.cargarCol());
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
