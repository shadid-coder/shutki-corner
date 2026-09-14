/**
 * Determines an image's real MIME type from its own bytes (the file
 * signature / "magic number"), ignoring whatever Content-Type or
 * filename extension the client claims. A browser or a malicious script
 * can set `file.type` to anything; the bytes are what actually get
 * decoded (or exploited) downstream, so they're the only thing worth
 * trusting here.
 *
 * Returns null for anything that isn't one of the explicitly allowed
 * image formats — callers should reject the upload in that case rather
 * than guessing.
 */
export type AllowedImageMime = 'image/jpeg' | 'image/png' | 'image/webp';

export function sniffImageMimeType(buffer: Buffer | Uint8Array): AllowedImageMime | null {
  const bytes = buffer instanceof Buffer ? buffer : Buffer.from(buffer);

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 && // P
    bytes[2] === 0x4e && // N
    bytes[3] === 0x47 && // G
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png';
  }

  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && // R
    bytes[1] === 0x49 && // I
    bytes[2] === 0x46 && // F
    bytes[3] === 0x46 && // F
    bytes[8] === 0x57 && // W
    bytes[9] === 0x45 && // E
    bytes[10] === 0x42 && // B
    bytes[11] === 0x50 // P
  ) {
    return 'image/webp';
  }

  return null;
}

export function mimeToExtension(mime: AllowedImageMime): string {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
  }
}
