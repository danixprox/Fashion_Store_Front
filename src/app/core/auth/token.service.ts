import { Injectable } from '@angular/core';

const TOKEN_KEY = 'fs_access_token';

/** Guarda y lee el token JWT en localStorage. */
@Injectable({ providedIn: 'root' })
export class TokenService {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  set(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* modo privado / almacenamiento bloqueado */
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* noop */
    }
  }
}
