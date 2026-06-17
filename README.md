# PilotLog

Aplicación **offline-first** en React Native / Expo para pilotos de aviación y operadores UAS (drones). No tiene backend: todos los datos se guardan localmente en SQLite, con lecturas externas de las APIs de NOAA y Google.

## Características

- **METAR** — búsqueda con autocompletado (aeropuertos de Colombia), decodificación en español y cache offline de 6 horas (NOAA AWC).
- **Índice Kp** — gauge, gráfico de 24 h, pronóstico a 3 días y análisis de impacto (NOAA SWPC).
- **Checklists** — plantillas prearmadas (Cessna 172 VFR/post, genéricos, RPAS), editor de checklists personalizados y ejecución con estados (ok / N/A / omitido + razón).
- **Bitácora tripulada** — campos OACI con cálculo automático de tiempo de vuelo.
- **Bitácora UAS / Drone** — sitio de operación, captura GPS + geocodificación inversa, altitud y distancia máximas, VLOS/BVLOS, tipo de misión.
- **Exportación / importación** — JSON, CSV y PDF, con deduplicación al importar.
- **i18n** — español (fuente de verdad), inglés y portugués (pt-BR), con detección del idioma del sistema.

## Stack

Expo SDK 54 · Expo Router (file-based) · TypeScript strict · Zustand (+ SecureStore) · TanStack Query · Expo SQLite (WAL) · NativeWind (Tailwind CSS) · date-fns · i18next.

## Comandos

```bash
npm start          # Servidor de desarrollo Expo (iOS / Android / web)
npm run ios        # Simulador iOS
npm run android    # Emulador Android
npm run web         # Vista previa web
npm run lint       # ESLint sobre .ts/.tsx
```

No hay test runner configurado; la verificación se hace con `npm run lint` y `npx tsc --noEmit`.

## Configuración

Requiere `EXPO_PUBLIC_GOOGLE_MAPS_KEY` en `.env` (con Maps Static API y Geocoding API habilitadas). Ver `.env.example`.

## Estructura

- `app/` — rutas (Expo Router). Entrada en `app/_layout.tsx`; `app/index.tsx` decide entre `app/auth/` y `app/(tabs)/`.
- `src/components/` — componentes reutilizables (pickers, campos de rango de fecha/hora, etc.).
- `src/db/` — inicialización SQLite y acceso a datos.
- `src/store/` — estado Zustand (perfil, favoritos, locale, sesión).
- `src/utils/` — utilidades puras (validación de rangos, exportación/importación).
- `src/i18n/` — traducciones (`es` / `en` / `pt`).
- `docs/` — PRD, estrategia por ticket (`docs/tickets/`) y diseño.

Alias de import: `@/*` → `./src/*`.

## Documentación

El producto se especifica en [`docs/PRD.md`](docs/PRD.md). Las estrategias de implementación por ticket viven en [`docs/tickets/`](docs/tickets/).

## Changelog

- **2026-06-17 — PAR-5**: utilidad y componentes reutilizables de rango de fecha/hora que garantizan `inicio ≤ fin`. Nuevos: `src/utils/dateTimeRange.ts`, `src/components/DateRangeField.tsx`, `src/components/TimeRangeField.tsx`. La validación de hora se aplica a `blockOut`/`blockIn` en el formulario de vuelo (no se puede guardar con la llegada anterior a la salida; el autocálculo de tiempo total usa resta directa en lugar de `Math.abs`). Claves i18n `dateTimeRange` en los tres idiomas.
