import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Rol, Usuario } from '../../../core/models/usuario.model';
import { UsuariosService } from './usuarios.service';
import {
  UsuarioFormData,
  UsuarioFormDialog,
} from './usuario-form-dialog';

@Component({
  selector: 'app-usuarios-page',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './usuarios-page.html',
  styleUrl: './usuarios-page.scss',
})
export class UsuariosPage implements OnInit {
  private readonly service = inject(UsuariosService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  private readonly buscador =
    viewChild<ElementRef<HTMLInputElement>>('buscador');

  protected readonly columnas = ['nombre', 'email', 'rol', 'estado', 'acciones'];

  protected readonly cargando = signal(false);
  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(0); // 0-based (paginator)
  protected readonly size = signal(10);
  protected readonly roles = signal<Rol[]>([]);

  protected readonly qCtrl = new FormControl('', { nonNullable: true });
  protected readonly rolId = signal<number | null>(null);
  protected readonly estado = signal<'todos' | 'activos' | 'inactivos'>('todos');

  protected readonly sinResultados = computed(
    () => !this.cargando() && this.usuarios().length === 0,
  );

  ngOnInit(): void {
    this.service.roles().subscribe((r) => this.roles.set(r));

    this.qCtrl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.page.set(0);
        this.cargar();
      });

    this.cargar();
  }

  @HostListener('document:keydown', ['$event'])
  enfocarBuscador(ev: Event): void {
    const e = ev as KeyboardEvent;
    if (e.key !== '/') return;
    const t = e.target as HTMLElement;
    if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return;
    e.preventDefault();
    this.buscador()?.nativeElement.focus();
  }

  cambiarFiltroRol(valor: number | null): void {
    this.rolId.set(valor);
    this.page.set(0);
    this.cargar();
  }

  cambiarFiltroEstado(valor: 'todos' | 'activos' | 'inactivos'): void {
    this.estado.set(valor);
    this.page.set(0);
    this.cargar();
  }

  onPage(ev: PageEvent): void {
    this.page.set(ev.pageIndex);
    this.size.set(ev.pageSize);
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    const activo =
      this.estado() === 'todos' ? null : this.estado() === 'activos';
    this.service
      .listar({
        q: this.qCtrl.value.trim() || undefined,
        rol_id: this.rolId(),
        activo,
        page: this.page() + 1,
        size: this.size(),
      })
      .subscribe({
        next: (res) => {
          this.usuarios.set(res.items);
          this.total.set(res.total);
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.snack.open('No se pudo cargar la lista de usuarios.', 'Cerrar', {
            duration: 4000,
          });
        },
      });
  }

  nuevo(): void {
    this.abrirDialogo(null);
  }

  editar(u: Usuario): void {
    this.abrirDialogo(u);
  }

  private abrirDialogo(usuario: Usuario | null): void {
    const ref = this.dialog.open<
      UsuarioFormDialog,
      UsuarioFormData,
      Usuario | undefined
    >(UsuarioFormDialog, {
      data: { usuario, roles: this.roles() },
      autoFocus: 'first-tabbable',
    });
    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.snack.open(
          usuario ? 'Usuario actualizado.' : 'Usuario creado.',
          'OK',
          { duration: 2500 },
        );
        this.cargar();
      }
    });
  }
}
