export interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  categoria_id: number;
  categoria: string | null;
  coleccion_id: number | null;
  coleccion: string | null;
  temporada: string | null;
  proveedor_id: number;
  proveedor: string | null;
  precio_compra: string | null; // lo que cobra el proveedor
  precio_base: string | null; // precio de venta (lo fija el admin)
  margen: string | null;
  imagen_url: string | null;
  activo: boolean;
  fecha_creacion: string;
  cantidad_variantes: number;
}

export interface Variante {
  id: number;
  producto_id: number;
  talla_id: number;
  talla: string | null;
  color_id: number;
  color: string | null;
  color_hex: string | null;
  sku: string;
  precio: string | null;
  precio_efectivo: string | null;
  precio_compra: string | null;
  precio_compra_efectivo: string | null;
  imagen_url: string | null;
  imagen_efectivo: string | null;
}

export interface ProductoDetalle extends Producto {
  variantes: Variante[];
}

export interface ProductoOpcion {
  id: number;
  nombre: string;
}
