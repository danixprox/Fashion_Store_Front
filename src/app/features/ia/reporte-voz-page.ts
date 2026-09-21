import { Component, inject, signal } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { IaService } from './ia.service';

// Web Speech API — no todos los navegadores lo tipan igual, así que se
// declara mínimamente lo que se usa (Chrome/Edge lo soportan bien).
interface SpeechRecognitionResultLike {
  transcript: string;
}
interface SpeechRecognitionEventLike {
  results: { [alternativa: number]: SpeechRecognitionResultLike }[];
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

/** CU32 — Generar Reporte por Comando de Voz (panel Administrador). */
@Component({
  selector: 'app-reporte-voz-page',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './reporte-voz-page.html',
  styleUrl: './reporte-voz-page.scss',
})
export class ReporteVozPage {
  private readonly ia = inject(IaService);
  private readonly snack = inject(MatSnackBar);
  private reconocedor: SpeechRecognitionLike | null = null;

  protected readonly soportado = this.hayReconocimientoDeVoz();
  protected readonly escuchando = signal(false);
  protected readonly transcripcion = signal('');
  protected readonly generando = signal(false);
  protected readonly reporte = signal<string | null>(null);

  private hayReconocimientoDeVoz(): boolean {
    const w = window as unknown as Record<string, unknown>;
    return !!(w['SpeechRecognition'] || w['webkitSpeechRecognition']);
  }

  escuchar(): void {
    if (!this.soportado || this.escuchando()) return;

    const w = window as unknown as Record<string, unknown>;
    const Ctor = (w['SpeechRecognition'] || w['webkitSpeechRecognition']) as new () => SpeechRecognitionLike;
    this.reconocedor = new Ctor();
    this.reconocedor.lang = 'es-BO';
    this.reconocedor.interimResults = false;

    this.reconocedor.onresult = (ev) => {
      const texto = ev.results[0][0].transcript;
      this.transcripcion.set(texto);
    };
    this.reconocedor.onerror = () => {
      this.escuchando.set(false);
      this.snack.open('No se pudo escuchar el micrófono.', 'Cerrar', {
        duration: 3500,
      });
    };
    this.reconocedor.onend = () => this.escuchando.set(false);

    this.transcripcion.set('');
    this.reporte.set(null);
    this.escuchando.set(true);
    this.reconocedor.start();
  }

  detener(): void {
    this.reconocedor?.stop();
  }

  generarReporte(): void {
    const texto = this.transcripcion().trim();
    if (!texto || this.generando()) return;

    this.generando.set(true);
    this.ia.reporteVoz(texto).subscribe({
      next: (res) => {
        this.reporte.set(res.reporte);
        this.generando.set(false);
      },
      error: () => {
        this.generando.set(false);
        this.snack.open('No se pudo generar el reporte.', 'Cerrar', {
          duration: 3500,
        });
      },
    });
  }
}
