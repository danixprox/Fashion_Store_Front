import { Injectable, computed, signal } from '@angular/core';

/** Una prenda (variante) que el cliente quiere probarse, con la sucursal elegida. */
export interface ItemBolsa {
  varianteId: number;
  productoNombre: string;
  talla: string | null;
  color: string | null;
  imagenUrl: string | null;
  sucursalId: number;
  sucursal: string;
  ciudad: string;
  cantidad: number;
  maxDisponible: number;
}

/** Las prendas de una misma sucursal: cada grupo se reserva por separado. */
export interface GrupoBolsa {
  sucursalId: number;
  sucursal: string;
  ciudad: string;
  items: ItemBolsa[];
}

const CLAVE = 'fs_mi_reserva';

/**
 * "Mi reserva": prendas elegidas para reservar un turno de prueba. Vive en el
 * navegador (no hay tabla): recién al confirmar se crea la reserva real.
 * Una reserva es de una sola sucursal, por eso se agrupa por sucursal.
 */
@Injectable({ providedIn: 'root' })
export class ReservaBolsaService {
  private readonly _items = signal<ItemBolsa[]>(this.leer());

  readonly items = this._items.asReadonly();
  readonly cantidad = computed(() => this._items().reduce((t, i) => t + i.cantidad, 0));
  readonly grupos = computed<GrupoBolsa[]>(() => {
    const porSucursal = new Map<number, GrupoBolsa>();
    for (const item of this._items()) {
      const grupo = porSucursal.get(item.sucursalId) ?? {
        sucursalId: item.sucursalId,
        sucursal: item.sucursal,
        ciudad: item.ciudad,
        items: [],
      };
      grupo.items.push(item);
      porSucursal.set(item.sucursalId, grupo);
    }
    return [...porSucursal.values()];
  });

  cantidadEnBolsa(varianteId: number, sucursalId: number): number {
    return (
      this._items().find((i) => i.varianteId === varianteId && i.sucursalId === sucursalId)
        ?.cantidad ?? 0
    );
  }

  /** Si la prenda ya estaba en esa sucursal, suma la cantidad (sin pasar del stock). */
  agregar(nuevo: ItemBolsa): void {
    const lista = this._items();
    const existente = lista.find(
      (i) => i.varianteId === nuevo.varianteId && i.sucursalId === nuevo.sucursalId,
    );
    if (existente) {
      const cantidad = Math.min(existente.cantidad + nuevo.cantidad, nuevo.maxDisponible);
      this.guardar(
        lista.map((i) =>
          i === existente ? { ...i, cantidad, maxDisponible: nuevo.maxDisponible } : i,
        ),
      );
    } else {
      this.guardar([...lista, nuevo]);
    }
  }

  cambiarCantidad(varianteId: number, sucursalId: number, cantidad: number): void {
    this.guardar(
      this._items().map((i) =>
        i.varianteId === varianteId && i.sucursalId === sucursalId
          ? { ...i, cantidad: Math.max(1, Math.min(cantidad, i.maxDisponible)) }
          : i,
      ),
    );
  }

  quitar(varianteId: number, sucursalId: number): void {
    this.guardar(
      this._items().filter((i) => !(i.varianteId === varianteId && i.sucursalId === sucursalId)),
    );
  }

  quitarSucursal(sucursalId: number): void {
    this.guardar(this._items().filter((i) => i.sucursalId !== sucursalId));
  }

  limpiar(): void {
    this.guardar([]);
  }

  private guardar(items: ItemBolsa[]): void {
    this._items.set(items);
    try {
      localStorage.setItem(CLAVE, JSON.stringify(items));
    } catch {
      // sin almacenamiento disponible: la bolsa sigue funcionando en memoria.
    }
  }

  private leer(): ItemBolsa[] {
    try {
      const crudo = localStorage.getItem(CLAVE);
      return crudo ? (JSON.parse(crudo) as ItemBolsa[]) : [];
    } catch {
      return [];
    }
  }
}
