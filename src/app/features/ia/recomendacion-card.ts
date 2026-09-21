import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';

import { ProductoRecomendado } from '../../core/models/ia.model';

/** CU29 — tarjeta de producto recomendado, con el "motivo" que dio la IA. */
@Component({
  selector: 'app-recomendacion-card',
  imports: [RouterLink, DecimalPipe],
  template: `
    <a class="card" [routerLink]="['/catalogo', producto().id]">
      <div class="img-wrap">
        @if (producto().imagen_url) {
          <img [src]="producto().imagen_url" [alt]="producto().nombre" loading="lazy" />
        } @else {
          <div class="ph">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.4">
              <path d="M8 4h8l1 3h2a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h2l1-3Z" />
              <circle cx="12" cy="13" r="3.2" />
            </svg>
          </div>
        }
      </div>
      <div class="info">
        @if (producto().categoria) {
          <span class="cat">{{ producto().categoria }}</span>
        }
        <span class="nombre">{{ producto().nombre }}</span>
        @let promo = producto().precio_promocional;
        @if (promo) {
          <span class="precio">
            <span class="precio-tachado">Bs {{ +producto().precio_base | number: '1.2-2' }}</span>
            <span class="precio-oferta">Bs {{ +promo | number: '1.2-2' }}</span>
          </span>
        } @else {
          <span class="precio">Bs {{ +producto().precio_base | number: '1.2-2' }}</span>
        }
        <p class="motivo">
          <span class="chip-ia">IA</span>
          {{ producto().motivo }}
        </p>
      </div>
    </a>
  `,
  styles: `
    .card { display: block; text-decoration: none; color: inherit; }
    .img-wrap {
      position: relative;
      aspect-ratio: 3 / 4;
      background: var(--fs-green-50);
      border-radius: 10px;
      overflow: hidden;
    }
    .img-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .35s ease; }
    .card:hover .img-wrap img { transform: scale(1.035); }
    .ph { width: 100%; height: 100%; display: grid; place-items: center; color: var(--fs-green-500); }
    .info { display: flex; flex-direction: column; gap: .1rem; padding: .65rem .1rem 0; }
    .cat { font-size: .7rem; text-transform: uppercase; letter-spacing: .04em; color: #94a3b8; }
    .nombre { font-size: .92rem; color: #1e293b; font-weight: 500; line-height: 1.3; }
    .precio { font-size: .92rem; color: var(--fs-green-700); font-weight: 600; margin-top: .1rem; }
    .motivo {
      margin: .4rem 0 0;
      font-size: .78rem;
      color: #64748b;
      line-height: 1.3;
      display: flex;
      gap: .35rem;
      align-items: flex-start;
    }
    .chip-ia {
      flex-shrink: 0;
      background: var(--fs-green-700);
      color: #fff;
      font-size: .62rem;
      font-weight: 700;
      padding: .05rem .35rem;
      border-radius: 999px;
      line-height: 1.4;
    }
  `,
})
export class RecomendacionCard {
  readonly producto = input.required<ProductoRecomendado>();
}
