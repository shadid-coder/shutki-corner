import type { PaymentMethod } from '@prisma/client';

export interface PaymentInitResult {
  /** For COD, always "requires_nothing". For manual methods, instructions
   * shown to the customer. For a future gateway, a redirect URL. */
  kind: 'requires_nothing' | 'manual_instructions' | 'redirect';
  instructionsBn?: string;
  redirectUrl?: string;
}

export interface PaymentProvider {
  method: PaymentMethod;
  init(orderId: string, totalTaka: number): Promise<PaymentInitResult>;
}

// --- Cash on Delivery: the only method live at launch ---
export const codProvider: PaymentProvider = {
  method: 'COD',
  async init() {
    return { kind: 'requires_nothing' };
  }
};

// --- Manual bKash/Nagad: scaffolded, disabled until configured ---
export const manualBkashProvider: PaymentProvider = {
  method: 'MANUAL_BKASH',
  async init() {
    return {
      kind: 'manual_instructions',
      instructionsBn:
        'আমাদের bKash নাম্বারে টাকা পাঠিয়ে ট্রানজেকশন আইডি অর্ডার নোটে যোগ করুন। (এই পেমেন্ট পদ্ধতি এখনো সক্রিয় নয়।)'
    };
  }
};

// --- Future online gateway: not implemented, kept as a typed stub so the
// order model and checkout UI never need to change when it is added. ---
export const onlineGatewayProvider: PaymentProvider = {
  method: 'ONLINE_GATEWAY',
  async init() {
    throw new Error('Online gateway not yet configured. Set PAYMENT_GATEWAY_* env vars.');
  }
};

export function getPaymentProvider(method: PaymentMethod): PaymentProvider {
  switch (method) {
    case 'COD':
      return codProvider;
    case 'MANUAL_BKASH':
    case 'MANUAL_NAGAD':
      return manualBkashProvider;
    case 'ONLINE_GATEWAY':
      return onlineGatewayProvider;
  }
}
