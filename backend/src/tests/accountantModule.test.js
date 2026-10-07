const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const prisma = require('../config/prisma');
const {
  roundMoney,
  calculateLineItem,
  calculateInvoiceTotals,
  isInvoiceOverdue,
  formatMoney,
} = require('../utils/financeMoney');
const { sanitizeCsvCell, arrayToCsv } = require('../services/financialReportService');
const invoiceService = require('../services/invoiceService');
const paymentService = require('../services/paymentService');
const refundService = require('../services/refundService');
const expenseService = require('../services/expenseService');
const transactionService = require('../services/transactionService');
const financialReportService = require('../services/financialReportService');
const {
  createInvoiceSchema,
  recordPaymentSchema,
  voidPaymentSchema,
  createExpenseSchema,
  requestRefundSchema,
} = require('../validators/accountantValidators');

describe('Accountant / Finance Module — Core Calculations, Workflows & Safety Guards', () => {
  let testPatient;
  let standardAccountant;
  let seniorApprover;
  let testInvoice;

  before(async () => {
    // Find or create test users
    standardAccountant = await prisma.user.findFirst({
      where: { role: 'ACCOUNTANT', accountantProfile: { isSeniorApprover: false } },
      include: { accountantProfile: true },
    });

    seniorApprover = await prisma.user.findFirst({
      where: { role: 'ACCOUNTANT', accountantProfile: { isSeniorApprover: true } },
      include: { accountantProfile: true },
    });

    if (!standardAccountant) {
      standardAccountant = {
        id: '00000000-0000-0000-0000-000000000001',
        fullName: 'Test Accountant',
        role: 'ACCOUNTANT',
        isSeniorApprover: false,
      };
    }

    if (!seniorApprover) {
      seniorApprover = {
        id: '00000000-0000-0000-0000-000000000002',
        fullName: 'Test Senior Approver',
        role: 'ACCOUNTANT',
        isSeniorApprover: true,
      };
    }

    // Find any existing patient for testing
    testPatient = await prisma.patient.findFirst();
    if (!testPatient) {
      testPatient = await prisma.patient.create({
        data: {
          patientIdNumber: 'MC-TEST-999999',
          fullName: 'Test Finance Patient',
          gender: 'MALE',
          dateOfBirth: new Date('1990-01-01'),
          age: 36,
          phone: '9876543210',
        },
      });
    }
  });

  describe('1. Pure Money Math & Half-Up 2-Decimal Rounding', () => {
    test('roundMoney should correctly round floating point anomalies half-up', () => {
      assert.strictEqual(roundMoney(0.1 + 0.2), 0.3);
      assert.strictEqual(roundMoney(10.005), 10.01);
      assert.strictEqual(roundMoney(10.004), 10.0);
      assert.strictEqual(roundMoney(100.555), 100.56);
      assert.strictEqual(roundMoney(0), 0);
      assert.strictEqual(roundMoney(-5.005), -5.01);
    });

    test('calculateLineItem should calculate gross, discount, tax, and net accurately', () => {
      const line = calculateLineItem({
        quantity: 3,
        unitPrice: 250.5,
        discount: 50.0,
        taxRate: 18.0,
      });

      // Gross = 3 * 250.5 = 751.50
      // Taxable = 751.50 - 50.00 = 701.50
      // Tax (18%) = 701.50 * 0.18 = 126.27
      // Net = 701.50 + 126.27 = 827.77
      assert.strictEqual(line.unitPrice, 250.5);
      assert.strictEqual(line.discount, 50.0);
      assert.strictEqual(line.taxRate, 18.0);
      assert.strictEqual(line.taxAmount, 126.27);
      assert.strictEqual(line.totalPrice, 827.77);
    });

    test('calculateInvoiceTotals should derive correct status and outstanding', () => {
      const items = [
        { quantity: 1, unitPrice: 1000, discount: 0, taxRate: 0, taxAmount: 0, totalPrice: 1000 },
        { quantity: 2, unitPrice: 500, discount: 100, taxRate: 10, taxAmount: 90, totalPrice: 990 },
      ];

      const totals = calculateInvoiceTotals({
        items,
        adjustmentAmount: 0,
        paidAmount: 500,
        refundedAmount: 0,
      });

      // Total = 1000 + 990 = 1990
      // Outstanding = 1990 - 500 = 1490
      assert.strictEqual(totals.subtotal, 2000);
      assert.strictEqual(totals.discountAmount, 100);
      assert.strictEqual(totals.taxAmount, 90);
      assert.strictEqual(totals.totalAmount, 1990);
      assert.strictEqual(totals.paidAmount, 500);
      assert.strictEqual(totals.outstandingAmount, 1490);
      assert.strictEqual(totals.status, 'PARTIALLY_PAID');
    });

    test('isInvoiceOverdue should return true only for overdue pending/partial invoices', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      assert.strictEqual(
        isInvoiceOverdue({ dueDate: yesterday, outstandingAmount: 500, status: 'PENDING' }),
        true
      );
      assert.strictEqual(
        isInvoiceOverdue({ dueDate: yesterday, outstandingAmount: 500, status: 'PARTIALLY_PAID' }),
        true
      );
      assert.strictEqual(
        isInvoiceOverdue({ dueDate: tomorrow, outstandingAmount: 500, status: 'PENDING' }),
        false
      );
      assert.strictEqual(
        isInvoiceOverdue({ dueDate: yesterday, outstandingAmount: 0, status: 'PAID' }),
        false
      );
      assert.strictEqual(
        isInvoiceOverdue({ dueDate: yesterday, outstandingAmount: 500, status: 'CANCELLED' }),
        false
      );
    });
  });

  describe('2. Zod Validation Schemas', () => {
    test('should validate invoice payload correctly', () => {
      const validPayload = {
        patientId: '11111111-1111-1111-1111-111111111111',
        type: 'STANDARD',
        items: [
          {
            description: 'Consultation Fee',
            serviceType: 'CONSULTATION',
            quantity: 1,
            unitPrice: 800,
          },
        ],
      };
      const result = createInvoiceSchema.safeParse(validPayload);
      assert.strictEqual(result.success, true);
    });

    test('should reject invalid or negative payment recording amount', () => {
      const invalid = { amount: -500, paymentMethod: 'CASH' };
      const result = recordPaymentSchema.safeParse(invalid);
      assert.strictEqual(result.success, false);

      const zero = { amount: 0, paymentMethod: 'CASH' };
      const resZero = recordPaymentSchema.safeParse(zero);
      assert.strictEqual(resZero.success, false);
    });

    test('should enforce minimum 3 characters for payment void and refund reasons', () => {
      const badVoid = { reason: 'no' };
      assert.strictEqual(voidPaymentSchema.safeParse(badVoid).success, false);

      const goodVoid = { reason: 'Duplicate entry error' };
      assert.strictEqual(voidPaymentSchema.safeParse(goodVoid).success, true);
    });
  });

  describe('3. ₹5,000 Invoice Lifecycle & Overpayment Prevention', () => {
    test('should create ₹5,000 invoice with multiple items', async () => {
      const payload = {
        patientId: testPatient.id,
        type: 'STANDARD',
        items: [
          {
            description: 'General Physician Consultation',
            serviceType: 'CONSULTATION',
            quantity: 1,
            unitPrice: 2000,
            discount: 0,
            taxRate: 0,
          },
          {
            description: 'Clinical Pathology Diagnostic Panel',
            serviceType: 'LABORATORY',
            quantity: 1,
            unitPrice: 3000,
            discount: 0,
            taxRate: 0,
          },
        ],
        notes: 'Test ₹5,000 payment scenario',
      };

      testInvoice = await invoiceService.createInvoice(payload, standardAccountant);
      assert.ok(testInvoice.id);
      assert.ok(testInvoice.invoiceNumber.startsWith('INV-'));
      assert.strictEqual(testInvoice.totalAmount, 5000);
      assert.strictEqual(testInvoice.paidAmount, 0);
      assert.strictEqual(testInvoice.outstandingAmount, 5000);
      assert.strictEqual(testInvoice.status, 'PENDING');
    });

    test('should record first partial payment of ₹2,000', async () => {
      const payment = await paymentService.recordPayment(
        testInvoice.id,
        {
          amount: 2000,
          paymentMethod: 'UPI',
          transactionRef: 'UPI-TEST-123456',
        },
        standardAccountant
      );

      assert.strictEqual(payment.amount, 2000);
      assert.strictEqual(payment.invoice.paidAmount, 2000);
      assert.strictEqual(payment.invoice.outstandingAmount, 3000);
      assert.strictEqual(payment.invoice.status, 'PARTIALLY_PAID');
    });

    test('should strictly block overpayment exceeding remaining ₹3,000 balance', async () => {
      await assert.rejects(
        async () => {
          await paymentService.recordPayment(
            testInvoice.id,
            {
              amount: 3500, // ₹500 more than outstanding balance of ₹3,000
              paymentMethod: 'CASH',
            },
            standardAccountant
          );
        },
        (err) => {
          assert.strictEqual(err.statusCode, 400);
          assert.match(err.message, /exceeds remaining outstanding/i);
          return true;
        }
      );
    });

    test('should record final payment of ₹3,000 to reach fully PAID status', async () => {
      const payment = await paymentService.recordPayment(
        testInvoice.id,
        {
          amount: 3000,
          paymentMethod: 'CARD',
          transactionRef: 'CARD-AUTH-999',
        },
        standardAccountant
      );

      assert.strictEqual(payment.amount, 3000);
      assert.strictEqual(payment.invoice.paidAmount, 5000);
      assert.strictEqual(payment.invoice.outstandingAmount, 0);
      assert.strictEqual(payment.invoice.status, 'PAID');
    });
  });

  describe('4. Idempotent Payment Protection', () => {
    test('should return existing payment when duplicate idempotencyKey is submitted', async () => {
      const idempotencyKey = `idemp-${Date.now()}`;

      // Create separate invoice
      const invoice = await invoiceService.createInvoice(
        {
          patientId: testPatient.id,
          type: 'STANDARD',
          items: [{ description: 'Medication', serviceType: 'PHARMACY', quantity: 1, unitPrice: 100 }],
        },
        standardAccountant
      );

      const firstCall = await paymentService.recordPayment(
        invoice.id,
        { amount: 50, paymentMethod: 'CASH', idempotencyKey },
        standardAccountant
      );

      const secondCall = await paymentService.recordPayment(
        invoice.id,
        { amount: 50, paymentMethod: 'CASH', idempotencyKey },
        standardAccountant
      );

      assert.strictEqual(firstCall.id, secondCall.id);
      assert.strictEqual(secondCall.isDuplicate, true);
    });
  });

  describe('5. Payment Voiding & Recalculation', () => {
    test('should void payment and revert invoice status back to PARTIALLY_PAID', async () => {
      // Find the ₹3,000 card payment on testInvoice
      const payments = await prisma.payment.findMany({
        where: { invoiceId: testInvoice.id, status: 'COMPLETED' },
      });
      const cardPayment = payments.find((p) => Number(p.amount) === 3000);
      assert.ok(cardPayment);

      const voidResult = await paymentService.voidPayment(
        cardPayment.id,
        'Customer credit card chargeback requested',
        standardAccountant
      );

      assert.strictEqual(voidResult.status, 'VOIDED');
      assert.strictEqual(voidResult.invoice.paidAmount, 2000);
      assert.strictEqual(voidResult.invoice.outstandingAmount, 3000);
      assert.strictEqual(voidResult.invoice.status, 'PARTIALLY_PAID');
    });
  });

  describe('6. Refund Lifecycle & Cancelled Surplus Rules', () => {
    test('should request, approve and process refund for surplus/paid amount', async () => {
      // Request refund of ₹1,000 on remaining ₹2,000 paid amount
      const reqRefund = await refundService.requestRefund(
        testInvoice.id,
        { amount: 1000, reason: 'Partial service cancellation', refundMethod: 'UPI' },
        standardAccountant
      );
      assert.strictEqual(reqRefund.status, 'REQUESTED');
      assert.strictEqual(reqRefund.amount, 1000);

      // Senior Approver approves
      const appRefund = await refundService.approveRefund(reqRefund.id, seniorApprover, 'Approved by Finance Head');
      assert.strictEqual(appRefund.status, 'APPROVED');

      // Process refund
      const procRefund = await refundService.processRefund(
        reqRefund.id,
        { refundMethod: 'UPI', transactionRef: 'UPI-REFUND-888' },
        standardAccountant
      );
      assert.strictEqual(procRefund.status, 'PROCESSED');
      assert.strictEqual(procRefund.invoice.refundedAmount, 1000);
    });

    test('should reject refund exceeding total refundable net payments', async () => {
      await assert.rejects(
        async () => {
          await refundService.requestRefund(
            testInvoice.id,
            { amount: 2000, reason: 'Exceeding refund balance' },
            standardAccountant
          );
        },
        (err) => {
          assert.strictEqual(err.statusCode || err.status, 400);
          assert.match(err.message, /cannot exceed refundable amount/i);
          return true;
        }
      );
    });
  });

  describe('7. Expense Management & Duplicate Warning', () => {
    test('should record an expense and detect duplicate warning on repeated submission', async () => {
      const uniqueVendor = `BioMed Reagents ${Date.now()}`;
      const payload = {
        title: 'Diagnostic Reagents Restock',
        category: 'LAB_REAGENTS',
        amount: 15400,
        vendorName: uniqueVendor,
        referenceNumber: `BIO-${Date.now()}`,
        description: 'Hematology and biochemistry reagent kits',
      };

      const expense = await expenseService.createExpense(payload, standardAccountant);
      assert.ok(expense.id);
      assert.ok(expense.expenseNumber.startsWith('EXP-'));
      assert.strictEqual(expense.amount, 15400);

      // Attempt recording identical duplicate without confirmation
      await assert.rejects(
        async () => {
          await expenseService.createExpense(payload, standardAccountant);
        },
        (err) => {
          assert.strictEqual(err.statusCode, 409);
          assert.match(err.message, /Potential duplicate expense detected/i);
          return true;
        }
      );

      // Successfully record with confirmDuplicate = true
      const confirmedDuplicate = await expenseService.createExpense(
        { ...payload, confirmDuplicate: true },
        standardAccountant
      );
      assert.ok(confirmedDuplicate.id);
    });
  });

  describe('8. Derived Unified Transactions Stream & Cash Flow Balance', () => {
    test('should derive transaction stream with accurate inflow, outflow, and net balance', async () => {
      const stream = await transactionService.getTransactions({ limit: 100 });
      assert.ok(stream.transactions.length > 0);
      assert.ok(typeof stream.summary.totalInflow === 'number');
      assert.ok(typeof stream.summary.totalOutflow === 'number');
      assert.ok(typeof stream.summary.netCashFlow === 'number');

      // Mathematical identity: netCashFlow === roundMoney(totalInflow - totalOutflow)
      assert.strictEqual(
        stream.summary.netCashFlow,
        roundMoney(stream.summary.totalInflow - stream.summary.totalOutflow)
      );

      // Check transaction item shape
      const sample = stream.transactions[0];
      assert.ok(sample.transactionNumber);
      assert.ok(['PAYMENT', 'REFUND', 'EXPENSE'].includes(sample.type));
      assert.ok(['CREDIT', 'DEBIT'].includes(sample.direction));
    });
  });

  describe('9. Financial Reports & CSV Formula Injection Protection', () => {
    test('sanitizeCsvCell should neutralize spreadsheet formulas with single quote prefix', () => {
      assert.strictEqual(sanitizeCsvCell('=SUM(A1:B10)'), '"\'=SUM(A1:B10)"');
      assert.strictEqual(sanitizeCsvCell('+12345'), '"\'+12345"');
      assert.strictEqual(sanitizeCsvCell('-500'), '"\'-500"');
      assert.strictEqual(sanitizeCsvCell('@ADMIN'), '"\'@ADMIN"');
      assert.strictEqual(sanitizeCsvCell('Normal Text'), '"Normal Text"');
      assert.strictEqual(sanitizeCsvCell('Text with "quotes"'), '"Text with ""quotes"""');
    });

    test('exportReportCsv should produce UTF-8 BOM CSV for daily collections and aging', async () => {
      const collectionsCsv = await financialReportService.exportReportCsv('daily_collections', {});
      assert.ok(collectionsCsv.csv.startsWith('\uFEFF'));
      assert.ok(collectionsCsv.csv.includes('Payment #'));
      assert.ok(collectionsCsv.filename.endsWith('.csv'));

      const agingCsv = await financialReportService.exportReportCsv('aging_outstanding', {});
      assert.ok(agingCsv.csv.startsWith('\uFEFF'));
      assert.ok(agingCsv.csv.includes('Aging Bucket'));
    });
  });
});
