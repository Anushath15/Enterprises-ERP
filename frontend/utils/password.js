/**
 * Senthil Enterprises ERP - Password Utilities
 * Salted SHA-256 hashing via WebCrypto (works in browser secure contexts and Node).
 */

const encoder = new TextEncoder();

export const DEFAULT_PASSWORD_SALT = '47b4e97fe27f02652feb33b4d36b0c72';
export const DEFAULT_PASSWORD_HASH = '5b7df82ed4230e4a92c00ef5593a3a6d9e267651e47b760450739852bfa6b46f';
export const DEFAULT_PASSWORD = 'admin123';

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
  const target = (user && user.passwordHash) || DEFAULT_PASSWORD_HASH;
  const candidate = await hashPassword(password, salt);
  return candidate === target;
}

export async function hashForReset(password) {
  const salt = randomSalt();
  const hash = await hashPassword(password, salt);
  return { passwordSalt: salt, passwordHash: hash };
}
