export interface Sucursal {
  id: number;
  nombre: string;
  ciudad: string;
  direccion: string;
  telefono: string | null;
  horario_atencion: string | null;
  activa: boolean;
}

export interface SucursalOpcion {
  id: number;
  nombre: string;
  ciudad: string;
}

// CU16 — horario de atención, un objeto por día (0=Lunes … 6=Domingo)
export interface HorarioDia {
  dia_semana: number;
  cerrado: boolean;
  hora_apertura: string | null; // "HH:MM:SS"
  hora_cierre: string | null;
}
