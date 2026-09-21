import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { TiendaService } from '../tienda/tienda.service';
import { ProductoCard } from '../tienda/producto-card';
import { CatalogoProducto } from '../../core/models/catalogo-cliente.model';
import { AuthService } from '../../core/auth/auth.service';
import { ROL } from '../../core/models/usuario.model';
import { IaService } from '../ia/ia.service';
import { RecomendacionCard } from '../ia/recomendacion-card';
import { ProductoRecomendado } from '../../core/models/ia.model';

@Component({
  selector: 'app-home',
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    ProductoCard,
    RecomendacionCard,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly tienda = inject(TiendaService);
  private readonly ia = inject(IaService);
  private readonly auth = inject(AuthService);

  protected readonly destacados = signal<CatalogoProducto[]>([]);
  protected readonly cargando = signal(true);

  // CU29 — solo tiene sentido recomendar si hay una cuenta de Cliente detrás.
  protected readonly esCliente =
    this.auth.isAuthenticated() && this.auth.hasRole(ROL.CLIENTE);
  protected readonly recomendaciones = signal<ProductoRecomendado[]>([]);
  protected readonly cargandoRecomendaciones = signal(this.esCliente);

  constructor() {
    this.tienda.destacados(8).subscribe({
      next: (items) => {
        this.destacados.set(items);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });

    if (this.esCliente) {
      this.ia.recomendaciones().subscribe({
        next: (res) => {
          this.recomendaciones.set(res.items);
          this.cargandoRecomendaciones.set(false);
        },
        error: () => this.cargandoRecomendaciones.set(false),
      });
    }
  }
}
