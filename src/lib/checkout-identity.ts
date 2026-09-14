/**
 * Decides which customer identity a checkout submission should be
 * attached to. This is deliberately a pure function — the API route is
 * responsible for fetching `session` and `existingUserForFormPhone` from
 * the DB/cookies and then calling this — so the decision itself can be
 * unit tested without Next.js request/cookie machinery or a live DB.
 *
 * Rules:
 *  - If the visitor has a logged-in session, that session's user is the
 *    ONLY identity an order can be attached to. If the phone number typed
 *    into the checkout form doesn't match the session's phone, we reject
 *    explicitly rather than silently using either value — the session
 *    phone was OTP-verified; the form phone was not, so they cannot be
 *    silently reconciled.
 *  - If the visitor has no session (guest checkout), the phone number
 *    they typed has NOT been verified via OTP. If that phone number
 *    already belongs to a registered account, we must not silently
 *    attach the order (and thus the User record's `name`) to that
 *    account — that would let anyone place orders "as" another
 *    customer just by typing their phone number, polluting their real
 *    order history and, worse, creating a purchase record that could
 *    later be used to submit a "verified purchase" review the account
 *    owner never made. Instead we ask them to log in.
 *  - Only when the phone is unowned do we create a brand-new guest
 *    account from the checkout form.
 */

export type CheckoutIdentityResolution =
  | { kind: 'use_session'; userId: string }
  | { kind: 'create_guest'; phone: string; name: string }
  | { kind: 'reject_mismatch'; reasonBn: string }
  | { kind: 'reject_existing_account'; reasonBn: string };

export interface ResolveCheckoutIdentityInput {
  session: { userId: string; phone: string } | null;
  formPhone: string;
  formName: string;
  /** Only consulted when `session` is null. Pass the result of looking
   * up a User by `formPhone`, or null if none exists. */
  existingUserForFormPhone: { id: string } | null;
}

export function resolveCheckoutIdentity(input: ResolveCheckoutIdentityInput): CheckoutIdentityResolution {
  if (input.session) {
    if (input.session.phone !== input.formPhone) {
      return {
        kind: 'reject_mismatch',
        reasonBn:
          'ফর্মে দেওয়া মোবাইল নাম্বারটি আপনার লগইন করা অ্যাকাউন্টের নাম্বারের সাথে মিলছে না। ' +
          'আপনার অ্যাকাউন্টের নাম্বার ব্যবহার করুন, অথবা লগআউট করে গেস্ট হিসেবে অর্ডার করুন।'
      };
    }
    return { kind: 'use_session', userId: input.session.userId };
  }

  if (input.existingUserForFormPhone) {
    return {
      kind: 'reject_existing_account',
      reasonBn: 'এই মোবাইল নাম্বারটি ইতিমধ্যে একটি অ্যাকাউন্টের সাথে যুক্ত। চালিয়ে যেতে অনুগ্রহ করে লগইন করুন।'
    };
  }

  return { kind: 'create_guest', phone: input.formPhone, name: input.formName };
}
