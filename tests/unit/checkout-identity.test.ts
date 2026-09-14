import { describe, it, expect } from 'vitest';
import { resolveCheckoutIdentity } from '../../src/lib/checkout-identity';

describe('resolveCheckoutIdentity', () => {
  it('uses the session identity when the form phone matches the session phone', () => {
    const result = resolveCheckoutIdentity({
      session: { userId: 'user-1', phone: '01712345678' },
      formPhone: '01712345678',
      formName: 'Rahim',
      existingUserForFormPhone: null
    });
    expect(result).toEqual({ kind: 'use_session', userId: 'user-1' });
  });

  it('rejects explicitly when a logged-in session submits a different phone number', () => {
    const result = resolveCheckoutIdentity({
      session: { userId: 'user-1', phone: '01712345678' },
      formPhone: '01899999999', // different phone, e.g. typo or someone else's number
      formName: 'Rahim',
      existingUserForFormPhone: null
    });
    expect(result.kind).toBe('reject_mismatch');
    if (result.kind === 'reject_mismatch') {
      expect(result.reasonBn.length).toBeGreaterThan(0);
    }
  });

  it('never silently attaches a logged-in session order to a different identity', () => {
    // Regression guard: whatever the resolution is, it must never be
    // "create_guest" or silently swap to some other userId when a
    // session exists and phones don't match.
    const result = resolveCheckoutIdentity({
      session: { userId: 'user-1', phone: '01712345678' },
      formPhone: '01899999999',
      formName: 'Someone Else',
      existingUserForFormPhone: { id: 'user-2' }
    });
    expect(result.kind).not.toBe('create_guest');
    expect(result.kind).not.toBe('use_session');
    if (result.kind === 'use_session') {
    
      expect(result.userId).not.toBe('user-2');
    }
  });

  it('creates a new guest account when no session exists and the phone is unowned', () => {
    const result = resolveCheckoutIdentity({
      session: null,
      formPhone: '01712345678',
      formName: 'Karim',
      existingUserForFormPhone: null
    });
    expect(result).toEqual({ kind: 'create_guest', phone: '01712345678', name: 'Karim' });
  });

  it('rejects guest checkout when the phone already belongs to a registered account', () => {
    const result = resolveCheckoutIdentity({
      session: null,
      formPhone: '01712345678',
      formName: 'Someone',
      existingUserForFormPhone: { id: 'existing-user' }
    });
    expect(result.kind).toBe('reject_existing_account');
    if (result.kind === 'reject_existing_account') {
      expect(result.reasonBn.length).toBeGreaterThan(0);
    }
  });
});
