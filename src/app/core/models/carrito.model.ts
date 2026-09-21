export interface ItemCarrito {
  id: number;
  variante_id: number;
  producto_id: number | null;
  producto: string | null;
  talla: string | null;
  color: string | null;
  sku: string | null;
  imagen_efectivo: string | null;
  precio_unitario: string | null;
  precio_original: string | null;
  promocion: string | null;
  cantidad: number;
  subtotal: string | null;
  disponible: boolean;
}

export interface Carrito {
  id: number;
  estado: 'ACTIVO' | 'CONVERTIDO' | 'ABANDONADO';
  items: ItemCarrito[];
  cantidad_items: number;
  total: string;
}
