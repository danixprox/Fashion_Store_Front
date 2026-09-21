# store-frontend

Aplicación **web** de FashionStore — Plataforma Inteligente de Comercio Electrónico.
Examen 1 · Sistemas II · S2-2026 · Grupo 44 · UAGRM.

## Stack

- Angular 22 (standalone, sin NgModules)
- Angular Material (tema Material 3, paleta verde)
- Tailwind CSS v4 (layout / utilidades)
- Tests: Karma + Jasmine

## Puesta en marcha

```bash
npm install
npm start            # ng serve -> http://localhost:4200
```

El backend se espera en `http://localhost:8000` (ver `src/environments/environment.development.ts`).

## Comandos

```bash
npm start            # servidor de desarrollo
npm run build        # build de producción (dist/)
npm test             # tests unitarios
```

## Estructura

```
src/app/
  core/                servicios transversales
    auth/                token, interceptor, sesión
  features/            una carpeta por dominio (= paquetes de casos de uso)
    identidad/           login, registro, gestión de usuarios
    catalogo/            productos, categorías, ...
    ...
  app.config.ts        providers (router, http, animations)
  app.routes.ts        rutas
src/environments/     apiUrl por entorno
```

## Repositorios del proyecto

- `store-backend` — API REST (FastAPI)
- `store-frontend` — este repo
- `store-movil` — aplicación móvil (Flutter)
