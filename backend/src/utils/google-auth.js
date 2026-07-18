const crypto = require('crypto');

const GOOGLE_CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const GOOGLE_TOKEN_ISSUERS = new Set(['https://accounts.google.com', 'accounts.google.com']);

let cachedKeys = null;
let cachedUntil = 0;

const decodeBase64UrlJson = (value) => {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(Buffer.from(normalized, 'base64').toString('utf8'));
};

const getGoogleKeys = async () => {
  if (cachedKeys && Date.now() < cachedUntil) {
    return cachedKeys;
  }

  const response = await fetch(GOOGLE_CERTS_URL);
  if (!response.ok) {
    throw Object.assign(new Error('Cannot verify Google account right now'), { statusCode: 503 });
  }

  const cacheControl = response.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAgeMs = maxAgeMatch ? Number(maxAgeMatch[1]) * 1000 : 60 * 60 * 1000;
  const data = await response.json();

  cachedKeys = data.keys || [];
  cachedUntil = Date.now() + maxAgeMs;

  return cachedKeys;
};

const verifyGoogleIdToken = async (credential) => {
  const token = String(credential || '').trim();
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw Object.assign(new Error('GOOGLE_CLIENT_ID is not configured on the server'), { statusCode: 500 });
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw Object.assign(new Error('Invalid Google credential'), { statusCode: 401 });
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = decodeBase64UrlJson(encodedHeader);
  const payload = decodeBase64UrlJson(encodedPayload);

  if (header.alg !== 'RS256') {
    throw Object.assign(new Error('Invalid Google token algorithm'), { statusCode: 401 });
  }

  const keys = await getGoogleKeys();
  const key = keys.find((item) => item.kid === header.kid);
  if (!key) {
    throw Object.assign(new Error('Invalid Google credential'), { statusCode: 401 });
  }

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${encodedHeader}.${encodedPayload}`);
  verifier.end();

  const signature = Buffer.from(encodedSignature.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  const publicKey = crypto.createPublicKey({ key, format: 'jwk' });

  if (!verifier.verify(publicKey, signature)) {
    throw Object.assign(new Error('Invalid Google credential'), { statusCode: 401 });
  }

  const now = Math.floor(Date.now() / 1000);
  if (!GOOGLE_TOKEN_ISSUERS.has(payload.iss) || payload.aud !== clientId || Number(payload.exp || 0) <= now) {
    throw Object.assign(new Error('Invalid Google credential'), { statusCode: 401 });
  }

  return payload;
};

module.exports = {
  verifyGoogleIdToken
};
