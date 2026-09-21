export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  rol_id: number;
  rol: string | null;
  sucursal_id: number | null;
  proveedor_id: number | null;
  activo: boolean;
  fecha_registro: string;
}

export interface Rol {
  id: number;
  nombre: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

/** Nombres de rol tal como los devuelve el backend. */
export const ROL = {
  CLIENTE: 'Cliente',
  ADMIN: 'Administrador',
  ENCARGADO: 'EncargadoSucursal',
  CAJERO: 'Cajero',
  PROVEEDOR: 'Proveedor',
} as const;
