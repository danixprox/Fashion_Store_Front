export interface Temporada {
  id: number;
  nombre: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  activo: boolean;
}

export interface Coleccion {
  id: number;
  nombre: string;
  descripcion: string | null;
  temporada_id: number;
  temporada: string | null;
  activo: boolean;
}
