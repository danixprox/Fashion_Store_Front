import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ChatRespuesta,
  MensajeChat,
  ProductoRecomendado,
  ReporteVoz,
} from '../../core/models/ia.model';

@Injectable({ providedIn: 'root' })
export class IaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/ia`;

  recomendaciones(): Observable<{ items: ProductoRecomendado[] }> {
    return this.http.get<{ items: ProductoRecomendado[] }>(
      `${this.base}/recomendaciones`,
    );
  }

  chat(mensaje: string, historial: MensajeChat[]): Observable<ChatRespuesta> {
    return this.http.post<ChatRespuesta>(`${this.base}/chat`, {
      mensaje,
      historial,
    });
  }

  reporteVoz(texto: string): Observable<ReporteVoz> {
    return this.http.post<ReporteVoz>(`${this.base}/reportes/voz`, { texto });
  }
}
