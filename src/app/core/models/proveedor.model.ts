export interface Proveedor {
  id: number;
  nombre_empresa: string;
  contacto: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  activo: boolean;
}

export interface ProveedorOpcion {
  id: number;
  nombre_empresa: string;
}
