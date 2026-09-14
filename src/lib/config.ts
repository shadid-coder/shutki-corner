/**
 * Business decisions that don't have a single correct answer are kept
 * here as named constants (or DB-backed SiteSetting rows for the ones
 * an admin should change without a redeploy). Each is explained so a
 * non-developer can find and adjust it.
 */

export const REVIEW_CONFIG = {
  /** Days after delivery before the first review reminder notification. */
  firstReminderDays: 3,
  /** Days after the first reminder before the final reminder. */
  finalReminderDays: 7,
  /** Hours after submitting a review a customer may still edit/delete it. */
  editWindowHours: 48,
  /** Max size for a customer-uploaded review photo, in bytes. */
  maxPhotoSizeBytes: 5 * 1024 * 1024 // 5MB
};

export const ORDER_CONFIG = {
  /** Minutes an idempotency key is honored — repeated submits within this
   * window return the original order instead of creating a duplicate. */
  duplicateSubmitWindowMinutes: 10
};

export const DELIVERY_CONFIG = {
  /** Fallback delivery charge (in Taka) for districts/upazilas not present
   * in the DeliveryZone table. Admin should keep DeliveryZone rows current
   * instead of relying on this fallback. */
  fallbackChargeTaka: 120
};

export const AUTH_CONFIG = {
  otpLengthDigits: 6,
  otpExpiryMinutes: 5,
  otpMaxAttemptsPerHour: 5 // rate limiting for login
};
