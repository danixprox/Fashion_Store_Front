import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Page } from '../../core/models/usuario.model';
import { Categoria, Color, Talla } from '../../core/models/catalogo.model';

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  // --- Opciones (para selects) ---
  opcionesCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.base}/categorias/opciones`);
  }
  opcionesTallas(): Observable<Talla[]> {
    return this.http.get<Talla[]>(`${this.base}/tallas/opciones`);
  }
  opcionesColores(): Observable<Color[]> {
    return this.http.get<Color[]>(`${this.base}/colores/opciones`);
  }

  // --- Categorías ---
  listarCategorias(q: string, page: number, size: number): Observable<Page<Categoria>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (q) params = params.set('q', q);
    return this.http.get<Page<Categoria>>(`${this.base}/categorias`, { params });
  }
  crearCategoria(dto: { nombre: string; descripcion?: string | null }) {
    return this.http.post<Categoria>(`${this.base}/categorias`, dto);
  }
  actualizarCategoria(
    id: number,
    dto: { nombre?: string; descripcion?: string | null; activo?: boolean },
  ) {
    return this.http.patch<Categoria>(`${this.base}/categorias/${id}`, dto);
  }

  // --- Tallas ---
  listarTallas(q: string, page: number, size: number): Observable<Page<Talla>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (q) params = params.set('q', q);
    return this.http.get<Page<Talla>>(`${this.base}/tallas`, { params });
  }
  crearTalla(dto: { valor: string; tipo: string }) {
    return this.http.post<Talla>(`${this.base}/tallas`, dto);
  }
  actualizarTalla(
    id: number,
    dto: { valor?: string; tipo?: string; activo?: boolean },
  ) {
    return this.http.patch<Talla>(`${this.base}/tallas/${id}`, dto);
  }

  // --- Colores ---
  listarColores(q: string, page: number, size: number): Observable<Page<Color>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (q) params = params.set('q', q);
    return this.http.get<Page<Color>>(`${this.base}/colores`, { params });
  }
  crearColor(dto: { nombre: string; codigo_hex?: string | null }) {
    return this.http.post<Color>(`${this.base}/colores`, dto);
  }
  actualizarColor(
    id: number,
    dto: { nombre?: string; codigo_hex?: string | null; activo?: boolean },
  ) {
    return this.http.patch<Color>(`${this.base}/colores/${id}`, dto);
  }
}
