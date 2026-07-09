// Logika token QR presensi harian dan permanent student.
// Kenapa HMAC, bukan hanya UUID acak di kolom `token`?
// - QR yang discan client dikirim balik ke server tanpa perantara aman lain (bukan HTTPS mutual-auth),
//   jadi kita perlu memastikan payload tidak dipalsukan/di-tamper di sisi client sebelum
//   dipakai untuk insert ke attendance_records.
// - HMAC-SHA256 dengan secret yang hanya ada di server (QR_SIGNING_SECRET) membuat token
//   tidak bisa dipalsukan walau struktur payloadnya publik & terlihat di QR image.
// - Pakai Web Crypto (SubtleCrypto) supaya kode ini tetap jalan di Edge Runtime, bukan hanya Node.

export interface DailyQrPayload {
  type: "daily";
  sessionId: string;
  date: string; // YYYY-MM-DD
  exp: number; // unix ms
}

export interface PermanentStudentQrPayload {
  type: "permanent";
  studentId: string;
}

export type QrPayload = DailyQrPayload | PermanentStudentQrPayload;

function base64url(input: ArrayBuffer | string) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(input.length + ((4 - (input.length % 4)) % 4), "=");
  return atob(padded);
}

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
 * Generate token QR harian yang sudah ditandatangani.
 * Format: base64url(payloadJson).base64url(signature)
 */
export async function generateDailyToken(payload: Omit<DailyQrPayload, "type">, secret: string): Promise<string> {
  const fullPayload: DailyQrPayload = { ...payload, type: "daily" };
  const payloadJson = JSON.stringify(fullPayload);
  const key = await getKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadJson));
  return `${base64url(payloadJson)}.${base64url(signature)}`;
}

/**
 * Generate PERMANENT token QR untuk siswa (tidak pernah expired, can be printed and used long-term).
 */
export async function generatePermanentStudentToken(studentId: string, secret: string): Promise<string> {
  const payload: PermanentStudentQrPayload = { type: "permanent", studentId };
  const payloadJson = JSON.stringify(payload);
  const key = await getKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadJson));
  return `${base64url(payloadJson)}.${base64url(signature)}`;
}

/**
 * Validasi token hasil scan QR (baik daily atau permanent):
 * 1. Cek format token
 * 2. Verifikasi signature HMAC dengan secret server
 * 3. Jika daily: cek payload belum kedaluwarsa (exp)
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

    if (payload.type === "daily" && Date.now() > payload.exp) {
      return { valid: false, reason: "QR harian sudah kedaluwarsa. Minta admin generate ulang." };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, reason: "QR tidak dapat dibaca." };
  }
}

/**
 * Deprecated: keep for compatibility but use verifyAnyToken instead
 */
export async function verifyDailyToken(
  token: string,
  secret: string
): Promise<{ valid: true; payload: DailyQrPayload } | { valid: false; reason: string }> {
  const result = await verifyAnyToken(token, secret);
  if (!result.valid || result.payload.type !== "daily") {
    return { valid: false, reason: result.reason || "Bukan QR harian." };
  }
  return result as { valid: true; payload: DailyQrPayload };
}
