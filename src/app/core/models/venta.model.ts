export interface ItemVenta {
  id: number;
  variante_id: number;
  producto_id: number | null;
  producto: string | null;
  talla: string | null;
  color: string | null;
  sku: string | null;
  cantidad: number;
  precio_unitario: string;
  precio_original: string | null;
  subtotal: string;
  sucursal: string | null;
}

export type EstadoVenta = 'PENDIENTE_PAGO' | 'PAGADA' | 'COMPLETADA' | 'ANULADA';

export interface Venta {
  id: number;
  sucursal_id: number;
  sucursal: string | null;
  ciudad: string | null;
  varias_sucursales: boolean;
  reserva_id: number | null;
  direccion_entrega: string | null;
  referencia_entrega: string | null;
  estado: EstadoVenta;
  total: string;
  fecha_creacion: string;
  items: ItemVenta[];
}

export type EstadoPago = 'PENDIENTE' | 'PROCESANDO' | 'APROBADO' | 'RECHAZADO';

export interface Pago {
  id: number;
  venta_id: number;
  metodo: string;
  estado: EstadoPago;
  monto: string;
  checkout_url: string | null;
  qr_data_url: string | null;
  fecha_creacion: string;
}

export interface EstadoPagoInfo {
  venta_id: number;
  venta_estado: EstadoVenta;
  pago_id: number | null;
  pago_estado: EstadoPago | null;
}

// CU24/25/26 — panel de Cajero
export interface ClienteBuscado {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
}

export interface VentaCaja extends Venta {
  cliente_id: number;
  cliente_nombre: string;
  cajero_nombre: string | null;
}

export interface Comprobante {
  venta_id: number;
  fecha_creacion: string;
  sucursal: string;
  ciudad: string;
  direccion: string;
  cliente_nombre: string;
  cliente_email: string;
  cajero_nombre: string | null;
  items: ItemVenta[];
  total: string;
  metodo_pago: string;
  monto_recibido: string | null;
  vuelto: string | null;
}
