import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';
import { Usuario } from '../models/usuario.model';

interface LoginResponse {
  access_token: string;
  token_type: string;
  usuario: Usuario;
}

export interface RegistroClienteDto {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono?: string | null;
}

export interface MiCuentaDto {
  nombre?: string;
  apellido?: string;
  telefono?: string | null;
}

export interface CambioPasswordDto {
  password_actual: string;
  password_nueva: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokens = inject(TokenService);
  private readonly router = inject(Router);

  private readonly _user = signal<Usuario | null>(null);
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  hasRole(...roles: string[]): boolean {
    const rol = this._user()?.rol;
    return rol != null && roles.includes(rol);
  }

  async login(email: string, password: string): Promise<Usuario> {
    const body = new URLSearchParams();
    body.set('username', email);
    body.set('password', password);

    const res = await firstValueFrom(
      this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
    );
    this.tokens.set(res.access_token);
    this._user.set(res.usuario);
    return res.usuario;
  }

  /** CU1 — registro de cliente. Deja la sesión iniciada. */
  async register(dto: RegistroClienteDto): Promise<Usuario> {
    const res = await firstValueFrom(
      this.http.post<LoginResponse>(`${environment.apiUrl}/auth/registro`, dto),
    );
    this.tokens.set(res.access_token);
    this._user.set(res.usuario);
    return res.usuario;
  }

  /** Se llama al iniciar la app: si hay token guardado, recupera el usuario. */
  async restoreSession(): Promise<void> {
    if (!this.tokens.get()) return;
    try {
      const u = await firstValueFrom(
        this.http.get<Usuario>(`${environment.apiUrl}/auth/me`),
      );
      this._user.set(u);
    } catch {
      this.tokens.clear();
      this._user.set(null);
    }
  }

  /** CU2 — actualiza los datos propios. */
  async updateProfile(dto: MiCuentaDto): Promise<Usuario> {
    const u = await firstValueFrom(
      this.http.patch<Usuario>(`${environment.apiUrl}/auth/me`, dto),
    );
    this._user.set(u);
    return u;
  }

  /** CU2 — cambia la propia contraseña. */
  async changePassword(dto: CambioPasswordDto): Promise<void> {
    await firstValueFrom(
      this.http.post(`${environment.apiUrl}/auth/cambiar-password`, dto),
    );
  }

  logout(): void {
    this.tokens.clear();
    this._user.set(null);
    void this.router.navigate(['/ingresar']);
  }
}
