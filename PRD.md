# PRD — PilotLog (nombre tentativo)

**Aplicación móvil React Native para consulta de METAR, índice Kp, gestión de checklists, bitácora de vuelo tripulado y bitácora UAS/drone**

| Campo | Valor |
|---|---|
| Versión del documento | 4.0 |
| Fecha | 2 de junio de 2026 |
| Estado | En desarrollo activo — Hito 2 en curso |
| Owner | Jhon (desarrollo y producto) |
| Audiencia | Equipo de desarrollo, pilotos beta-testers |

---

## 1. Resumen ejecutivo

PilotLog es una aplicación móvil multiplataforma (iOS + Android) construida en React Native que reúne, en una sola herramienta, los flujos críticos para la operación segura de vuelos de aviación general **y operaciones con aeronaves no tripuladas (UAS/drone)**:

1. **Consulta meteorológica** — lectura y decodificación de METAR de aeropuertos consultados con frecuencia.
2. **Consulta de clima espacial** — índice planetario Kp (NOAA SWPC) con análisis de impacto operacional.
3. **Checklists + bitácora tripulada** — listas de verificación pre/post-vuelo con trazabilidad completa.
4. **Bitácora UAS/drone** — registro de operaciones RPAS: sitio, coordenadas GPS, altitud, distancia, misión, VLOS/BVLOS; con geocodificación automática de la zona de operación.

El objetivo es reemplazar el flujo fragmentado actual por una experiencia unificada, offline-friendly y enfocada en pilotos y operadores de aviación general en Latinoamérica, con énfasis inicial en Colombia.

---

## 2. Problema y oportunidad

### Problema
Hoy un piloto o operador UAS realiza tareas de pre-vuelo combinando: una app para METAR/TAF, otra para clima espacial, un checklist en papel, una bitácora física, y a veces coordenadas GPS anotadas manualmente. Esto genera:

- **Fricción operativa** — cambiar entre 3-5 herramientas antes de cada vuelo.
- **Falta de trazabilidad** — el checklist marcado en papel no queda asociado al vuelo registrado.
- **Riesgo de omisión** — verificaciones saltadas no se detectan hasta después del incidente.
- **Pérdida de contexto histórico** — imposible responder "¿qué condiciones tuve en mi operación del lunes en la zona industrial?" desde el papel.

### Oportunidad
Una sola app que combine consulta meteorológica, ejecución de checklists, bitácora tripulada y bitácora UAS — donde cada entrada guarde automáticamente el METAR vigente, el estado del checklist completado, y la dirección de la zona de operación obtenida via Google Maps Geocoding.

---

## 3. Usuarios objetivo

### Persona primaria — "Piloto privado activo"
- Licencia PPL/PC, vuela 2-10 horas al mes en aviación general.
- Aeronaves típicas: Cessna 172, Piper PA-28.
- Smartphone Android o iPhone reciente.
- Idioma: español (Latam) primario, comprende inglés técnico (METAR).

### Persona secundaria — "Operador UAS / piloto de drones"
- Opera RPAs/drones comerciales o recreativos en Colombia.
- Requiere registro de operaciones con sitio, altitud y tipo de misión.
- Familiarizado con la regulación UAEAC para drones.

### Persona terciaria — "Estudiante de aviación"
- En escuela de vuelo, requiere bitácora con firma de instructor.
- Aprende a interpretar METAR/TAF, valora la decodificación visual.
- Necesita enviar su historial de vuelos y checklists ejecutados a su instructor para revisión.

### Persona cuaternaria — "Instructor de vuelo"
- Tipo de licencia: Instructor (ya seleccionable en onboarding).
- Recibe portafolios de varios estudiantes, necesita revisarlos offline y devolver evaluaciones escritas.
- Puede pertenecer a una escuela de vuelo con nombre institucional.
- No requiere conectividad para evaluar — el intercambio ocurre vía archivos (WhatsApp, email, Archivos).

### Persona futura — "Piloto comercial de aviación general"
- Vuela charter / taxi aéreo, requiere reportes exportables.

### No-target (V1)
- Pilotos de línea aérea (su operador ya provee herramientas certificadas).

---

## 4. Objetivos y métricas de éxito

### Objetivos
- **O1.** Reducir el tiempo de briefing meteorológico + checklist pre-vuelo a < 5 minutos.
- **O2.** Lograr trazabilidad 100% entre checklist completado y vuelo/operación registrados.
- **O3.** Funcionar offline para el checklist y la bitácora; solo la consulta meteorológica y geocodificación requieren conectividad.

### KPIs (post-lanzamiento V1)
| KPI | Meta a 3 meses |
|---|---|
| Vuelos/operaciones registrados por usuario activo / mes | ≥ 3 |
| % de vuelos con checklist completo asociado | ≥ 80% |
| Crash-free sessions | ≥ 99.5% |
| Tiempo promedio de consulta METAR (apertura → datos visibles) | < 3 segundos |
| Retención D30 | ≥ 35% |

---

## 5. Alcance

### Dentro del alcance (V1 / MVP) — estado actual

| Funcionalidad | Estado |
|---|---|
| Onboarding: disclaimer legal + perfil piloto + PIN | ✅ implementado |
| Búsqueda METAR con autocompletado (aeropuertos Colombia) | ✅ implementado |
| Decodificación METAR en español + cache offline | ✅ implementado |
| Favoritos con actualización automática cada 5 min | ✅ implementado |
| Módulo Kp: gauge, gráfico 24h, pronóstico 3 días, análisis de impacto | ✅ implementado |
| Checklists prearmados Cessna 172 VFR/post + genéricos + RPAS | ✅ implementado |
| Editor de checklists personalizados con secciones dinámicas | ✅ implementado |
| Ejecución checklist con estados (ok / N/A / skipped + razón) | ✅ implementado |
| Bitácora tripulada con campos OACI + cálculo automático de tiempo | ✅ implementado |
| Bitácora UAS con sitio, GPS, altitud, distancia, VLOS, misión | ✅ implementado |
| Geocodificación inversa (Google Maps) para zona de operación UAS | ✅ implementado |
| Vinculación vuelo ↔ checklists ejecutados | ✅ implementado |
| Estadísticas de horas (total, últimos 90 días, últimos 12 meses) | ✅ implementado |
| Detalle de vuelo con mapa estático Google Maps | ✅ implementado |
| Drone model: imagen Wikipedia → Amazon fallback + enlace fabricante | ✅ implementado |
| Exportación JSON y CSV de bitácora | ✅ implementado |
| Exportación PDF de bitácora | ✅ implementado |
| Importación de bitácora desde JSON/CSV con deduplicación | ✅ implementado |
| Preferencia de idioma (es/en/pt + detección del sistema) | ✅ implementado |
| Pantalla de configuración | ✅ implementado |
| Notificaciones locales Kp ≥ 5 | ⏳ pendiente |

### Fuera del alcance (V1)
- Planificación de ruta / mapas aeronáuticos / cartas.
- Cálculos de peso y balance (V2).
- Firma digital de instructor (V2).
- TAF, SIGMET, AIRMET (V2).
- Sincronización en la nube entre dispositivos (V2 — Supabase).
- Modo "EFB" certificado (explícitamente fuera de alcance).

---

## 6. Funcionalidades — detalle

### 6.0 Módulo de autenticación y onboarding

**Pantallas.**

**`app/index.tsx` — Entry/Splash**
- Verifica al arrancar si el piloto ya aceptó el disclaimer y tiene perfil.
- Redirige automáticamente según estado: `disclaimer` → `signup` → `signin` (si hay PIN) → `tabs`.

**`app/auth/disclaimer.tsx` — Aviso legal**
- Pantalla de bienvenida con aviso explícito: la app es una **herramienta de asistencia**, no un EFB certificado ni reemplaza fuentes oficiales.
- Tarjetas de características (METAR, Kp, Checklists, Bitácora).
- Aceptación persistida en Expo SecureStore; no se vuelve a mostrar.

**`app/auth/signup.tsx` — Creación de perfil**
- **Paso 1:** Nombre (mín. 2 chars), tipo de licencia (Estudiante/PPL/CPL/ATPL/Instructor), número de licencia (opcional), toggle PIN.
- **Paso 2:** PIN de 4 dígitos con confirmación (opcional).
- Datos almacenados localmente en Expo SecureStore; PIN hasheado.

**`app/auth/signin.tsx` — Acceso con PIN**
- Teclado numérico personalizado, puntos de retroalimentación visual.
- Shake animation + vibración en PIN incorrecto.
- Contador de intentos (visible desde el 3.º intento).
- "Cambiar cuenta" → signOut() → signup.

### 6.1 Módulo METAR

**`app/(tabs)/metar.tsx`**

- Buscador con autocompletado sobre lista local de aeropuertos Colombia (máx. 8 resultados por prefijo ICAO o nombre).
- **MetarCard** (`src/components/MetarCard.tsx`) muestra: ICAO + nombre, badge VFR/MVFR/IFR/LIFR (con color), viento, visibilidad, nubes, temperatura/rocío, QNH, antigüedad, indicador de cache.
- Toggle raw / decodificado en español (tap para expandir).
- Estrella para agregar/quitar favoritos (persistido en SecureStore).
- Lista de favoritos cuando no hay búsqueda activa.
- Refresco automático cada 5 minutos; pull-to-refresh manual.

**Origen de datos.** Aviation Weather Center (`aviationweather.gov/api/data/metar`). Timeout 8 s. Fallback a cache SQLite con antigüedad máxima 6 h.

**METAR decodificado incluye:**
- Viento (dirección, velocidad, ráfagas).
- Visibilidad.
- Capas de nubes (cobertura + base en ft).
- Temperatura, punto de rocío, QNH.
- Fenómenos activos (TS, RA, SN, FG, BR, HZ, etc.).
- Humedad relativa y altitud de densidad calculadas.
- Badge NOSIG cuando aplica.

### 6.2 Módulo Kp index

**`app/(tabs)/kp.tsx`**

- Gauge circular grande con Kp actual (0-9); color adaptativo verde → ámbar → rojo.
- Ícono de estado (`CheckCircle` / `AlertTriangle`) con texto descriptivo.
- Gráfico de barras de las últimas 24 h (48 lecturas de 30 min).
- Pronóstico 3 días agrupado por día; barras sólidas = observado, semitransparentes = pronosticado.
- Análisis de impacto operacional por sistema: HF, GNSS/GPS, brújula magnética, auroras.
- Escala de referencia (Kp 0-3 calma, 4 activo, 5+ tormenta).
- Refresco actual cada 10 min; pronóstico on-mount.

**Origen de datos.** NOAA SWPC (`services.swpc.noaa.gov`): `planetary_k_index_1m.json` y `noaa-planetary-k-index-forecast.json`.

**Pendiente:** notificación local cuando Kp pronosticado ≥ 5 para las próximas 24 h.

### 6.3 Módulo Checklists

**`app/(tabs)/checklists.tsx`**

Dos secciones: "Plantillas predefinidas" y "Mis checklists". Acciones por tarjeta: ejecutar, clonar, eliminar (solo propios).

**Plantillas precargadas:**

| Plantilla | Secciones | Ítems |
|---|---|---|
| Cessna 172 — Pre-vuelo VFR diurno | 4 | 26 |
| Cessna 172 — Post-vuelo | 2 | 11 |
| Genérico — Documentación y planeación | 3 | 12 |
| Genérico — Aseguramiento de aeronave | 1 | 7 |
| Drone / UAS — Pre-vuelo RPAS | 5 | ~25 |

La plantilla RPAS incluye secciones: Documentación, Hardware del equipo, Sistemas y comunicaciones, Condiciones del entorno, Post-vuelo. Se re-verifica en cada versión para garantizar que siempre esté disponible.

**`app/checklist/new.tsx` — Creación**
- Nombre + descripción opcionales, secciones e ítems dinámicos, toggle Req. por ítem.

**`app/checklist/[id]/execute.tsx` — Ejecución**
- Navegación sección a sección, barra de progreso, estados por ítem (ok / N/A / skipped con razón), botón "Completar" habilitado cuando todos los requeridos están marcados.

### 6.4 Módulo Bitácora tripulada

**`app/(tabs)/logbook.tsx` / `app/flight/new.tsx` / `app/flight/[id].tsx`**

**Formulario (modo Tripulado):**
- Fecha, origen/destino ICAO, matrícula, tipo de aeronave.
- Bloque salida/llegada → cálculo automático de tiempo total.
- Tiempos discriminados: total, nocturno, IFR.
- Aterrizajes día/noche, aproximaciones, rol (PIC/SIC/dual/solo/instructor).
- Notas.

**Resumen estadístico:** horas totales, últimos 90 días, últimos 12 meses, aterrizajes 90 días.

**Detalle de vuelo:**
- Mapa estático Google Maps (ruta geodésica origen → destino) si `EXPO_PUBLIC_GOOGLE_MAPS_KEY` está configurado.
- Botón "Ver ruta en Google Maps".
- Checklists ejecutados vinculados al vuelo.

### 6.5 Módulo Bitácora UAS / Drone

**`app/flight/new.tsx` (modo UAS)**

**Formulario:**
- Fecha.
- **Zona / Sitio de operación** — campo de texto auto-completado con dirección desde Google Maps Geocoding cuando el usuario captura GPS y el campo está vacío (ver §6.5.1).
- Botón de captura GPS: obtiene coordenadas de alta precisión via `expo-location`.
- ID / matrícula del drone, modelo del drone.
- Inicio / fin de operación, tiempo de vuelo total.
- Altitud máxima AGL (ft), distancia máxima (m).
- Toggle VLOS / BVLOS con descripción.
- Tipo de misión: Fotografía aérea / Inspección / Topografía-Mapeo / Agricultura / Vigilancia / Recreativo / Investigación / Otro.
- Rol: Operador RPA / Observador visual.
- Notas.

**`app/flight/[id].tsx` (detalle UAS):**
- Mapa estático con marcador en las coordenadas GPS del sitio.
- Botón "Abrir en Google Maps".
- Tarjeta de modelo drone con imagen (Wikipedia → Amazon fallback), fabricante detectado automáticamente (20+ marcas), enlace a página de producto o sitio del fabricante.
- Datos de la operación: sitio, coordenadas, VLOS, altitud, distancia, misión, rol, tiempos.

#### 6.5.1 Geocodificación inversa para zona de operación

**Comportamiento:**
1. El usuario toca "Capturar ubicación GPS".
2. La app obtiene `lat/lng` via `expo-location` (precisión `High`).
3. Si `EXPO_PUBLIC_GOOGLE_MAPS_KEY` está configurado **y** el campo "Zona / Sitio" está vacío, se llama a la API `geocode/json?latlng=…&language=es&result_type=premise|route|neighborhood|locality`.
4. Si la respuesta es `OK`, se rellena automáticamente el campo con `formatted_address` del primer resultado.
5. Aparece un indicador verde "Dirección completada desde GPS" debajo del campo.
6. Si el usuario edita manualmente el campo, el indicador desaparece.
7. Si el usuario toca "Borrar ubicación", se limpian coordenadas e indicador pero **no** el texto escrito.
8. Si la geocodificación falla (sin red, sin key, error de API), el fallo es silencioso — las coordenadas se guardan igual y el campo queda vacío para que el usuario lo complete manualmente.

**Endpoint:** `https://maps.googleapis.com/maps/api/geocode/json`
**Idioma:** `language=es` (respuesta siempre en español).
**Key:** `EXPO_PUBLIC_GOOGLE_MAPS_KEY` (mismo que se usa para el mapa estático en detalle de vuelo).

### 6.6 Pantalla de configuración

**`app/settings.tsx`**
- Selector de idioma: Predeterminado del sistema / Español / Inglés / Portugués.
- Preferencia persistida en Expo SecureStore via `localeStore`.
- Aplica `i18next.changeLanguage()` inmediatamente.

### 6.7 Home / Dashboard

**`app/(tabs)/index.tsx`**
- Saludo con nombre del piloto según hora del día (mañana/tarde/noche) + tipo de licencia.
- Badge Kp actual (tappable → módulo Kp).
- Atajos: "Nuevo vuelo", "Pre-vuelo (checklist)".
- Tarjetas estadísticas: horas totales, horas 90 días, aterrizajes 90 días.
- Sección "Favoritos" con METAR de cada aeropuerto, color-coded; pull-to-refresh.
- Estado vacío con invitación a agregar favoritos desde METAR.

### 6.8 Módulo Escuela de Vuelo

#### Concepto central: Portafolio de vuelo

Un archivo autónomo que el estudiante genera a partir de sus vuelos registrados y checklists ejecutados en PilotLog. El instructor lo importa en su propio dispositivo, agrega evaluaciones por vuelo y devuelve un archivo de evaluación — todo sin servidor, sin internet, sin sincronización en la nube.

El intercambio ocurre por cualquier canal que el usuario elija: WhatsApp, correo, AirDrop, Bluetooth, Archivos del sistema.

#### Roles

El rol se deriva del `license_type` seleccionado en onboarding (campo ya existente):

| `license_type` | Vista del Hub Escuela |
|---|---|
| `instructor` | Modo evaluador: importar portafolios, listar estudiantes, evaluar vuelos, exportar evaluación |
| Cualquier otro | Modo estudiante: crear portafolio, compartir, ver evaluaciones recibidas |

No hay cambio de pantalla de registro — el tipo de licencia ya capturado determina el comportamiento.

#### Pantallas

| Ruta | Rol | Descripción |
|---|---|---|
| `app/school/index.tsx` | Ambos | Hub adaptado al rol |
| `app/school/send.tsx` | Estudiante | Seleccionar vuelos → generar portafolio → compartir |
| `app/school/evaluations.tsx` | Estudiante | Lista de evaluaciones recibidas con badge por estado |
| `app/school/portfolios/index.tsx` | Instructor | Lista de portafolios importados con estado de revisión |
| `app/school/portfolios/[id].tsx` | Instructor | Lista de vuelos en un portafolio con calificación por vuelo |
| `app/school/portfolios/[id]/evaluate/[flightId].tsx` | Instructor | Detalle de vuelo + checklists + formulario de evaluación |

#### Flujo 1 — Estudiante crea y envía portafolio

1. Hub Escuela → "Crear portafolio".
2. Seleccionar rango de fechas (selector de periodo) o elegir vuelos individuales (lista con checkbox).
3. Preview: N vuelos · N checklists vinculados · período cubierto · nombre del estudiante.
4. "Generar y compartir" → app serializa el portafolio (ver §6.8.1) y abre el share sheet del sistema.
5. El estudiante elige canal (WhatsApp, email, Archivos, etc.) y envía.
6. El portafolio queda registrado localmente como "Enviado" con fecha.

#### Flujo 2 — Instructor importa y evalúa

1. Instructor recibe el archivo `.pilotlog` por cualquier canal.
2. Puede abrir el archivo directamente ("Abrir con PilotLog") o importarlo desde Hub Escuela → "Importar portafolio" → `expo-document-picker`.
3. App detecta el tipo por el campo `"type": "pilotlog-portfolio"` y lo almacena localmente.
4. En `portfolios/index.tsx`: lista de portafolios ordenados por fecha de importación con chip de estado (Pendiente / En revisión / Evaluado).
5. En `portfolios/[id].tsx`: lista de vuelos del estudiante con campos clave (fecha, ruta o sitio, aeronave, tiempo total). Cada vuelo muestra badge de evaluación si ya fue calificado.
6. En `portfolios/[id]/evaluate/[flightId].tsx`:
   - Todos los campos del vuelo en modo lectura (sin edición).
   - Checklists vinculados expandibles: ver cada ítem con su estado `ok / N/A / skipped + razón`.
   - Formulario de evaluación:
     - **Calificación:** `Aprobado` / `Con observaciones` / `Pendiente revisión`
     - **Notas del instructor:** campo de texto libre.
     - **Ítems a destacar:** selección multi-ítem de los resultados de checklist para marcar (si aplica).
7. Una vez evaluados todos los vuelos, el instructor puede añadir un **resumen global** (notas generales del periodo).
8. "Exportar evaluación" → genera el archivo `.pilotlog-eval` (ver §6.8.2) → share sheet.

#### Flujo 3 — Estudiante recibe y consulta evaluación

1. Estudiante recibe el archivo `.pilotlog-eval` por el mismo canal.
2. Abre con PilotLog o importa desde Hub Escuela → "Importar evaluación".
3. App vincula la evaluación con los vuelos locales por `flight_id`.
4. En la Bitácora, los vuelos evaluados muestran un badge de color:
   - Verde = Aprobado
   - Amarillo = Con observaciones
   - Naranja = Pendiente revisión
5. En detalle del vuelo (`app/flight/[id].tsx`): nueva sección "Evaluación del instructor" con calificación, nombre del instructor, escuela, fecha de evaluación, notas, y checklists con ítems destacados marcados.

#### 6.8.1 Formato de portafolio (`.pilotlog`)

```json
{
  "type": "pilotlog-portfolio",
  "version": "1.0",
  "exported_at": "2026-06-01T14:30:00Z",
  "student": {
    "name": "Carlos Pérez",
    "license_type": "student",
    "license_number": "COL-2024-1234"
  },
  "period": { "from": "2026-05-01", "to": "2026-05-31" },
  "flights": [
    {
      "id": "<uuid>",
      "date": "2026-05-15",
      "flight_type": "manned",
      "origin": "SKBO", "destination": "SKRG",
      "aircraft_type": "C172", "registration": "HK-1234",
      "block_out": "09:00", "block_in": "10:15", "total_time": 1.25,
      "role": "dual", "notes": "...",
      "checklists": [
        {
          "name": "Cessna 172 Pre-vuelo VFR",
          "completed_at": "2026-05-15T08:45:00Z",
          "items": [
            { "title": "Combustible", "status": "ok" },
            { "title": "Altímetro", "status": "skipped", "note": "Inop" }
          ]
        }
      ]
    }
  ]
}
```

#### 6.8.2 Formato de evaluación (`.pilotlog-eval`)

```json
{
  "type": "pilotlog-evaluation",
  "version": "1.0",
  "portfolio_exported_at": "2026-06-01T14:30:00Z",
  "evaluated_at": "2026-06-02T09:00:00Z",
  "instructor": {
    "name": "Juan Instructor",
    "license_type": "instructor",
    "license_number": "COL-INST-5678",
    "school": "Aeroclube de Medellín"
  },
  "student": { "name": "Carlos Pérez", "license_type": "student" },
  "evaluations": {
    "<flight_uuid>": {
      "grade": "approved",
      "notes": "Buen manejo de radio. Verificar ajuste de altímetro antes del vuelo.",
      "flagged_checklist_items": ["<item_title_or_id>"]
    }
  },
  "summary": {
    "overall_notes": "Carlos muestra progreso sólido. Reforzar procedimientos de emergencia.",
    "counts": { "approved": 6, "observations": 2, "pending": 0 }
  }
}
```

#### 6.8.3 Exportación PDF de evaluación

El instructor puede exportar la evaluación como PDF (usa la infraestructura `expo-print` ya existente) con:
- Encabezado: nombre de la escuela (configurable en Settings), nombre del instructor, fecha.
- Tabla de vuelos: fecha, ruta/sitio, aeronave, calificación.
- Notas por vuelo (si las hay).
- Resumen global.
- Pie: "Generado con PilotLog".

#### 6.8.4 Configuración nueva (Settings)

- **Nombre de la escuela / institución** — campo de texto libre, visible solo si `license_type = instructor`. Se incluye en el encabezado del PDF y en el archivo de evaluación.

#### 6.8.5 Límites del módulo (no incluido)

- No hay comunicación en tiempo real entre instructor y estudiante.
- No hay autenticación por institución — la identidad se basa en el perfil local.
- No hay escala de calificaciones numérica — solo 3 estados cualitativos.
- No soporta adjuntos (audio, video, fotos) en la evaluación.
- La firma digital del instructor sigue en el backlog (§5 fuera de alcance V1).

---

## 7. Arquitectura técnica

### Stack (confirmado)

| Categoría | Tecnología |
|---|---|
| Framework | React Native 0.81.5 con **Expo SDK 54** (managed workflow) |
| Lenguaje | TypeScript 5.9.2 (modo estricto) |
| Navegación | **Expo Router 6** (file-based routing) |
| Estado UI/sesión | **Zustand 5** |
| Datos remotos | **TanStack Query 5** (React Query) |
| Persistencia — config/perfil | **Expo SecureStore** (keychain/keystore nativo) |
| Persistencia — datos relacionales | **Expo SQLite** (modo WAL; bitácora, checklists, cache METAR) |
| Formularios | **React Hook Form 7 + Zod 3** |
| Fechas | **date-fns 3** (locale es-CO / en-US / pt-BR) |
| UI / estilos | **NativeWind 4** (Tailwind CSS para React Native) |
| Iconografía | **Lucide React Native 0.454** |
| Animaciones | react-native-reanimated 4 |
| Localización GPS | `expo-location` |
| Notificaciones locales | `expo-notifications` (framework listo; lógica Kp pendiente) |
| Exportar / compartir | `expo-sharing` + `expo-file-system` + `expo-print` |
| Importar | `expo-document-picker` |
| i18n | **i18next 26 + react-i18next 17** (es / en / pt-BR) |

### APIs externas

| Servicio | URL base | Auth | Uso |
|---|---|---|---|
| Aviation Weather Center (NOAA) | `https://aviationweather.gov/api/data/` | No | METAR formato JSON |
| NOAA SWPC | `https://services.swpc.noaa.gov/json/` | No | Kp actual + pronóstico 3 días |
| Google Maps Geocoding | `https://maps.googleapis.com/maps/api/geocode/json` | Key | Geocodificación inversa UAS |
| Google Static Maps | `https://maps.googleapis.com/maps/api/staticmap` | Key | Mapa en detalle de vuelo |
| Wikipedia API | `https://en.wikipedia.org/w/api.php` | No | Imagen y datos de modelo drone |
| Amazon (scrape) | `https://www.amazon.com.co/s?k=...` | No | Imagen fallback drone |

### Backend
**V1 — no backend.** Toda la data vive local en el dispositivo del piloto.

**V2 — backend opcional (Supabase):** sincronización event-sourced entre dispositivos.

### Diagrama de capas (simplificado)
```
┌────────────────────────────────────────────────────────────────────┐
│  UI (Expo Router screens + NativeWind)                             │
│  app/index · app/auth/ · app/(tabs)/ · app/checklist/ · app/flight/│
├────────────────────────────────────────────────────────────────────┤
│  Hooks (useMetar, useKp, useFlights, …)                            │
├────────────────────────────────────────────────────────────────────┤
│  Estado: Zustand (authStore, favoritesStore, localeStore,          │
│          sessionStore) + TanStack Query (METAR, Kp)                │
├────────────────────────────────────────────────────────────────────┤
│  Servicios:                                                        │
│   - api/awc.ts (METAR — aviationweather.gov)                       │
│   - api/swpc.ts (Kp — services.swpc.noaa.gov)                      │
│   - Google Maps Geocoding API (geocodificación inversa UAS)        │
│   - Google Static Maps API (mapa en detalle de vuelo)              │
│   - db/flights.ts + db/checklists.ts + db/metarCache.ts (SQLite)   │
│   - utils/drones.ts (Wikipedia + Amazon)                           │
│   - utils/flightIO.ts (JSON/CSV/PDF)                               │
└────────────────────────────────────────────────────────────────────┘
```

### Zustand stores

| Store | Estado | Persistencia |
|---|---|---|
| `authStore` | profile, isLoaded | Expo SecureStore |
| `favoritesStore` | FavoriteEntry[] | Expo SecureStore (2 KB fallback) |
| `localeStore` | preference (system/es/en/pt), isLoaded | Expo SecureStore |
| `sessionStore` | lastViewedMetars, pendingExecutionId | In-memory (no persiste) |

---

## 8. Modelo de datos

```
aircraft
  id, registration, type, engine_type, multi_engine, created_at

metar_snapshot
  id, icao, raw_text, parsed_json, observed_at, fetched_at
  INDEX: icao, fetched_at DESC

app_settings
  key, value

checklist
  id, name, description, is_template, parent_template_id, created_at

checklist_section
  id, checklist_id FK, sort_order, title

checklist_item
  id, section_id FK, sort_order, title, description, required, item_type

checklist_execution
  id, checklist_id, checklist_name, started_at, completed_at, linked_flight_id

checklist_item_result
  id, execution_id FK, item_id, status (ok|na|skipped|pending),
  note, value, timestamp

flight
  id, date, flight_type ('manned'|'uas'), created_at
  -- Manned --
  aircraft_id, aircraft_registration, origin_icao, destination_icao,
  block_out, block_in, total_time, night_time, ifr_time, sim_ifr_time, vfr_time,
  pic_time, sic_time, dual_time, solo_time, instructor_time,
  landings_day, landings_night, approaches_count,
  role (PIC|SIC|dual|solo|instructor|operador|observador)
  -- UAS --
  site, lat, lng, vlos, max_altitude_ft, max_distance_m, mission_type
  -- Both --
  origin_metar_id FK, dest_metar_id FK, notes
  INDEX: date DESC

portfolio
  id TEXT PK
  direction TEXT                -- 'sent' | 'received'
  student_name TEXT
  student_license_type TEXT
  period_start TEXT             -- yyyy-MM-dd
  period_end TEXT
  flight_count INTEGER
  created_at TEXT               -- ISO timestamp (cuando se importó o generó)
  status TEXT DEFAULT 'pending' -- 'pending' | 'in_review' | 'evaluated' | 'returned'
  data TEXT                     -- JSON blob: snapshot inmutable de vuelos + checklists
  evaluations TEXT DEFAULT '{}'  -- JSON: evaluaciones keyed por flight_id (instructor)

evaluation_receipt
  id TEXT PK
  portfolio_exported_at TEXT    -- ISO timestamp del portafolio original (clave de vínculo)
  instructor_name TEXT
  instructor_school TEXT
  evaluated_at TEXT
  data TEXT                     -- JSON blob completo del archivo .pilotlog-eval
```

---

## 9. Diseño / UX — flujos clave

### 9.1 Onboarding (primer uso)
1. **Disclaimer** → acepta.
2. **Signup paso 1** → nombre + tipo de licencia.
3. **Signup paso 2** → PIN opcional.
4. → Home.

### 9.2 Acceso recurrente (con PIN)
1. Splash verifica perfil.
2. Teclado PIN con dots; shake + vibración en PIN incorrecto.
3. → Home.

### 9.3 Home
- Saludo + badge Kp + stats + favoritos METAR + atajos.

### 9.4 Flujo vuelo tripulado (happy path)
1. "Nuevo vuelo" (tipo Tripulado) → formulario ruta/aeronave/tiempos.
2. Guardar → aparece en Bitácora con estadísticas actualizadas.
3. (Opcional) "Pre-vuelo" → ejecutar checklist → vincular al vuelo.

### 9.5 Flujo operación UAS (happy path)
1. "Nuevo vuelo" → toggle a "UAS / Drone".
2. Tap "Capturar ubicación GPS" → coordenadas obtenidas → campo Zona completado automáticamente con dirección desde Google Maps (si `EXPO_PUBLIC_GOOGLE_MAPS_KEY` configurada).
3. Completar: drone ID, modelo, tiempos, altitud, misión.
4. Guardar → detalle muestra mapa del sitio + tarjeta de imagen del drone.

### 9.6 Flujo solo consulta meteo
1. Tab METAR → buscar aeropuerto → MetarCard con decodificación.
2. Sin obligación de crear vuelo.

### 9.7 Flujo escuela — estudiante envía portafolio (happy path)
1. Hub Escuela → "Crear portafolio" → selector de fechas.
2. Preview: lista de vuelos incluidos + checklists vinculados.
3. "Generar y compartir" → share sheet → WhatsApp / email al instructor.

### 9.8 Flujo escuela — instructor evalúa y devuelve (happy path)
1. Recibe `.pilotlog` → "Abrir con PilotLog" → aparece en lista de portafolios.
2. Abre portafolio → lista de vuelos → tap en vuelo → formulario de evaluación.
3. Selecciona calificación + escribe notas → "Guardar".
4. Repite para cada vuelo → agrega resumen global → "Exportar evaluación" → share sheet.

### Principios de diseño
- **Legible bajo sol** — contraste alto, fuentes grandes en pantallas operativas.
- **Modo oscuro nativo** — respeta preferencia del sistema; útil en cabina nocturna.
- **Pocos taps por acción crítica** — abrir un checklist favorito ≤ 2 taps desde launcher.
- **Sin diálogos modales bloqueantes en flujos operativos.**
- **Degradación elegante offline** — si falta red o API key, el flujo continúa sin error visible.

---

## 10. Requisitos no funcionales

| Categoría | Requisito |
|---|---|
| Plataforma | iOS 15+, Android 8 (API 26)+ |
| Idiomas | Español, inglés, portugués (BR); detección automática del sistema |
| Performance | Apertura en frío < 2s en Pixel 6a / iPhone 12 |
| Offline | Checklists, bitácora y cache METAR funcionan sin red; geocodificación falla silenciosamente |
| Privacidad | Bitácora del usuario nunca abandona el dispositivo en V1 sin opt-in explícito |
| Accesibilidad | Soporte Dynamic Type / escalado de fuente, contraste WCAG AA |
| Telemetría | Solo crash reports (Sentry) y eventos anónimos. Sin tracking publicitario. |
| Seguridad | Perfil y PIN en Expo SecureStore (keychain/keystore). SQLite sin cifrado en V1; SQLCipher evaluable en V2. |
| Disclaimer regulatorio | Pantalla de bienvenida indica: "Esta app es una ayuda. No reemplaza fuentes oficiales ni instrumentos certificados." |

---

## 11. Roadmap

### Hito 0 — Kickoff ✅ completado
- Stack: NativeWind, Expo SQLite, Expo Router.
- Setup repo.

### Hito 1 — MVP cerrado ✅ completado
- Onboarding: disclaimer + perfil + PIN.
- Módulo METAR con favoritos, autocompletado, decodificación en español, cache offline.
- Módulo Kp con gauge, gráfico 24h, pronóstico 3 días, análisis de impacto.
- Editor + ejecución de checklists (plantillas precargadas + editor propio).
- Bitácora tripulada con CRUD, cálculo automático de tiempo, estadísticas.
- Bitácora UAS con GPS, VLOS, altitud, distancia, misión.
- Vinculación vuelo ↔ checklists ejecutados.
- Detalle de vuelo con mapa estático Google Maps.
- Drone model: imagen Wikipedia → Amazon + enlace fabricante.
- Exportación JSON / CSV / PDF + importación con deduplicación.
- Configuración de idioma (es/en/pt).

### Hito 2 — Beta privada ✅ en curso
- Geocodificación inversa para zona de operación UAS via Google Maps API — **implementado**.
- 5-10 pilotos beta-testers.
- Snapshot METAR automático al registrar vuelo (si se consultó METAR previo).
- Notificaciones locales Kp ≥ 5 — **pendiente**.

### Hito 3 — V1 pública
- Notificaciones Kp ≥ 5.
- App Store + Google Play release.

### Hito 4 — Módulo Escuela de Vuelo
- Hub de escuela con detección de rol por `license_type`.
- Flujo estudiante: crear portafolio → seleccionar vuelos → share sheet.
- Flujo instructor: importar portafolio → evaluar vuelo por vuelo → exportar evaluación.
- Flujo estudiante: importar evaluación → badges en bitácora → sección en detalle de vuelo.
- Exportación PDF de evaluación (instructor).
- Campo "Nombre de escuela" en Settings (solo rol instructor).
- Nuevas tablas `portfolio` y `evaluation_receipt` en SQLite.
- Soporte para "Abrir con PilotLog" en archivos `.pilotlog` y `.pilotlog-eval`.
- Monetización: módulo incluido en tier Pro (o licencia B2B por escuela).

### Post V1 (backlog priorizable)
- Sincronización en la nube (Supabase).
- TAF, SIGMET, AIRMET.
- Cálculo de peso y balance por aeronave.
- Firma digital de instructor.
- Modo "tablet" (layout iPad / tablet Android).
- Autocompletado METAR con aeropuertos globales.
- Compartir checklist custom entre usuarios.
- Licencias B2B para escuelas de vuelo (Hito 5+).

---

## 12. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| API NOAA cambia formato | Media | Alto | Capa de abstracción `MetarProvider`; 2 proveedores listos |
| `EXPO_PUBLIC_GOOGLE_MAPS_KEY` no configurada por el usuario | Alta | Bajo | Geocodificación falla silenciosamente; mapa estático no se muestra; flujo continúa sin error |
| Wikipedia / Amazon sin imagen del drone | Media | Bajo | Fallback a texto (fabricante + modelo); UI maneja el estado vacío |
| Usuario espera certificación EFB | Baja | Alto | Disclaimer explícito; positioning como "asistente personal" |
| Pérdida de bitácora si solo es local | Media | Muy alto | Export manual JSON/CSV; sincronización Supabase en V2 |
| Adopción lenta por mercado nicho | Alta | Medio | Foco inicial en escuelas de vuelo y operadores UAS en Colombia |

---

## 13. Cumplimiento y consideraciones legales

- **No es un EFB certificado.** Disclaimer obligatorio en onboarding y en pantalla de METAR.
- **Datos meteorológicos** provienen de fuentes oficiales (NOAA), pero el uso operacional es responsabilidad del piloto.
- **Bitácora.** Si el usuario quiere usarla como bitácora legal ante la Aerocivil Colombia, debe verificar con su autoridad la aceptación del formato exportado.
- **Privacidad.** Toda la información del piloto en V1 es local al dispositivo. Google Maps API recibe las coordenadas GPS del usuario para geocodificación; esto debe documentarse en la política de privacidad.
- **Operaciones UAS / UAEAC.** La app no certifica el cumplimiento regulatorio de las operaciones. Es una herramienta de registro; el operador es responsable de cumplir la regulación vigente.

---

## 14. Preguntas abiertas

1. ¿Qué modelo de monetización post-V1? (freemium con bitácora ilimitada gratis y exportación PDF premium).
2. ¿Empaquetar plantillas de checklist por aeronave certificada con respaldo del POH oficial?
3. ¿Integración con `meteorologia.aerocivil.gov.co` para datos regionales en V2?
4. ~~¿Multi-perfil (piloto + instructor) en V1 o V2?~~ → **Hito 4**: detección de rol via `license_type` existente; sin registro separado. Ver §6.8.
5. ¿Usar Google Places Autocomplete en el campo "Zona" UAS en lugar de solo geocodificación inversa? Permitiría buscar por nombre de lugar sin necesidad de GPS.

> **Cerradas:**
> - ~~¿NativeWind o Tamagui?~~ → **NativeWind** seleccionado.
> - ~~¿SQLite o WatermelonDB?~~ → **Expo SQLite** seleccionado.
> - ~~¿React Navigation o Expo Router?~~ → **Expo Router** seleccionado.
> - ~~¿Exportar CSV/PDF?~~ → **JSON + CSV + PDF** todos implementados.
> - ~~¿Soporte UAS en V1?~~ → **Sí**, módulo UAS completo implementado.

---

## 15. Anexo A — formato METAR de referencia

```
SKBO 271200Z 09010KT 9999 SCT025 BKN080 18/12 Q1024 NOSIG=
```

- `SKBO` — Aeropuerto El Dorado, Bogotá.
- `271200Z` — Día 27, 12:00 UTC.
- `09010KT` — Viento de 090° a 10 nudos.
- `9999` — Visibilidad ≥ 10 km.
- `SCT025 BKN080` — Nubes dispersas a 2500 ft, fragmentadas a 8000 ft.
- `18/12` — Temperatura 18°C, punto de rocío 12°C.
- `Q1024` — QNH 1024 hPa.
- `NOSIG` — Sin cambios significativos previstos.

---

## 16. Anexo B — campos de exportación de bitácora (34 columnas)

`id · date · type · origin · destination · site · lat · lng · registration · aircraft_type · block_out · block_in · total_time · night_time · ifr_time · sim_ifr_time · vfr_time · pic_time · sic_time · dual_time · solo_time · instructor_time · landings_day · landings_night · approaches_count · role · vlos · max_altitude_ft · max_distance_m · mission_type · origin_metar · dest_metar · checklist_executions · notes`

---

*Documento actualizado al 2 de junio de 2026 — v4.0. Hito 1 completado. Hito 2 en curso: geocodificación UAS implementada; notificaciones Kp pendientes. Hito 4 especificado: Módulo Escuela de Vuelo (portafolio offline instructor ↔ estudiante).*
