// CU33 — Gestionar Promociones.

export type TipoDescuento = 'PORCENTAJE' | 'MONTO_FIJO';

export interface ProductoPromocion {
  id: number;
  nombre: string;
}

export interface VariantePromocion {
  id: number;
  producto: string;
  talla: string | null;
  color: string | null;
}

export interface VarianteOpcion extends VariantePromocion {
  producto_id: number;
}

export interface Promocion {
  id: number;
  nombre: string;
  descripcion: string | null;
  tipo_descuento: TipoDescuento;
  valor: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  vigente: boolean;
  productos: ProductoPromocion[];
  variantes: VariantePromocion[];
}

export interface PromocionDto {
  nombre: string;
  descripcion: string | null;
  tipo_descuento: TipoDescuento;
  valor: number;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  producto_ids: number[];
  variante_ids: number[];
}
