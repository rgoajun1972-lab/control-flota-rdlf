# Control de Flota RDLF (web)

Versión web del Control de Flota para la Ruta de la Fruta.

**Stack:** SvelteKit + Tailwind CSS v4 + Supabase (Postgres + REST).

## Variables de entorno

Crear un archivo `.env` (o configurar en Vercel) con:

```
PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

## Correr en local

```bash
npm install
npm run dev        # http://localhost:5173
```

## Build de producción

```bash
npm run build
npm run preview
```

## Base de datos

El esquema está en Supabase. Tablas principales:

- `moviles` — catálogo de vehículos (titulares + reemplazos).
- `envios_taller` — historial de envíos a taller (activos + cerrados).

Ambas sin RLS porque el programa es de uso libre (sin login).

---

Programa pensado para que cualquiera pueda clonarlo y usarlo. Las adaptaciones
específicas de la Ruta de la Fruta están en `src/lib/supabase.ts`
(áreas, leasings, marcas, estados, etc.) — son fáciles de ajustar.
