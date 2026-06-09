import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as DocumentPicker from 'expo-document-picker';
import { format, parseISO } from 'date-fns';
import { Flight, FlightRole, FlightType } from '../types';
import { randomUUID } from './uuid';
import i18n from '../i18n';
import { getDateLocale } from '../i18n/dateLocale';

const t = (key: string, opts?: Record<string, unknown>) => i18n.t(key, opts) as string;

// ─── Field schema ───────────────────────────────────────────────────────────
// Single source of truth for JSON/CSV column order and types.

type FieldType = 'string' | 'number' | 'boolean';

interface FieldDef {
  key: keyof Flight;
  header: string;
  type: FieldType;
}

const FIELDS: FieldDef[] = [
  { key: 'id', header: 'id', type: 'string' },
  { key: 'date', header: 'fecha', type: 'string' },
  { key: 'flightType', header: 'tipo_vuelo', type: 'string' },
  { key: 'aircraftId', header: 'aeronave_id', type: 'string' },
  { key: 'aircraftRegistration', header: 'matricula', type: 'string' },
  { key: 'originIcao', header: 'origen_icao', type: 'string' },
  { key: 'destinationIcao', header: 'destino_icao', type: 'string' },
  { key: 'blockOut', header: 'bloque_salida', type: 'string' },
  { key: 'blockIn', header: 'bloque_llegada', type: 'string' },
  { key: 'totalTime', header: 'tiempo_total', type: 'number' },
  { key: 'nightTime', header: 'tiempo_nocturno', type: 'number' },
  { key: 'ifrTime', header: 'tiempo_ifr', type: 'number' },
  { key: 'simIfrTime', header: 'tiempo_ifr_sim', type: 'number' },
  { key: 'vfrTime', header: 'tiempo_vfr', type: 'number' },
  { key: 'picTime', header: 'tiempo_pic', type: 'number' },
  { key: 'sicTime', header: 'tiempo_sic', type: 'number' },
  { key: 'dualTime', header: 'tiempo_dual', type: 'number' },
  { key: 'soloTime', header: 'tiempo_solo', type: 'number' },
  { key: 'instructorTime', header: 'tiempo_instructor', type: 'number' },
  { key: 'landingsDay', header: 'aterrizajes_dia', type: 'number' },
  { key: 'landingsNight', header: 'aterrizajes_noche', type: 'number' },
  { key: 'approachesCount', header: 'aproximaciones', type: 'number' },
  { key: 'role', header: 'rol', type: 'string' },
  { key: 'originMetarId', header: 'origen_metar_id', type: 'string' },
  { key: 'destMetarId', header: 'destino_metar_id', type: 'string' },
  { key: 'site', header: 'sitio', type: 'string' },
  { key: 'lat', header: 'lat', type: 'number' },
  { key: 'lng', header: 'lng', type: 'number' },
  { key: 'vlos', header: 'vlos', type: 'boolean' },
  { key: 'maxAltitudeFt', header: 'alt_max_ft', type: 'number' },
  { key: 'maxDistanceM', header: 'dist_max_m', type: 'number' },
  { key: 'missionType', header: 'tipo_mision', type: 'string' },
  { key: 'notes', header: 'notas', type: 'string' },
  { key: 'createdAt', header: 'creado_en', type: 'string' },
];

export type ExportFormat = 'json' | 'csv' | 'pdf';

// ─── Helpers ────────────────────────────────────────────────────────────────

function timestampName(): string {
  return format(new Date(), 'yyyy-MM-dd_HHmm');
}

function fmtDate(d: string): string {
  try { return format(parseISO(d), 'd MMM yyyy', { locale: getDateLocale() }); }
  catch { return d; }
}

async function writeAndShare(
  filename: string,
  content: string,
  mimeType: string,
  dialogTitle: string,
  encoding: FileSystem.EncodingType = FileSystem.EncodingType.UTF8,
): Promise<void> {
  const uri = FileSystem.cacheDirectory + filename;
  await FileSystem.writeAsStringAsync(uri, content, { encoding });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType, dialogTitle, UTI: undefined });
  }
}

// ─── JSON ─────────────────────────────────────────────────────────────────

function buildJson(flights: Flight[]): string {
  return JSON.stringify(
    {
      app: 'PilotLog',
      schema: 'flights',
      version: 1,
      exportedAt: new Date().toISOString(),
      count: flights.length,
      flights,
    },
    null,
    2,
  );
}

// ─── CSV ─────────────────────────────────────────────────────────────────

function csvEscape(value: string): string {
  // Quote when the value contains a delimiter, quote, or newline.
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function cellToString(f: Flight, def: FieldDef): string {
  const v = f[def.key];
  if (v === undefined || v === null) return '';
  if (def.type === 'boolean') return v ? 'true' : 'false';
  return String(v);
}

function buildCsv(flights: Flight[]): string {
  const header = FIELDS.map((d) => d.header).join(',');
  const rows = flights.map((f) =>
    FIELDS.map((d) => csvEscape(cellToString(f, d))).join(','),
  );
  // Prepend BOM so Excel opens UTF-8 correctly.
  return '﻿' + [header, ...rows].join('\r\n');
}

/** Parse a single CSV line respecting quoted fields. */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else cur += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { out.push(cur); cur = ''; }
      else cur += ch;
    }
  }
  out.push(cur);
  return out;
}

// ─── PDF (via HTML) ───────────────────────────────────────────────────────

function htmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildHtml(flights: Flight[]): string {
  const totalHours = flights.reduce((s, f) => s + (f.totalTime ?? 0), 0);
  const manned = flights.filter((f) => f.flightType !== 'uas').length;
  const uas = flights.filter((f) => f.flightType === 'uas').length;

  const rows = flights
    .map((f) => {
      const isUAS = f.flightType === 'uas';
      const ruta = isUAS
        ? htmlEscape(f.site ?? 'UAS')
        : `${htmlEscape(f.originIcao)} → ${htmlEscape(f.destinationIcao)}`;
      return `
        <tr>
          <td>${fmtDate(f.date)}</td>
          <td><span class="badge ${isUAS ? 'uas' : 'manned'}">${isUAS ? t('doc.badgeUas') : t('doc.badgeManned')}</span></td>
          <td>${ruta}</td>
          <td>${htmlEscape(f.aircraftRegistration ?? '')}</td>
          <td>${htmlEscape(f.role ?? '')}</td>
          <td class="num">${f.totalTime != null ? f.totalTime.toFixed(1) : ''}</td>
          <td class="num">${f.landingsDay ?? ''}</td>
          <td class="num">${f.landingsNight ?? ''}</td>
        </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="${i18n.language}">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif; color: #0F1419; padding: 24px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .sub { color: #536471; font-size: 12px; margin-bottom: 16px; }
  .stats { display: flex; gap: 12px; margin-bottom: 20px; }
  .stat { border: 1px solid #E5E9EF; border-radius: 10px; padding: 10px 14px; flex: 1; text-align: center; }
  .stat .v { font-size: 18px; font-weight: 700; }
  .stat .l { font-size: 10px; color: #536471; text-transform: uppercase; letter-spacing: .5px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { text-align: left; background: #F5F7FA; padding: 8px 6px; border-bottom: 2px solid #E5E9EF; font-size: 10px; text-transform: uppercase; letter-spacing: .3px; color: #536471; }
  td { padding: 7px 6px; border-bottom: 1px solid #EEF1F5; }
  td.num, th.num { text-align: right; }
  .badge { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; }
  .badge.manned { background: #EFF6FF; color: #2563EB; }
  .badge.uas { background: #F5F3FF; color: #7C3AED; }
  .footer { margin-top: 18px; color: #8B98A5; font-size: 10px; }
</style>
</head>
<body>
  <h1>${t('doc.pdfTitle')}</h1>
  <div class="sub">${t('doc.pdfGenerated', { date: format(new Date(), "d MMMM yyyy, HH:mm", { locale: getDateLocale() }) })}</div>
  <div class="stats">
    <div class="stat"><div class="v">${totalHours.toFixed(1)}</div><div class="l">${t('doc.pdfTotalHours')}</div></div>
    <div class="stat"><div class="v">${flights.length}</div><div class="l">${t('doc.pdfRecords')}</div></div>
    <div class="stat"><div class="v">${manned}</div><div class="l">${t('doc.pdfManned')}</div></div>
    <div class="stat"><div class="v">${uas}</div><div class="l">${t('doc.pdfUas')}</div></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>${t('doc.thDate')}</th><th>${t('doc.thType')}</th><th>${t('doc.thRoute')}</th><th>${t('doc.thReg')}</th>
        <th>${t('doc.thRole')}</th><th class="num">${t('doc.thHours')}</th><th class="num">${t('doc.thLdgDay')}</th><th class="num">${t('doc.thLdgNight')}</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">${t('doc.pdfFooter', { count: flights.length })}</div>
</body>
</html>`;
}

// ─── Public: export ─────────────────────────────────────────────────────────

export async function exportFlights(
  flights: Flight[],
  fmt: ExportFormat,
): Promise<void> {
  const stamp = timestampName();

  if (fmt === 'json') {
    await writeAndShare(
      `bitacora_${stamp}.json`,
      buildJson(flights),
      'application/json',
      t('doc.dialogJson'),
    );
    return;
  }

  if (fmt === 'csv') {
    await writeAndShare(
      `bitacora_${stamp}.csv`,
      buildCsv(flights),
      'text/csv',
      t('doc.dialogCsv'),
    );
    return;
  }

  // PDF
  const { uri } = await Print.printToFileAsync({ html: buildHtml(flights) });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: t('doc.dialogPdf'),
      UTI: 'com.adobe.pdf',
    });
  }
}

// ─── Public: import ─────────────────────────────────────────────────────────

export interface ParsedImport {
  flights: Flight[];
  format: 'json' | 'csv';
}

function coerceRecord(raw: Record<string, unknown>): Flight {
  const out: Record<string, unknown> = {};
  for (const def of FIELDS) {
    // Accept either the Flight key or the localized CSV header.
    let v = raw[def.key as string];
    if (v === undefined) v = raw[def.header];
    if (v === undefined || v === null || v === '') continue;

    if (def.type === 'number') {
      const n = typeof v === 'number' ? v : parseFloat(String(v));
      if (!Number.isNaN(n)) out[def.key] = n;
    } else if (def.type === 'boolean') {
      if (typeof v === 'boolean') out[def.key] = v;
      else {
        const s = String(v).trim().toLowerCase();
        out[def.key] = s === 'true' || s === '1' || s === 'sí' || s === 'si';
      }
    } else {
      out[def.key] = String(v);
    }
  }

  // Guarantee required fields so the record is valid.
  const f = out as Partial<Flight>;
  return {
    id: f.id ?? randomUUID(),
    date: f.date ?? format(new Date(), 'yyyy-MM-dd'),
    flightType: (f.flightType ?? 'manned') as FlightType,
    originIcao: f.originIcao ?? '',
    destinationIcao: f.destinationIcao ?? '',
    role: (f.role ?? 'PIC') as FlightRole,
    createdAt: f.createdAt ?? new Date().toISOString(),
    ...f,
  } as Flight;
}

function parseJson(text: string): Flight[] {
  const data = JSON.parse(text);
  const arr: unknown[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.flights)
      ? data.flights
      : [];
  if (arr.length === 0 && !Array.isArray(data) && !Array.isArray(data?.flights)) {
    throw new Error(t('doc.errJsonNoList'));
  }
  return arr.map((r) => coerceRecord(r as Record<string, unknown>));
}

function parseCsv(text: string): Flight[] {
  // Strip BOM if present.
  const clean = text.replace(/^﻿/, '');
  const lines = clean.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error(t('doc.errCsvNoData'));

  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  const flights: Flight[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const raw: Record<string, unknown> = {};
    headers.forEach((h, idx) => { raw[h] = cells[idx] ?? ''; });
    flights.push(coerceRecord(raw));
  }
  return flights;
}

/**
 * Opens the document picker and parses the chosen JSON or CSV file.
 * Returns null if the user cancels.
 */
export async function pickAndParseFlights(): Promise<ParsedImport | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/csv', 'text/comma-separated-values', '*/*'],
    copyToCacheDirectory: true,
  });
  if (res.canceled || !res.assets?.length) return null;

  const asset = res.assets[0];
  const text = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const name = (asset.name ?? '').toLowerCase();
  const looksJson = name.endsWith('.json') || text.trimStart().startsWith('{') || text.trimStart().startsWith('[');

  if (looksJson) {
    return { flights: parseJson(text), format: 'json' };
  }
  return { flights: parseCsv(text), format: 'csv' };
}
