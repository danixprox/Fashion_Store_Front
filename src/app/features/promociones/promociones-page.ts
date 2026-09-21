import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Promocion } from '../../core/models/promocion.model';
import { PromocionesService } from './promociones.service';
import { PromocionDialog } from './promocion-dialog';

/** CU33 — Gestionar Promociones (Administrador). */
@Component({
  selector: 'app-promociones-page',
  imports: [
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './promociones-page.html',
  styleUrl: './promociones-page.scss',
})
export class PromocionesPage implements OnInit {
  private readonly service = inject(PromocionesService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  protected readonly columnas = ['nombre', 'descuento', 'vigencia', 'productos', 'estado', 'acciones'];
  protected readonly promociones = signal<Promocion[]>([]);
  protected readonly cargando = signal(false);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.service.listar().subscribe({
      next: (lista) => {
        this.promociones.set(lista);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.snack.open('No se pudo cargar la información.', 'Cerrar', { duration: 4000 });
      },
    });
  }

  nueva(): void {
    this.abrir(null);
  }

  editar(p: Promocion): void {
    this.abrir(p);
  }

  private abrir(data: Promocion | null): void {
    const ref = this.dialog.open(PromocionDialog, { data, autoFocus: 'first-tabbable' });
    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.snack.open('Guardado.', 'OK', { duration: 2000 });
        this.cargar();
      }
    });
  }

  estado(p: Promocion): { texto: string; clase: string } {
    if (!p.activo) return { texto: 'Inactiva', clase: 'off' };
    if (p.vigente) return { texto: 'Vigente', clase: '' };
    const hoy = new Date().toISOString().slice(0, 10);
    return p.fecha_inicio > hoy
      ? { texto: 'Programada', clase: 'prog' }
      : { texto: 'Vencida', clase: 'off' };
  }

  resumenObjetivos(p: Promocion): string {
    const partes: string[] = [];
    if (p.productos.length > 0) {
      partes.push(`${p.productos.length} ${p.productos.length === 1 ? 'producto' : 'productos'}`);
    }
    if (p.variantes.length > 0) {
      partes.push(`${p.variantes.length} ${p.variantes.length === 1 ? 'variante' : 'variantes'}`);
    }
    return partes.join(' · ');
  }

  detalleObjetivos(p: Promocion): string {
    return [
      ...p.productos.map((x) => `${x.nombre} (todas las variantes)`),
      ...p.variantes.map((v) => `${v.producto} — ${v.talla} · ${v.color}`),
    ].join('\n');
  }
}
