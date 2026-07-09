# PilotLog

Aplicación **offline-first** en React Native / Expo para pilotos de aviación y operadores UAS (drones). No tiene backend: todos los datos se guardan localmente en SQLite, con lecturas externas de las APIs de NOAA y Google.

## Características

- **METAR** — búsqueda con autocompletado (aeropuertos de Colombia), decodificación en español y cache offline de 6 horas (NOAA AWC).
- **Índice Kp** — gauge, gráfico de 24 h, pronóstico a 3 días y análisis de impacto (NOAA SWPC).
- **Condiciones de vuelo (go / no-go)** — banner resumen en Home y pantalla de detalle que combinan METAR + Kp en un nivel general (Buenas / Regulares / Malas) por el peor factor: viento, visibilidad, techo, índice Kp y fenómenos. Acceso al visor geográfico de zonas UAS de la Aerocivil (ArcGIS).
- **Checklists** — plantillas prearmadas (Cessna 172 VFR/post, genéricos, RPAS) y editor de checklists personalizados; la sección "Listas de chequeo" es solo catálogo (crear / clonar / ver). La ejecución (ok / N/A / omitido + razón) se hace únicamente al registrar un vuelo y queda vinculada a él.
- **Bitácora tripulada** — campos OACI con cálculo automático de tiempo de vuelo.
- **Bitácora UAS / Drone** — sitio de operación, captura GPS + geocodificación inversa, altitud y distancia máximas, VLOS/BVLOS, tipo de misión.
- **Exportación / importación** — JSON, CSV y PDF, con deduplicación al importar.
- **i18n** — español (fuente de verdad), inglés y portugués (pt-BR), con detección del idioma del sistema.
- **Tema (Claro / Oscuro / Sistema)** — selector en Configuración que fuerza el tema de toda la app o sigue la apariencia del teléfono; aplica al instante y persiste (SecureStore).

## Stack

Expo SDK 54 · Expo Router (file-based) · TypeScript strict · Zustand (+ SecureStore) · TanStack Query · Expo SQLite (WAL) · NativeWind (Tailwind CSS) · date-fns · i18next.

## Comandos

```bash
npm start          # Servidor de desarrollo Expo (iOS / Android / web)
npm run ios        # Simulador iOS
npm run android    # Emulador Android
npm run web         # Vista previa web
npm run lint       # ESLint (flat config, eslint-config-expo) sobre todo el proyecto
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

- **2026-07-09 — PAR-15 (A2)**: se deja funcional la red de seguridad de lint. El script `npm run lint` (`eslint .`) fallaba porque ESLint no estaba instalado ni configurado. Ahora `eslint@^9` y `eslint-config-expo@~10` están en `devDependencies` con una flat config (`eslint.config.js`) que extiende `eslint-config-expo/flat` e ignora `dist`/`node_modules`/`.expo`. Se corrigieron las violaciones triviales que afloraron: import muerto `Download` en `app/(tabs)/logbook.tsx` (evidencia original del ticket), imports/variables sin usar (`useEffect` en `signin`, `Animated` en `signup`, `Platform`/`useMutation`/`Circle`/`statusColor` en `checklist/[id]/execute`, `setPicTime` en `flight/new`, `isDark` + su import en `FlightConditionsBanner`, `forecastLoading` en `kp`) y las reglas de estilo autofixables (`array-type` → `T[]`). El único hallazgo restante (`import/no-named-as-default-member` sobre `i18n.use(...)`, un falso positivo del patrón de encadenamiento de i18next) se silencia puntualmente con un `eslint-disable-next-line` justificado. Resultado: `npm run lint` termina en **0 errores, 0 warnings** y `npx tsc --noEmit` sigue limpio. El comando queda documentado como paso de verificación (el proyecto no tiene test runner). Habilita PAR-26 (L1) y PAR-27 (L2). Estrategia: `docs/tickets/PAR-15.md`.
- **2026-07-09 — PAR-35 (fix)**: el Home a veces quedaba en blanco al navegar desde Kp. El botón "← Home" de `app/(tabs)/kp.tsx` hacía `router.navigate('/')`, y la ruta `/` es `app/index.tsx` (`EntryScreen`), un gate de auth que solo muestra un `ActivityIndicator` y hacía la redirección real dentro de un `useEffect(..., [])` que corre únicamente al montar; si esa instancia de `/` seguía viva en el stack (Expo Router puede reusarla sin remontar), el efecto no volvía a ejecutarse y la pantalla se quedaba en el loader/blanco. Se corrigió el destino a `router.navigate('/(tabs)')` (el tab Home ya montado) y, como defensa en profundidad, se endureció `EntryScreen` para que resuelva el estado de auth y renderice un `<Redirect href=... />` declarativo de expo-router en vez de navegar imperativamente en el `useEffect`: aunque se vuelva a entrar a `/` estando ya montada, la redirección siempre ocurre y nunca queda un loader colgado. Sin cambios de esquema ni i18n. Verificado: `tsc --noEmit` y `eslint` limpios (solo warnings preexistentes ajenos al cambio), grep confirma que ya no hay otros `navigate('/')`/`push('/')`. Estrategia: `docs/tickets/PAR-35.md`.
- **2026-07-08 — PAR-14 (fix)**: se activa la aplicación de claves foráneas en SQLite. `runMigrations()` (`src/db/database.ts`) solo ejecutaba `PRAGMA journal_mode = WAL`, nunca `PRAGMA foreign_keys = ON`, por lo que los `ON DELETE CASCADE` de `checklist_section`/`checklist_item`/`checklist_item_result` no se aplicaban: borrar un vuelo (`deleteExecutionsByFlight`) o un checklist (`deleteChecklist`) dejaba filas huérfanas acumulándose. Ahora se ejecuta `PRAGMA foreign_keys = ON;` al inicio de `runMigrations` (fuera de transacción, conexión única reutilizada) y se añade una migración de limpieza idempotente (`DELETE ... NOT IN`, orden hijo→nieto) que elimina los huérfanos preexistentes y es segura de re-ejecutar. Sin cambios de esquema ni i18n; los flujos de INSERT ya insertan padre-primero, así que activar la aplicación no rompe la creación de checklists/ejecuciones. Verificado: cascadas y limpieza correctas (test SQLite), `tsc --noEmit` limpio. **Ajuste de code review:** el barrido de huérfanos pasa a orden padre→hijo (sección antes que ítem); con el orden previo (hijo→padre) un ítem que solo queda huérfano porque su sección también lo está sobrevivía hasta el siguiente arranque, ahora se elimina en la misma pasada. Estrategia: `docs/tickets/PAR-14.md`.
- **2026-07-08 — PAR-12**: limpieza de claves i18n muertas. `checklists.list.execute` y `checklists.detail.execute` quedaron sin uso desde PAR-9 (que retiró el botón "Ejecutar" del catálogo de checklists) y se eliminaron de `es.ts`, `en.ts` y `pt.ts`. `checklists.execute.*` (pantalla de ejecución) no se toca. Cambio cosmético, sin impacto funcional. Estrategia: `docs/tickets/PAR-12.md`.
- **2026-07-08 — PAR-10 (fix)**: el anexo "Checklists ejecutados" del PDF exportado mostraba el UUID de `checklist_item.id` en vez del título legible, rompiendo la trazabilidad checklist↔vuelo (O2 del PRD). En `src/utils/flightIO.ts`, `buildChecklistAnnexHtml` ahora recibe un mapa `itemId → title` (nueva función `buildChecklistItemTitles`, que resuelve cada checklist único vía `getChecklistById` de `src/db/checklists.ts`) y lo usa para renderizar cada ítem, con fallback al `itemId` si el checklist original fue borrado. `buildHtml` pasa a ser `async` para resolver ese mapa antes de armar el HTML; `exportFlights` (rama PDF) hace `await` en consecuencia. CSV y JSON no cambian (fuera de alcance — el JSON expone `itemId` crudo, cruzable por el consumidor). Sin cambios de esquema ni i18n. Estrategia: `docs/tickets/PAR-10.md`.
- **2026-07-08 — PAR-13**: en "Registrar vuelo" (`app/flight/new.tsx`), las horas de bloque se prellenan al crear un vuelo nuevo: `blockOut` = hora actual, `blockIn` = hora actual + 2h (vacío si cruza medianoche, es decir hora actual ≥ 22:00); el prellenado usa `initialDraft?.blockOut ?? defaultBlockOut` para no pisar un borrador restaurado (PAR-9) ni datos ya diligenciados. El tiempo total de vuelo (`totalTime`) deja de ser editable a mano y pasa a **derivarse siempre** del intervalo `blockOut`→`blockIn`, recalculando en cada cambio (efecto sin la guarda previa de "solo si está vacío"); intervalo incompleto o inválido (fin < inicio, según PAR-5) → total = 0. Los campos de total en tripulado y UAS pasan a `editable={false}` con opacidad reducida. Se simplifica `handleSave`: ya no recalcula el total de forma defensiva porque siempre viene derivado. Reutiliza `minutesOfDay`/`isValidTimeRange` de `src/utils/dateTimeRange.ts` (PAR-5); sin cambios de esquema SQLite ni claves i18n nuevas. Estrategia: `docs/tickets/PAR-13.md`.
- **2026-07-03 — PAR-9**: la ejecución de checklists se traslada a la creación de vuelo y queda vinculada a la bitácora. En `app/flight/new.tsx` se agregó una sección para elegir y ejecutar uno o más checklists antes de guardar (`app/checklist/[id]/execute.tsx` ahora soporta el parámetro `returnTo` para volver al formulario tras completar); al guardar el vuelo, `linkExecutionsToFlight` vincula las ejecuciones completadas (`checklist_execution.linked_flight_id`), y si el usuario sale sin guardar, las ejecuciones huérfanas se borran. Se retiró el botón "Ejecutar" de `app/(tabs)/checklists.tsx` y `app/checklist/[id]/index.tsx` — el catálogo ya no ejecuta ni guarda resultados. `app/flight/[id].tsx` expande "Checklists asociados" a detalle ítem por ítem (estado + motivo de omisión), no solo el conteo agregado. Nuevas funciones en `src/db/checklists.ts`: `linkExecutionsToFlight`, `getExecutionsForFlights`, `deleteExecutionsByFlight`, `deleteExecution`; `saveItemResult`/`completeExecution` ahora rechazan escribir sobre una ejecución ya completada (inmutabilidad post-cierre). `deleteFlight` en `src/db/flights.ts` borra en cascada las ejecuciones/resultados vinculados al vuelo (el checklist del catálogo nunca se toca). Exportación (`src/utils/flightIO.ts`): JSON incluye el detalle de checklist por vuelo, CSV agrega columnas resumen (`checklists_ejecutados`, `items_ok`, `items_na`, `items_omitidos`) y PDF agrega un anexo por vuelo. Sin cambios de esquema SQLite. Claves i18n nuevas bajo `flight.new.checklists*` y `doc.checklist*` en es/en/pt. Estrategia: `docs/tickets/PAR-9.md`.
- **2026-06-25 — PAR-8**: en la ejecución de checklist, el scroll vuelve al inicio al cambiar de sección. En `app/checklist/[id]/execute.tsx` se añadió un `ref` tipado al `ScrollView` y un `useEffect` dependiente de `sectionIdx` que llama `scrollTo({ y: 0, animated: false })`, evitando que la nueva sección herede el offset de la anterior. Arreglo de UI aislado, sin cambios de esquema ni i18n.
- **2026-06-23 — PAR-7**: selector de tema (Claro / Oscuro / Sistema) en Configuración. Nuevos: `src/store/themeStore.ts` (preferencia persistida en SecureStore con clave `pl-theme`, espejo de `localeStore`) y `src/hooks/useAppColorScheme.ts` (resuelve el esquema efectivo). El cambio se conduce vía NativeWind (`setColorScheme`) para mantener en sync los estilos inline `isDark` y las clases `dark:`. Se migraron los 18 consumidores de `useColorScheme()` de React Native al hook `useAppColorScheme()`; `app/_layout.tsx` carga la preferencia al arrancar y deriva la `StatusBar` del esquema efectivo. Nueva sección "Tema" en `app/settings.tsx` y claves i18n `settings.theme*` en es/en/pt.
- **2026-06-17 — PAR-6**: banner de condiciones de vuelo en Home + pantalla de detalle `flight-conditions`. Evaluación go/no-go (peor factor) sobre datos METAR + Kp existentes. Nuevos: `src/utils/flightConditions.ts`, `src/components/FlightConditionsBanner.tsx`, `app/flight-conditions.tsx`; helper `getLastUasFlightLocation` en `src/db/flights.ts` para centrar el visor UAS de ArcGIS. Botón "Pronóstico" en Quick Actions y ruta stack registrada en `app/_layout.tsx`. Claves i18n `flightConditions` + `home.forecast` en es/en/pt. Nota: el gradiente del banner se aproxima con `View`s para evitar agregar el módulo nativo `expo-linear-gradient`.
- **2026-06-17 — PAR-5**: utilidad y componentes reutilizables de rango de fecha/hora que garantizan `inicio ≤ fin`. Nuevos: `src/utils/dateTimeRange.ts`, `src/components/DateRangeField.tsx`, `src/components/TimeRangeField.tsx`. La validación de hora se aplica a `blockOut`/`blockIn` en el formulario de vuelo (no se puede guardar con la llegada anterior a la salida; el autocálculo de tiempo total usa resta directa en lugar de `Math.abs`). Claves i18n `dateTimeRange` en los tres idiomas.
