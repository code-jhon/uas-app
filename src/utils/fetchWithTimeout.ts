/**
 * Fetch con timeout basado en AbortController.
 *
 * Aborta la petición si excede `ms` milisegundos y limpia el timer en cualquier
 * caso. Función pura y tipada; base compartida para las llamadas de red de la app
 * (NOAA AWC/SWPC y, a futuro, geocoding — ver PAR-22/M5).
 *
 * @param url URL a solicitar.
 * @param ms  Timeout en milisegundos.
 * @returns   La `Response` de `fetch`, o rechaza con `AbortError` si expira el timeout.
 */
export function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}
