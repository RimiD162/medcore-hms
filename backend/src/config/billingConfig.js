/**
 * Centralized Finance & Billing Configuration Module
 * Defines authoritative constants, currency, tax rates, thresholds, and defaults.
 * No magic numbers in code.
 */

const billingConfig = {
  // Currency & Locale
  currency: 'INR',
  currencySymbol: '₹',
  locale: 'en-IN',
  hospitalTimezone: process.env.HOSPITAL_TIMEZONE || 'Asia/Kolkata',

  // Configured Tax Rates (Tax code -> Rate percentage)
  taxRates: {
    EXEMPT: { code: 'EXEMPT', name: 'Tax Exempt (0%)', rate: 0.00 },
    STANDARD_5: { code: 'STANDARD_5', name: 'Healthcare Low (5%)', rate: 5.00 },
    STANDARD_12: { code: 'STANDARD_12', name: 'Standard Med (12%)', rate: 12.00 },
    STANDARD_18: { code: 'STANDARD_18', name: 'Specialty / Equipment (18%)', rate: 18.00 },
  },

  // Billable Line Item Categories
  invoiceCategories: [
    'Consultation',
    'Diagnostic',
    'Pharmacy',
    'Procedure',
    'Ward & Bed',
    'Emergency',
    'Other',
  ],

  // Expense Categories
  expenseCategories: [
    'Medical Supplies',
    'Facility & Utilities',
    'Equipment Maintenance',
    'Administrative',
    'Staff & Training',
    'Other',
  ],

  // Payment Methods
  paymentMethods: [
    'CASH',
    'CARD',
    'UPI',
    'BANK_TRANSFER',
    'OTHER',
  ],

  // Operational Thresholds & Rules
  thresholds: {
    defaultPaymentTermsDays: 15,
    discountReasonThreshold: 500, // INR - discounts > 500 require a mandatory reason
    largeOutstandingThreshold: 5000, // INR - invoices > 5,000 flagged in high outstanding metrics
    highBalanceThreshold: 10000, // INR - quick filter for large balances
    backdatingWindowDays: 7, // Payments backdated beyond 7 days require senior approver permission
    expenseNotificationThreshold: 20000, // INR - expenses > 20,000 notify finance leadership
    amountSanityUpperBound: 10000000, // INR 1,00,00,000 (1 Crore) upper safety ceiling
    requireSeparateApprover: process.env.FINANCE_REQUIRE_SEPARATE_APPROVER !== 'false', // Default: true
  },

  // Hospital Branding & Invoicing Header Fallbacks
  hospital: {
    name: process.env.HOSPITAL_NAME || 'MedCore Central Hospital & Research Center',
    tagline: 'Excellence in Healthcare, Compassion in Healing',
    address: process.env.HOSPITAL_ADDRESS || '742 Healthcare Boulevard, Metro Health City',
    city: 'Metro City',
    country: 'India',
    phone: process.env.HOSPITAL_PHONE || '+91 98765 43210',
    email: process.env.HOSPITAL_EMAIL || 'billing@medcore.health',
    taxNumber: process.env.HOSPITAL_TAX_NUMBER || 'GSTIN29AAACM1234A1Z5',
    logoUrl: '/images/medcore-logo.png',
  },
};

module.exports = billingConfig;
