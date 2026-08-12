/**
 * Senthil Enterprises ERP - Password Utilities
 * Salted SHA-256 hashing via WebCrypto (works in browser secure contexts and Electron).
 *
 * All accounts are seeded with PIN "1234" and requiresPinChange=true.
 * The user is forced to set a new PIN on first login.
 */

const encoder = new TextEncoder();

/** Fixed salt used for all PIN hashing (not secret — just prevents rainbow tables). */
export const DEFAULT_PASSWORD_SALT = '47b4e97fe27f02652feb33b4d36b0c72';

/**
 * SHA-256(salt + ":" + pin) — the pre-computed hash of "1234" with DEFAULT_PASSWORD_SALT.
 * Used only for seeding; all accounts are immediately forced to change PIN on first login.
 */
export const DEFAULT_PIN_HASH = 'ea9b004100d15a45cc993bf0699039a9b6ccf9f3e876d3493208cf48de0882c5';

function bytesToHex(bytes) {
  return Array.from(new Uint8Array(bytes)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function hashPassword(password, salt) {
  if (!globalThis.crypto || !globalThis.crypto.subtle) {
    throw new Error('Secure crypto API is not available in this context.');
  }
  const digest = await globalThis.crypto.subtle.digest('SHA-256', encoder.encode(`${salt}:${password}`));
  return bytesToHex(digest);
}

export function randomSalt() {
  return bytesToHex(globalThis.crypto.getRandomValues(new Uint8Array(16)));
}

export async function verifyPassword(password, user) {
  const salt = (user && user.passwordSalt) || DEFAULT_PASSWORD_SALT;
  const target = (user && user.passwordHash) || DEFAULT_PIN_HASH;
  const candidate = await hashPassword(password, salt);
  return candidate === target;
}

export async function hashForReset(password) {
  const salt = randomSalt();
  const hash = await hashPassword(password, salt);
  return { passwordSalt: salt, passwordHash: hash };
}
