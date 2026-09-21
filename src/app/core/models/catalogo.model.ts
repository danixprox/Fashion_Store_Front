export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface Talla {
  id: number;
  valor: string;
  tipo: string;
  activo: boolean;
}

export interface Color {
  id: number;
  nombre: string;
  codigo_hex: string | null;
  activo: boolean;
}

export const TALLA_TIPOS = ['Ropa', 'Calzado', 'Otro'] as const;
