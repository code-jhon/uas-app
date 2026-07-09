// ─── Brand registry ───────────────────────────────────────────────────────────

export interface BrandInfo {
  name: string;
  site: string;          // manufacturer homepage
  djiSlug?: string;      // only for DJI — used to build product page URL
}

// Maps every lowercase brand prefix to its info
const BRANDS: Record<string, BrandInfo> = {
  'dji':       { name: 'DJI',        site: 'https://www.dji.com',              djiSlug: '' },
  'autel':     { name: 'Autel',      site: 'https://www.autelrobotics.com' },
  'skydio':    { name: 'Skydio',     site: 'https://www.skydio.com' },
  'parrot':    { name: 'Parrot',     site: 'https://www.parrot.com' },
  'yuneec':    { name: 'Yuneec',     site: 'https://www.yuneec.com' },
  'ryze':      { name: 'Ryze/Tello', site: 'https://www.ryzerobotics.com' },
  'fimi':      { name: 'FIMI',       site: 'https://www.fimi.com' },
  'hubsan':    { name: 'Hubsan',     site: 'https://www.hubsan.com' },
  'holy stone':{ name: 'Holy Stone', site: 'https://www.holystone.com' },
  'potensic':  { name: 'Potensic',   site: 'https://www.potensic.com' },
  'betafpv':   { name: 'BETAFPV',    site: 'https://betafpv.com' },
  'iflight':   { name: 'iFlight',    site: 'https://www.iflight.com' },
  'geprc':     { name: 'GEPRC',      site: 'https://geprc.com' },
  'walkera':   { name: 'Walkera',    site: 'https://www.walkera.com' },
  'eachine':   { name: 'Eachine',    site: 'https://www.eachine.com' },
  'xiaomi':    { name: 'Xiaomi',     site: 'https://www.mi.com' },
  'aee':       { name: 'AEE',        site: 'https://www.aee.com' },
  'swellpro':  { name: 'SwellPro',   site: 'https://www.swellpro.com' },
  'zipline':   { name: 'Zipline',    site: 'https://www.flyzipline.com' },
  'wingcopter':{ name: 'Wingcopter', site: 'https://wingcopter.com' },
};

export function detectBrand(model: string): BrandInfo | null {
  const lower = model.toLowerCase();
  for (const [prefix, info] of Object.entries(BRANDS)) {
    if (lower.startsWith(prefix)) return info;
  }
  return null;
}

/** For DJI models, try to build the direct product page URL from the model name.
 *  E.g. "DJI Mavic 3" → "https://www.dji.com/mavic-3"
 */
export function djiProductPage(model: string): string {
  const slug = model
    .replace(/^DJI\s+/i, '')       // remove "DJI " prefix
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');          // spaces → hyphens
  return `https://www.dji.com/${slug}`;
}

// ─── Wikipedia image fetch ─────────────────────────────────────────────────────

export interface DroneWikiResult {
  imageUrl: string | null;
  wikiUrl: string | null;
  pageTitle: string | null;
}

const BASE_WP = 'https://en.wikipedia.org/w/api.php';

async function getThumbnail(title: string): Promise<{ url: string; pageTitle: string } | null> {
  const params = new URLSearchParams({
    action: 'query',
    titles: title,
    prop: 'pageimages',
    format: 'json',
    pithumbsize: '600',
    origin: '*',
  });
  const resp = await fetch(`${BASE_WP}?${params}`);
  const data: unknown = await resp.json();
  const pages = Object.values(
    (data as { query: { pages: Record<string, unknown> } }).query.pages
  ) as { missing?: boolean; thumbnail?: { source: string }; title: string }[];
  const page = pages[0];
  if (!page || 'missing' in page || !page.thumbnail) return null;
  return { url: page.thumbnail.source, pageTitle: page.title };
}

async function searchWikipedia(query: string): Promise<string | null> {
  const params = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: `${query} drone`,
    srlimit: '1',
    format: 'json',
    origin: '*',
  });
  const resp = await fetch(`${BASE_WP}?${params}`);
  const data: unknown = await resp.json();
  const results = (
    data as { query: { search: { title: string }[] } }
  ).query.search;
  return results[0]?.title ?? null;
}

export async function fetchDroneWikiInfo(model: string): Promise<DroneWikiResult> {
  const empty: DroneWikiResult = { imageUrl: null, wikiUrl: null, pageTitle: null };
  try {
    // Step 1: exact title match
    const exact = await getThumbnail(model);
    if (exact) {
      const slug = encodeURIComponent(exact.pageTitle.replace(/\s+/g, '_'));
      return {
        imageUrl: exact.url,
        wikiUrl: `https://en.wikipedia.org/wiki/${slug}`,
        pageTitle: exact.pageTitle,
      };
    }

    // Step 2: full-text search
    const found = await searchWikipedia(model);
    if (!found) return empty;

    const thumb = await getThumbnail(found);
    const slug = encodeURIComponent(found.replace(/\s+/g, '_'));
    return {
      imageUrl: thumb?.url ?? null,
      wikiUrl: `https://en.wikipedia.org/wiki/${slug}`,
      pageTitle: found,
    };
  } catch {
    return empty;
  }
}

// ─── Amazon image fetch ───────────────────────────────────────────────────────

// Pattern that matches Amazon CDN image URLs in page HTML
const AMZN_IMG_RE = /https:\/\/m\.media-amazon\.com\/images\/I\/[\w%+.-]+\._AC_[\w_]+\.jpg/g;

// Sizes we skip — tiny icons/thumbnails not worth showing
const TINY_SIZES = ['_SX38_', '_SX48_', '_SX54_', '_SX75_', '_SX96_', '_US40_'];

function normalizeAmznUrl(url: string): string {
  // Rewrite to a consistently sized image (500px longest side)
  return url.replace(/\._AC_[\w_]+\.jpg$/, '._AC_SL500_.jpg');
}

/** Best-effort Amazon image scrape. May fail if Amazon blocks the request. */
async function fetchAmazonImage(model: string): Promise<string | null> {
  const query = encodeURIComponent(`${model} drone`);
  // Try .com.co first (Colombia), then .com
  const urls = [
    `https://www.amazon.com.co/s?k=${query}`,
    `https://www.amazon.com/s?k=${query}`,
  ];
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    'Accept-Language': 'es-CO,es;q=0.9,en;q=0.8',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  };

  for (const url of urls) {
    try {
      const resp = await fetch(url, { headers });
      if (!resp.ok) continue;
      const html = await resp.text();
      const matches = [...html.matchAll(AMZN_IMG_RE)];
      for (const [match] of matches) {
        if (TINY_SIZES.some((s) => match.includes(s))) continue;
        return normalizeAmznUrl(match);
      }
    } catch {
      // try next URL
    }
  }
  return null;
}

// ─── Combined image resolver ──────────────────────────────────────────────────

export type ImageSource = 'wikipedia' | 'amazon' | null;

export interface DroneImageResult {
  imageUrl: string | null;
  source: ImageSource;
  wikiUrl: string | null;
  pageTitle: string | null;
  amazonSearchUrl: string;
}

/**
 * Resolves a drone image in priority order:
 * 1. Wikipedia thumbnail
 * 2. Amazon product image (best-effort scrape)
 * Always returns an Amazon search URL for manual browsing.
 */
export async function fetchDroneImage(model: string): Promise<DroneImageResult> {
  const amazonSearchUrl =
    `https://www.amazon.com.co/s?k=${encodeURIComponent(model + ' drone')}`;

  // 1 — Wikipedia
  const wiki = await fetchDroneWikiInfo(model);
  if (wiki.imageUrl) {
    return {
      imageUrl: wiki.imageUrl,
      source: 'wikipedia',
      wikiUrl: wiki.wikiUrl,
      pageTitle: wiki.pageTitle,
      amazonSearchUrl,
    };
  }

  // 2 — Amazon
  const amznImg = await fetchAmazonImage(model);
  return {
    imageUrl: amznImg,
    source: amznImg ? 'amazon' : null,
    wikiUrl: wiki.wikiUrl,
    pageTitle: wiki.pageTitle,
    amazonSearchUrl,
  };
}

// ─── Notes parser ─────────────────────────────────────────────────────────────

/** Extracts the drone model from the notes field ("Modelo: DJI Mavic 3\n...").
 *  Accepts the localized prefixes used when logging a flight (es/pt "Modelo:", en "Model:"). */
export function extractDroneModel(notes?: string | null): string | null {
  if (!notes) return null;
  const match = notes.match(/^(?:Modelo|Model):\s*(.+)/m);
  return match?.[1]?.trim() ?? null;
}
