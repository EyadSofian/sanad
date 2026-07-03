import crypto from 'node:crypto';

/** hex HMAC-SHA256 of a raw request body */
export function signBody(rawBody, secret) {
  return crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
}

/** Timing-safe verification of an incoming x-signature header. */
export function verifySignature(rawBody, signatureHex, secret) {
  if (!secret || !signatureHex || !rawBody) return false;
  const expected = Buffer.from(signBody(rawBody, secret), 'hex');
  let provided;
  try {
    provided = Buffer.from(String(signatureHex).trim().replace(/^sha256=/, ''), 'hex');
  } catch {
    return false;
  }
  if (provided.length !== expected.length || provided.length === 0) return false;
  return crypto.timingSafeEqual(expected, provided);
}
