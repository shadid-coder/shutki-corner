/** Swap this implementation for a real SMS gateway (e.g. a local
 * Bangladeshi SMS aggregator) in production via SMS_PROVIDER env var.
 * In development, OTPs are logged to the server console only — no real
 * SMS is sent, and no OTP is ever returned in an API response body. */
export async function sendOtpSms(phone: string, code: string): Promise<void> {
  if (process.env.SMS_PROVIDER === 'console' || !process.env.SMS_PROVIDER) {
    // eslint-disable-next-line no-console
    console.log(`[DEV SMS] OTP for ${phone}: ${code}`);
    return;
  }
  throw new Error(`SMS provider "${process.env.SMS_PROVIDER}" is not implemented yet.`);
}
