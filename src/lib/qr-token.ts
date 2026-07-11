/*
 * qr-token.ts — Logika Token QR Presensi (HMAC-signed)
 * ==========================================
 * Menangani pembuatan dan verifikasi token QR untuk presensi.
 * Ada 2 jenis token:
 * 1. Daily QR — dibuat oleh Admin, berlaku 12 jam, berisi sessionId + date + exp
 * 2. Permanent QR — dibuat per siswa (saat registrasi), tidak expired
 *
 * Alur:
 * - Token format: base64url(payloadJSON).base64url(signature)
 * - Payload ditandatangani HMAC-SHA256 dengan secret server (QR_SIGNING_SECRET)
 * - Verifikasi: decode → verif signature HMAC → cek expiry (untuk daily)
 *
 * Keputusan teknis: Kenapa HMAC, bukan UUID acak?
 * - QR discan client lalu dikirim ke server tanpa HTTPS mutual-auth,
 *   jadi payload harus anti-tamper.
 * - HMAC-SHA256 dengan server-only secret membuat token tak bisa dipalsukan
 *   walau format payload-nya publik (terlihat di QR).
 * - Web Crypto (SubtleCrypto) dipakai supaya kompatibel dengan Edge Runtime.
 */

/**
 * Payload untuk QR harian (dibuat admin, expired dalam beberapa jam)
 */
export interface DailyQrPayload {
  type: "daily";
  sessionId: string;
  date: string; // YYYY-MM-DD
  exp: number; // unix ms
}

/**
 * Payload untuk QR permanen siswa (tidak expired, bisa dicetak)
 */
export interface PermanentStudentQrPayload {
  type: "permanent";
  studentId: string;
}

export type QrPayload = DailyQrPayload | PermanentStudentQrPayload;

/**
 * base64url — Encode string/ArrayBuffer ke base64url (tanpa padding)
 * Base64url = base64 standar dengan + → - dan / → _
 */
function base64url(input: ArrayBuffer | string) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * base64urlDecode — Decode string base64url kembali ke string asli
 */
function base64urlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(input.length + ((4 - (input.length % 4)) % 4), "=");
  return atob(padded);
}

/**
 * getKey — Import secret key untuk HMAC-SHA256 via Web Crypto API
 * @param secret - String secret dari env (QR_SIGNING_SECRET)
 * @returns CryptoKey object
 */
async function getKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * generateDailyToken — Generate token QR harian yang sudah ditandatangani
 * Format: base64url(payloadJson).base64url(signature)
 *
 * @param payload - Data sesi (sessionId, date, exp)
 * @param secret - QR_SIGNING_SECRET dari env
 * @returns Token string
 */
export async function generateDailyToken(payload: Omit<DailyQrPayload, "type">, secret: string): Promise<string> {
  const fullPayload: DailyQrPayload = { ...payload, type: "daily" };
  const payloadJson = JSON.stringify(fullPayload);
  const key = await getKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadJson));
  return `${base64url(payloadJson)}.${base64url(signature)}`;
}

/**
 * generatePermanentStudentToken — Generate token QR permanen untuk siswa
 * Token ini tidak expired dan bisa dicetak untuk dipakai jangka panjang.
 *
 * @param studentId - UUID siswa
 * @param secret - QR_SIGNING_SECRET dari env
 * @returns Token string
 */
export async function generatePermanentStudentToken(studentId: string, secret: string): Promise<string> {
  const payload: PermanentStudentQrPayload = { type: "permanent", studentId };
  const payloadJson = JSON.stringify(payload);
  const key = await getKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadJson));
  return `${base64url(payloadJson)}.${base64url(signature)}`;
}

/**
 * verifyAnyToken — Validasi token hasil scan QR (daily atau permanent)
 *
 * Alur:
 * 1. Split token menjadi payloadPart.signaturePart
 * 2. Decode base64url payload
 * 3. Verifikasi signature HMAC dengan secret server
 * 4. Jika daily: cek apakah sudah expired (Date.now() > exp)
 *
 * @param token - Token string hasil scan QR
 * @param secret - QR_SIGNING_SECRET dari env
 * @returns Object { valid, payload } atau { valid: false, reason }
 */
export async function verifyAnyToken(
  token: string,
  secret: string
): Promise<{ valid: true; payload: QrPayload } | { valid: false; reason: string }> {
  try {
    const [payloadPart, signaturePart] = token.split(".");
    if (!payloadPart || !signaturePart) {
      return { valid: false, reason: "Format QR tidak dikenali." };
    }

    const payloadJson = base64urlDecode(payloadPart);
    const key = await getKey(secret);

    // --- Verifikasi tanda tangan HMAC ---
    const signatureBytes = Uint8Array.from(base64urlDecode(signaturePart), (c) => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      new TextEncoder().encode(payloadJson)
    );

    if (!isValid) {
      return { valid: false, reason: "QR tidak valid atau sudah dimodifikasi." };
    }

    const payload: QrPayload = JSON.parse(payloadJson);

    // --- Cek expiry untuk daily QR ---
    if (payload.type === "daily" && Date.now() > payload.exp) {
      return { valid: false, reason: "QR harian sudah kedaluwarsa. Minta admin generate ulang." };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, reason: "QR tidak dapat dibaca." };
  }
}

/**
 * verifyDailyToken — Verifikasi token khusus daily QR (deprecated)
 * Masih disediakan untuk backward compatibility.
 * Sebaiknya gunakan verifyAnyToken yang lebih fleksibel.
 */
export async function verifyDailyToken(
  token: string,
  secret: string
): Promise<{ valid: true; payload: DailyQrPayload } | { valid: false; reason: string }> {
  const result = await verifyAnyToken(token, secret);
  if (!result.valid) {
    return { valid: false, reason: result.reason };
  }
  if (result.payload.type !== "daily") {
    return { valid: false, reason: "Bukan QR harian." };
  }
  return result as { valid: true; payload: DailyQrPayload };
}
