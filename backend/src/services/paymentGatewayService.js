/**
 * Payment Gateway Service Abstraction
 * Honest by design: Returns unconfigured provider by default.
 * Provides extensible interface for Stripe/Razorpay or in-memory Mock (for tests).
 */

const portalConfig = require('../config/portalConfig');

class NoOpPaymentProvider {
  constructor() {
    this.name = 'none';
  }

  isConfigured() {
    return false;
  }

  getPaymentOptions() {
    return {
      onlinePaymentAvailable: false,
      provider: 'none',
      instructions: 'Online payment is currently unavailable. Please settle invoices directly at the hospital front desk (Cash, Card, or UPI accepted).',
      supportedMethods: ['FRONT_DESK_CASH', 'FRONT_DESK_CARD', 'FRONT_DESK_UPI'],
    };
  }

  async initiatePayment() {
    throw new Error('Online payment gateway is not configured on this MedCore HMS instance.');
  }

  async verifyPayment() {
    throw new Error('Online payment gateway is not configured on this MedCore HMS instance.');
  }
}

class MockPaymentProvider {
  constructor() {
    this.name = 'mock';
  }

  isConfigured() {
    return true;
  }

  getPaymentOptions() {
    return {
      onlinePaymentAvailable: true,
      provider: 'mock',
      instructions: 'MedCore Test Gateway active (Mock Sandbox)',
      supportedMethods: ['CARD', 'UPI', 'NET_BANKING'],
    };
  }

  async initiatePayment({ amount, invoiceId, idempotencyKey, patientId }) {
    const providerReference = `MOCK-TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    return {
      success: true,
      provider: 'mock',
      providerReference,
      amount,
      invoiceId,
      patientId,
      idempotencyKey,
      status: 'INITIATED',
      paymentUrl: `https://payments.mock.medcore.health/checkout/${providerReference}`,
    };
  }

  async verifyPayment({ providerReference, mockOutcome = 'SUCCEEDED' }) {
    if (mockOutcome === 'FAILED') {
      return {
        verified: false,
        status: 'FAILED',
        providerReference,
        reason: 'Declined by test bank',
      };
    }
    return {
      verified: true,
      status: 'SUCCEEDED',
      providerReference,
      transactionId: `TXN-${providerReference}`,
      verifiedAt: new Date(),
    };
  }
}

class PaymentGatewayService {
  constructor() {
    this.providers = {
      none: new NoOpPaymentProvider(),
      mock: new MockPaymentProvider(),
    };
  }

  getProvider() {
    const configured = portalConfig.paymentGatewayProvider || 'none';
    if (portalConfig.onlinePaymentsEnabled && this.providers[configured]) {
      return this.providers[configured];
    }
    return this.providers.none;
  }

  getPaymentOptions() {
    return this.getProvider().getPaymentOptions();
  }

  async initiatePayment(payload) {
    return this.getProvider().initiatePayment(payload);
  }

  async verifyPayment(payload) {
    return this.getProvider().verifyPayment(payload);
  }
}

module.exports = new PaymentGatewayService();
