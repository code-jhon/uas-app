import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('pilotlog.db');
  await runMigrations(db);
  return db;
}

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`PRAGMA journal_mode = WAL;`);
  // Enable foreign key enforcement so ON DELETE CASCADE actually runs.
  // SQLite applies this per-connection and it must be set outside any
  // transaction. getDatabase() reuses a single connection, so setting it
  // here at startup covers every subsequent operation. (PAR-14)
  await db.execAsync(`PRAGMA foreign_keys = ON;`);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS aircraft (
      id TEXT PRIMARY KEY,
      registration TEXT NOT NULL,
      type TEXT NOT NULL,
      engine_type TEXT NOT NULL DEFAULT 'piston',
      multi_engine INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS metar_snapshot (
      id TEXT PRIMARY KEY,
      icao TEXT NOT NULL,
      raw_text TEXT NOT NULL,
      parsed_json TEXT NOT NULL,
      observed_at TEXT NOT NULL,
      fetched_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_metar_icao ON metar_snapshot(icao);
    CREATE INDEX IF NOT EXISTS idx_metar_fetched ON metar_snapshot(fetched_at DESC);

    CREATE TABLE IF NOT EXISTS checklist (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      is_template INTEGER NOT NULL DEFAULT 0,
      parent_template_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS checklist_section (
      id TEXT PRIMARY KEY,
      checklist_id TEXT NOT NULL REFERENCES checklist(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL,
      title TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS checklist_item (
      id TEXT PRIMARY KEY,
      section_id TEXT NOT NULL REFERENCES checklist_section(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      required INTEGER NOT NULL DEFAULT 1,
      item_type TEXT NOT NULL DEFAULT 'check'
    );

    CREATE TABLE IF NOT EXISTS checklist_execution (
      id TEXT PRIMARY KEY,
      checklist_id TEXT NOT NULL,
      checklist_name TEXT NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      linked_flight_id TEXT
    );

    CREATE TABLE IF NOT EXISTS checklist_item_result (
      id TEXT PRIMARY KEY,
      execution_id TEXT NOT NULL REFERENCES checklist_execution(id) ON DELETE CASCADE,
      item_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      note TEXT,
      value TEXT,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS flight (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      aircraft_id TEXT,
      aircraft_registration TEXT,
      origin_icao TEXT NOT NULL,
      destination_icao TEXT NOT NULL,
      block_out TEXT,
      block_in TEXT,
      total_time REAL,
      night_time REAL,
      ifr_time REAL,
      sim_ifr_time REAL,
      vfr_time REAL,
      pic_time REAL,
      sic_time REAL,
      dual_time REAL,
      solo_time REAL,
      instructor_time REAL,
      landings_day INTEGER,
      landings_night INTEGER,
      approaches_count INTEGER,
      role TEXT NOT NULL DEFAULT 'PIC',
      origin_metar_id TEXT,
      dest_metar_id TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_flight_date ON flight(date DESC);

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Migrations v2-v3: UAS columns on flight table (safe to run multiple times)
  const uasAlters = [
    `ALTER TABLE flight ADD COLUMN flight_type TEXT NOT NULL DEFAULT 'manned'`,
    `ALTER TABLE flight ADD COLUMN site TEXT`,
    `ALTER TABLE flight ADD COLUMN vlos INTEGER DEFAULT 1`,
    `ALTER TABLE flight ADD COLUMN max_altitude_ft INTEGER`,
    `ALTER TABLE flight ADD COLUMN max_distance_m INTEGER`,
    `ALTER TABLE flight ADD COLUMN mission_type TEXT`,
    `ALTER TABLE flight ADD COLUMN lat REAL`,
    `ALTER TABLE flight ADD COLUMN lng REAL`,
  ];
  for (const sql of uasAlters) {
    try { await db.runAsync(sql); } catch { /* column already exists – ignore */ }
  }

  // Cleanup of pre-existing orphan rows left behind while foreign_keys was
  // off (before PAR-14). Deleted top-down within the checklist tree
  // (section before item) so that items orphaned only because their parent
  // section is itself an orphan get removed in the SAME pass — otherwise the
  // item's section still "exists" when we check it and survives until the
  // next startup. The item_result tree is independent (execution has no FK).
  // Idempotent: DELETE ... NOT IN is safe to re-run on every startup.
  await db.execAsync(`
    DELETE FROM checklist_item_result
      WHERE execution_id NOT IN (SELECT id FROM checklist_execution);
    DELETE FROM checklist_section
      WHERE checklist_id NOT IN (SELECT id FROM checklist);
    DELETE FROM checklist_item
      WHERE section_id NOT IN (SELECT id FROM checklist_section);
  `);

  // Seed manned templates on first run
  const count = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM checklist WHERE is_template = 1`
  );
  if (count?.c === 0) {
    await seedTemplates(db);
  }

  // Seed drone template if missing (runs on every version upgrade)
  const droneCount = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) as c FROM checklist WHERE is_template = 1 AND name LIKE '%Drone%'`
  );
  if (droneCount?.c === 0) {
    await seedDroneTemplate(db);
  }
}

async function seedTemplates(db: SQLite.SQLiteDatabase): Promise<void> {
  const { randomUUID } = await import('../utils/uuid');

  const templates: Array<{
    name: string;
    description: string;
    sections: Array<{ title: string; items: Array<{ title: string; description?: string; required?: boolean }> }>;
  }> = [
    {
      name: 'Cessna 172 — Pre-vuelo VFR diurno',
      description: 'Inspección pre-vuelo estándar para Cessna 172 en condiciones VFR diurnas',
      sections: [
        {
          title: 'Documentación',
          items: [
            { title: 'Licencia de piloto', description: 'Vigente y en posesión' },
            { title: 'Certificado médico', description: 'Vigente' },
            { title: 'Certificado de aeronavegabilidad', description: 'A bordo' },
            { title: 'Matrícula de la aeronave', description: 'A bordo' },
            { title: 'Manual de vuelo (POH)', description: 'A bordo' },
            { title: 'Póliza de seguros', description: 'Vigente' },
          ],
        },
        {
          title: 'Inspección exterior',
          items: [
            { title: 'Nivel de combustible', description: 'Verificar visualmente en los tanques' },
            { title: 'Calidad del combustible', description: 'Sin agua ni contaminantes (drenar muestra)' },
            { title: 'Nivel de aceite', description: 'Mínimo 6 qt, máximo 8 qt' },
            { title: 'Tubo de Pitot — libre de obstrucciones' },
            { title: 'Superficies de control — sin daños ni juego excesivo' },
            { title: 'Neumáticos — sin cortes, presión adecuada' },
            { title: 'Luces — funcionales (nav, beacon, aterrizaje)' },
            { title: 'Calzos y amarres — retirados' },
            { title: 'Tapas de combustible — aseguradas' },
          ],
        },
        {
          title: 'Cabina',
          items: [
            { title: 'Cinturones — estado y funcionamiento' },
            { title: 'Frenos de estacionamiento — puestos' },
            { title: 'Instrumentos — relojes, altímetro ajustado al QNH' },
            { title: 'Radio y transpondedor — funcionales' },
            { title: 'GPS / aviónica — encendidos y actualizados' },
            { title: 'Extintor — presente y cargado' },
            { title: 'Botiquín — presente' },
          ],
        },
        {
          title: 'Antes del arranque',
          items: [
            { title: 'Área libre de obstáculos' },
            { title: 'Mezcla — rica' },
            { title: 'Cebado del motor según temperatura' },
            { title: 'Luces — encendidas (beacon antes de arranque)' },
          ],
        },
      ],
    },
    {
      name: 'Cessna 172 — Post-vuelo',
      description: 'Procedimiento de apagado y aseguramiento tras el vuelo',
      sections: [
        {
          title: 'Apagado del motor',
          items: [
            { title: 'Aviónica — apagada antes de apagar el master' },
            { title: 'Mezcla — cortada (idle cut-off)' },
            { title: 'Magnetos — apagados (OFF)' },
            { title: 'Master switch — apagado' },
          ],
        },
        {
          title: 'Aseguramiento',
          items: [
            { title: 'Frenos de estacionamiento — puestos' },
            { title: 'Calzos — colocados' },
            { title: 'Cubierta de pitot — colocada' },
            { title: 'Superficies de control — bloqueadas si aplica' },
            { title: 'Amarres — ajustados' },
            { title: 'Nivel de combustible — registrado para siguiente vuelo' },
            { title: 'Novedades técnicas — reportadas al mantenimiento si las hay' },
          ],
        },
      ],
    },
    {
      name: 'Genérico — Documentación y planeación',
      description: 'Verificación de documentación y planificación antes de cualquier vuelo VFR',
      sections: [
        {
          title: 'Documentación personal',
          items: [
            { title: 'Licencia de piloto vigente' },
            { title: 'Certificado médico vigente' },
            { title: 'Habilitaciones requeridas vigentes' },
          ],
        },
        {
          title: 'Documentación de la aeronave',
          items: [
            { title: 'Certificado de aeronavegabilidad' },
            { title: 'Matrícula' },
            { title: 'Manual de vuelo (POH/AFM)' },
            { title: 'Bitácora de mantenimiento al día', description: 'Revisión anual vigente' },
          ],
        },
        {
          title: 'Planificación del vuelo',
          items: [
            { title: 'METAR / TAF consultado', description: 'Condiciones VFR confirmadas' },
            { title: 'NOTAMs revisados para la ruta' },
            { title: 'Combustible calculado + reserva mínima 45 min' },
            { title: 'Plan de vuelo presentado (si requerido)' },
            { title: 'Alternos identificados' },
          ],
        },
      ],
    },
    {
      name: 'Genérico — Aseguramiento de aeronave',
      description: 'Procedimiento de aseguramiento post-vuelo para cualquier aeronave',
      sections: [
        {
          title: 'Aseguramiento',
          items: [
            { title: 'Equipos y aviónica — apagados' },
            { title: 'Combustible — tapas aseguradas' },
            { title: 'Superficies — bloqueadas o aseguradas' },
            { title: 'Amarre — ajustado a 3 puntos' },
            { title: 'Calzos — colocados' },
            { title: 'Cubierta — instalada si corresponde' },
            { title: 'Aeronave cerrada con llave' },
          ],
        },
      ],
    },
  ];

  for (const tmpl of templates) {
    const clId = randomUUID();
    await db.runAsync(
      `INSERT INTO checklist (id, name, description, is_template, created_at) VALUES (?, ?, ?, 1, ?)`,
      [clId, tmpl.name, tmpl.description, new Date().toISOString()]
    );
    for (let si = 0; si < tmpl.sections.length; si++) {
      const sec = tmpl.sections[si];
      const secId = randomUUID();
      await db.runAsync(
        `INSERT INTO checklist_section (id, checklist_id, sort_order, title) VALUES (?, ?, ?, ?)`,
        [secId, clId, si, sec.title]
      );
      for (let ii = 0; ii < sec.items.length; ii++) {
        const item = sec.items[ii];
        await db.runAsync(
          `INSERT INTO checklist_item (id, section_id, sort_order, title, description, required, item_type) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [randomUUID(), secId, ii, item.title, item.description ?? null, item.required !== false ? 1 : 0, 'check']
        );
      }
    }
  }
}

async function seedDroneTemplate(db: SQLite.SQLiteDatabase): Promise<void> {
  const { randomUUID } = await import('../utils/uuid');

  const tmpl = {
    name: 'Drone / UAS — Pre-vuelo RPAS',
    description: 'Checklist pre-operación para sistemas de aeronaves no tripuladas (drones/RPAS) según normativa colombiana UAEAC',
    sections: [
      {
        title: 'Documentación y autorización',
        items: [
          { title: 'Licencia/certificado RPAS de la UAEAC vigente' },
          { title: 'Autorización de operación en el espacio aéreo', description: 'Verificar en app Airspace o DroneTag' },
          { title: 'Seguro de responsabilidad civil vigente' },
          { title: 'Permiso del propietario del terreno', description: 'Carta o comunicado escrito' },
          { title: 'Plan de vuelo notificado a la UAEAC (si aplica)' },
          { title: 'NOTAMs del área revisados' },
          { title: 'Registro de la aeronave RPAS vigente' },
        ],
      },
      {
        title: 'Hardware y equipo',
        items: [
          { title: 'Batería principal — carga ≥ 80%, sin hinchamiento ni daños físicos' },
          { title: 'Baterías de reserva — disponibles y cargadas' },
          { title: 'Control remoto (RC) — batería cargada y funcional' },
          { title: 'Dispositivo de tierra (tablet/móvil) — cargado, app actualizada' },
          { title: 'Hélices — sin grietas, bien fijadas y apretadas en sentido correcto' },
          { title: 'Motores — sin obstrucciones, giro libre sin resistencia' },
          { title: 'Frame/chasis — sin fisuras, tornillos asegurados' },
          { title: 'Cámara / payload — fija, limpia, tarjeta SD formateada' },
          { title: 'Tren de aterrizaje / dampers — íntegros' },
          { title: 'Antenas RC y telemetría — no dañadas, orientadas correctamente' },
        ],
      },
      {
        title: 'Verificación de sistemas',
        items: [
          { title: 'Calibración de IMU — confirmada o ejecutada si requiere' },
          { title: 'Calibración de brújula — confirmada (alejado de metal y EMI)' },
          { title: 'Señal GPS — adquirida (mínimo 8 satélites, HDOP < 1.5)' },
          { title: 'Punto RTH (Return to Home) — configurado correctamente' },
          { title: 'Fail-safe de batería baja — configurado' },
          { title: 'Fail-safe de pérdida de señal RC — configurado' },
          { title: 'GEO Fence / límite de altitud — activado', description: 'Máximo según autorización y VLOS' },
          { title: 'Enlace RC — bindeado y estable, sin interferencias' },
          { title: 'Modo de vuelo — confirmado (GPS/ATTI según operación)' },
          { title: 'Video downlink / FPV — imagen limpia y sin latencia excesiva' },
        ],
      },
      {
        title: 'Entorno operacional',
        items: [
          { title: 'Área de despegue — libre de obstáculos en radio de 5 m' },
          { title: 'Viento — dentro de los límites del fabricante', description: 'Medir con anemómetro si disponible' },
          { title: 'Condiciones meteorológicas — sin lluvia, niebla ni visibilidad reducida' },
          { title: 'METAR del aeródromo más cercano consultado' },
          { title: 'Espacio aéreo — verificado (sin TFR, CTR ni restricciones temporales)' },
          { title: 'Personas no participantes — fuera del área de seguridad' },
          { title: 'Observador visual (VO) — designado y en posición', required: false },
          { title: 'Comunicación con observador — establecida y probada', required: false },
        ],
      },
      {
        title: 'Post-vuelo',
        items: [
          { title: 'Motores completamente detenidos antes de aproximarse a la aeronave' },
          { title: 'Batería extraída y revisada — temperatura, sin hinchamiento' },
          { title: 'Batería almacenada correctamente (30-60% si > 24h sin uso)' },
          { title: 'Datos de vuelo descargados y respaldados' },
          { title: 'Video / imágenes verificadas' },
          { title: 'Hélices, motores y frame revisados por daños post-vuelo' },
          { title: 'Novedades técnicas anotadas en la bitácora' },
          { title: 'Equipo guardado y protegido' },
        ],
      },
    ],
  };

  const clId = randomUUID();
  await db.runAsync(
    `INSERT INTO checklist (id, name, description, is_template, created_at) VALUES (?, ?, ?, 1, ?)`,
    [clId, tmpl.name, tmpl.description, new Date().toISOString()]
  );
  for (let si = 0; si < tmpl.sections.length; si++) {
    const sec = tmpl.sections[si];
    const secId = randomUUID();
    await db.runAsync(
      `INSERT INTO checklist_section (id, checklist_id, sort_order, title) VALUES (?, ?, ?, ?)`,
      [secId, clId, si, sec.title]
    );
    for (let ii = 0; ii < sec.items.length; ii++) {
      const item = sec.items[ii];
      await db.runAsync(
        `INSERT INTO checklist_item (id, section_id, sort_order, title, description, required, item_type) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [randomUUID(), secId, ii, item.title, item.description ?? null, item.required !== false ? 1 : 0, 'check']
      );
    }
  }
}
