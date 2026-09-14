/**
 * Storage abstraction for customer-uploaded review photos, mirroring the
 * pattern used for payments (src/lib/payments/provider.ts): a small
 * interface plus one real implementation, so a different provider (S3,
 * Cloudflare R2, etc.) can be swapped in later without touching the
 * upload route or review API.
 *
 * Required environment variables for the Supabase backend:
 *   SUPABASE_URL                  — project URL, e.g. https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY     — service-role key. SERVER-ONLY. This
 *                                    key bypasses row-level security, so
 *                                    it must never be prefixed with
 *                                    NEXT_PUBLIC_ and must never be sent
 *                                    to the browser. It is only ever read
 *                                    here, in a route handler executing
 *                                    on the server.
 *   SUPABASE_REVIEW_PHOTOS_BUCKET — storage bucket name (default: "review-photos")
 *
 * If these are not set, `getStorageProvider()` throws a clear, actionable
 * error rather than silently accepting uploads it can't actually store —
 * the upload route surfaces that as a 500 with a message telling the
 * admin what to configure, instead of pretending the feature works.
 */
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import type { AllowedImageMime } from '../image-sniff';
import { mimeToExtension } from '../image-sniff';

export interface UploadReviewPhotoInput {
  buffer: Buffer;
  mimeType: AllowedImageMime;
  userId: string;
}

export interface UploadReviewPhotoResult {
  /** Publicly fetchable URL to display in the UI. */
  url: string;
  /** Storage path, kept for admin-side deletion/moderation tooling. */
  path: string;
}

export interface StorageProvider {
  uploadReviewPhoto(input: UploadReviewPhotoInput): Promise<UploadReviewPhotoResult>;
}

const REVIEW_PHOTOS_PREFIX = 'review-photos';

class SupabaseStorageProvider implements StorageProvider {
  private client;
  private bucket: string;

  constructor(url: string, serviceRoleKey: string, bucket: string) {
    this.client = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
    this.bucket = bucket;
  }

  async uploadReviewPhoto({ buffer, mimeType, userId }: UploadReviewPhotoInput): Promise<UploadReviewPhotoResult> {
    // The uploader's userId is embedded in the path itself — this is
    // what lets isReviewPhotoUrlOwnedBy() later prove a given photoUrl
    // actually belongs to the customer trying to attach it to a review,
    // without needing a separate "uploads" table.
    const filename = `${Date.now()}-${nanoid(10)}.${mimeToExtension(mimeType)}`;
    const path = `${REVIEW_PHOTOS_PREFIX}/${userId}/${filename}`;

    const { error } = await this.client.storage.from(this.bucket).upload(path, buffer, {
      contentType: mimeType,
      upsert: false
    });
    if (error) {
      throw new Error(`Supabase Storage upload failed: ${error.message}`);
    }

    const { data } = this.client.storage.from(this.bucket).getPublicUrl(path);
    return { url: data.publicUrl, path };
  }
}

let cachedProvider: StorageProvider | undefined;

export function getStorageProvider(): StorageProvider {
  if (cachedProvider) return cachedProvider;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_REVIEW_PHOTOS_BUCKET ?? 'review-photos';

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Review photo storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.example) to enable photo uploads.'
    );
  }

  cachedProvider = new SupabaseStorageProvider(url, serviceRoleKey, bucket);
  return cachedProvider;
}

/**
 * Checks that a photoUrl was produced by our own upload endpoint for
 * this specific user — not an arbitrary external URL, and not another
 * customer's uploaded photo. Relies on the userId being embedded in the
 * storage path by uploadReviewPhoto() above.
 */
export function isReviewPhotoUrlOwnedBy(photoUrl: string, userId: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(photoUrl);
  } catch {
    return false;
  }

  const configuredUrl = process.env.SUPABASE_URL;
  if (!configuredUrl) return false;

  let expectedHost: string;
  try {
    expectedHost = new URL(configuredUrl).host;
  } catch {
    return false;
  }

  if (parsed.host !== expectedHost) return false;

  const needle = `/${REVIEW_PHOTOS_PREFIX}/${userId}/`;
  return parsed.pathname.includes(needle);
}
