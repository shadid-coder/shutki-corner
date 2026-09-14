import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { sniffImageMimeType } from '../../src/lib/image-sniff';
import { isReviewPhotoUrlOwnedBy } from '../../src/lib/storage/provider';

describe('sniffImageMimeType', () => {
  it('recognizes a JPEG by its magic bytes', () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(sniffImageMimeType(jpeg)).toBe('image/jpeg');
  });

  it('recognizes a PNG by its magic bytes', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    expect(sniffImageMimeType(png)).toBe('image/png');
  });

  it('recognizes a WebP by its RIFF/WEBP markers', () => {
    // RIFF <size> WEBP
    const webp = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);
    expect(sniffImageMimeType(webp)).toBe('image/webp');
  });

  it('returns null for a disguised file — e.g. an HTML/script payload with a .jpg-sounding name', () => {
    const fakeImage = Buffer.from('<script>alert(1)</script>', 'utf-8');
    expect(sniffImageMimeType(fakeImage)).toBeNull();
  });

  it('returns null for an empty buffer', () => {
    expect(sniffImageMimeType(Buffer.alloc(0))).toBeNull();
  });

  it('ignores whatever the client claims and only trusts the bytes — ' +
     'ensures a text file with a spoofed name is rejected', () => {
    // Simulates: client sets file.type = "image/png" but the actual
    // bytes are plain text. The route never reads file.type at all;
    // this just proves the sniffer itself doesn't get fooled by intent.
    const notActuallyPng = Buffer.from('just some text pretending to be an image');
    expect(sniffImageMimeType(notActuallyPng)).toBeNull();
  });
});

describe('isReviewPhotoUrlOwnedBy', () => {
  const ORIGINAL_SUPABASE_URL = process.env.SUPABASE_URL;

  beforeEach(() => {
    process.env.SUPABASE_URL = 'https://myproject.supabase.co';
  });

  afterEach(() => {
    process.env.SUPABASE_URL = ORIGINAL_SUPABASE_URL;
  });

  it('accepts a URL pointing at the correct storage host and the requesting user\'s own path', () => {
    const url = 'https://myproject.supabase.co/storage/v1/object/public/review-photos/review-photos/user-123/abc.jpg';
    expect(isReviewPhotoUrlOwnedBy(url, 'user-123')).toBe(true);
  });

  it('rejects a URL under a different user\'s upload path', () => {
    const url = 'https://myproject.supabase.co/storage/v1/object/public/review-photos/review-photos/user-999/abc.jpg';
    expect(isReviewPhotoUrlOwnedBy(url, 'user-123')).toBe(false);
  });

  it('rejects an arbitrary external URL entirely, even one that looks like an image', () => {
    const url = 'https://evil.example.com/review-photos/user-123/fake.jpg';
    expect(isReviewPhotoUrlOwnedBy(url, 'user-123')).toBe(false);
  });

  it('rejects a malformed URL rather than throwing', () => {
    expect(isReviewPhotoUrlOwnedBy('not-a-url', 'user-123')).toBe(false);
  });

  it('rejects everything when storage is not configured (no SUPABASE_URL)', () => {
    delete process.env.SUPABASE_URL;
    const url = 'https://myproject.supabase.co/storage/v1/object/public/review-photos/review-photos/user-123/abc.jpg';
    expect(isReviewPhotoUrlOwnedBy(url, 'user-123')).toBe(false);
  });
});
