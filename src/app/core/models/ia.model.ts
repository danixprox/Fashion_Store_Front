// CU29 (recomendador), CU30 (chatbot), CU32 (reporte por voz).

export interface ProductoRecomendado {
  id: number;
  nombre: string;
  categoria: string | null;
  temporada: string | null;
  precio_base: string;
  precio_promocional: string | null;
  imagen_url: string | null;
  motivo: string;
}

export interface MensajeChat {
  rol: 'cliente' | 'asistente';
  texto: string;
}

export interface ProductoMencionado {
  id: number;
  nombre: string;
  precio_base: string;
  precio_promocional: string | null;
  imagen_url: string | null;
}

export interface ChatRespuesta {
  respuesta: string;
  productos: ProductoMencionado[];
  carrito_actualizado: boolean;
}

export interface ReporteVoz {
  consulta: string;
  reporte: string;
}
