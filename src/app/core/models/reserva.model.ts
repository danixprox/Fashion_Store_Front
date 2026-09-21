export interface ItemReserva {
  detalle_id: number;
  cantidad_llevada: number | null;
  variante_id: number;
  producto_id: number | null;
  producto: string | null;
  talla: string | null;
  color: string | null;
  sku: string | null;
  cantidad: number;
}

export type EstadoReserva =
  | 'PENDIENTE'
  | 'NOTIFICADA'
  | 'PREPARADA'
  | 'ATENDIDA'
  | 'COMPLETADA'
  | 'CANCELADA'
  | 'EXPIRADA';

export interface Reserva {
  id: number;
  sucursal_id: number;
  sucursal: string | null;
  ciudad: string | null;
  fecha: string; // "YYYY-MM-DD"
  hora_inicio: string; // "HH:MM:SS"
  hora_fin: string;
  duracion_minutos: number;
  estado: EstadoReserva;
  fecha_creacion: string;
  items: ItemReserva[];
}

export interface SlotsDisponibilidad {
  fecha: string;
  duracion_minutos: number;
  cerrado: boolean;
  slots: string[]; // "HH:MM:SS"
}

// CU18/CU19 — vista de la sucursal (encargado/admin)
export interface ReservaSucursal extends Reserva {
  cliente_id: number;
  cliente: string | null;
  cliente_telefono: string | null;
}

// CU35 — finalizar la reserva: qué se lleva el cliente y qué devuelve.
export interface FinalizarReservaResultado {
  reserva: ReservaSucursal;
  venta_id: number | null;
  unidades_llevadas: number;
  unidades_devueltas: number;
  total: string;
}
