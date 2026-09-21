import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { IaService } from './ia.service';
import { MensajeChat, ProductoMencionado } from '../../core/models/ia.model';
import { CarritoService } from '../carrito/carrito.service';

interface MensajeMostrado extends MensajeChat {
  productos?: ProductoMencionado[];
}

/** CU30 — Consultar Asistente Virtual (Chatbot). */
@Component({
  selector: 'app-asistente-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DecimalPipe,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './asistente-page.html',
  styleUrl: './asistente-page.scss',
})
export class AsistentePage {
  private readonly ia = inject(IaService);
  private readonly location = inject(Location);
  private readonly carritoSvc = inject(CarritoService);
  private readonly snack = inject(MatSnackBar);
  private readonly router = inject(Router);

  @ViewChild('scrollAnchor') private scrollAnchor?: ElementRef<HTMLElement>;

  protected readonly mensajeCtrl = new FormControl('', { nonNullable: true });
  protected readonly mensajes = signal<MensajeMostrado[]>([
    {
      rol: 'asistente',
      texto:
        '¡Hola! Soy el asistente de FashionStore. Contame qué estás buscando y te ayudo a encontrarlo.',
    },
  ]);
  protected readonly enviando = signal(false);

  volver(): void {
    this.location.back();
  }

  enviar(): void {
    const texto = this.mensajeCtrl.value.trim();
    if (!texto || this.enviando()) return;

    const historial: MensajeChat[] = this.mensajes().map((m) => ({
      rol: m.rol,
      texto: m.texto,
    }));

    this.mensajes.update((lista) => [...lista, { rol: 'cliente', texto }]);
    this.mensajeCtrl.setValue('');
    this.enviando.set(true);
    this.desplazarAlFinal();

    this.ia.chat(texto, historial).subscribe({
      next: (res) => {
        this.mensajes.update((lista) => [
          ...lista,
          { rol: 'asistente', texto: res.respuesta, productos: res.productos },
        ]);
        this.enviando.set(false);
        this.desplazarAlFinal();
        // El chatbot puede agregar al carrito de verdad (CU30 + CU21):
        // refrescamos el badge y avisamos con una acción directa.
        if (res.carrito_actualizado) {
          this.carritoSvc.cargar().subscribe();
          this.snack
            .open('El asistente agregó una prenda a tu carrito.', 'Ver carrito', {
              duration: 4000,
            })
            .onAction()
            .subscribe(() => void this.router.navigate(['/carrito']));
        }
      },
      error: () => {
        this.mensajes.update((lista) => [
          ...lista,
          {
            rol: 'asistente',
            texto: 'Tuve un problema para responder. Probá de nuevo en un momento.',
          },
        ]);
        this.enviando.set(false);
        this.desplazarAlFinal();
      },
    });
  }

  private desplazarAlFinal(): void {
    setTimeout(() => {
      this.scrollAnchor?.nativeElement.scrollIntoView({ behavior: 'smooth' });
    });
  }
}
