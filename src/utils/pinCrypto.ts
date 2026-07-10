import * as Crypto from 'expo-crypto';

/**
 * PIN storage crypto helpers.
 *
 * The access PIN is never persisted in plain text. Instead it is stored as a
 * salted SHA-256 "envelope" ({ v, salt, hash }). Legacy installs that still
 * hold a plain-text PIN are detected at verify time and migrated lazily on the
 * first successful login (see `verifyPinValue`).
 *
 * SHA-256 + a random per-profile salt is sufficient for the threat model here
 * (physical access / keychain dump). Brute force of the 4-digit space is held
 * back by the progressive lockout in the sign-in screen, not by the hash.
 */

export const PIN_ENVELOPE_VERSION = 1;

export interface PinEnvelope {
  v: number;
  salt: string;
  hash: string;
}

/** Random 16-byte salt encoded as a lowercase hex string. */
export async function generateSalt(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** SHA-256 hex digest of `salt:pin`. */
export async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${pin}`
  );
}

/** Build a fresh hashed envelope for a PIN. */
export async function createPinEnvelope(pin: string): Promise<PinEnvelope> {
  const salt = await generateSalt();
  const hash = await hashPin(pin, salt);
  return { v: PIN_ENVELOPE_VERSION, salt, hash };
}

export function serializePinEnvelope(env: PinEnvelope): string {
  return JSON.stringify(env);
}

/** Parse a stored value into an envelope, or null if it is not one (legacy plain-text). */
export function parsePinEnvelope(raw: string | null): PinEnvelope | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      typeof (parsed as PinEnvelope).v === 'number' &&
      typeof (parsed as PinEnvelope).salt === 'string' &&
      typeof (parsed as PinEnvelope).hash === 'string'
    ) {
      return parsed as PinEnvelope;
    }
  } catch {
    // Not JSON → legacy plain-text PIN.
  }
  return null;
}

/** Constant-time comparison of two equal-purpose hex strings. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export interface VerifyResult {
  ok: boolean;
  /** When set, a serialized envelope to persist (lazy migration of a legacy PIN). */
  migrated?: string;
}

/**
 * Verify a candidate PIN against the raw stored value.
 *
 * - Hashed envelope → compare hashes.
 * - Legacy plain-text PIN → compare directly; on match, return a freshly hashed
 *   envelope in `migrated` so the caller can re-persist it (transparent migration).
 */
export async function verifyPinValue(
  candidate: string,
  storedRaw: string | null
): Promise<VerifyResult> {
  if (!storedRaw) return { ok: false };

  const env = parsePinEnvelope(storedRaw);
  if (env) {
    const hash = await hashPin(candidate, env.salt);
    return { ok: timingSafeEqual(hash, env.hash) };
  }

  // Legacy plain-text PIN: compare once, then migrate on success.
  if (storedRaw === candidate) {
    const fresh = await createPinEnvelope(candidate);
    return { ok: true, migrated: serializePinEnvelope(fresh) };
  }
  return { ok: false };
}
